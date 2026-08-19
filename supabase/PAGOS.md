# Pago en línea — Yappy + tarjeta, sur Supabase

Décision produit (2026-08-12, amendée le même jour) : trois canaux,
présentés partout dans cet ordre — **Yappy dans l'app** (recommandé,
tarifa de servicio **2,5 %**), **tarjeta dans l'app** (tarifa **5 %**),
**efectivo** en dernier (gratuit, toujours disponible). La tarifa est
fixe PAR CANAL parce qu'elle suit le coût du canal : Yappy commerçant
coûte ~1 %, un processeur carte ~3,5–4 % — la marge du service (~1,5 pt)
est la même sur les deux canaux en ligne, et le canal recommandé est
aussi le moins cher pour le passager. Le conducteur reçoit son aporte
**complet** dans les trois cas. La doctrine : la tarifa rémunère le
service digital de réservation, jamais le transport — c'est le modèle
BlaBlaCar, et c'est ce qui garde le partage de frais intact. ⚠️ Fais
valider cette structure par un avocat panaméen avant le premier cobro
réel — les CGU (`/terminos`) sont déjà rédigées dans ce sens.

## Architecture (identique à Didit : les secrets vivent dans Supabase)

```
navigateur ── JWT ──▶ pago-crear (Edge Function)
                        │ crée l'ordre chez le PSP (secret côté serveur)
                        │ insère payments (status=initiated)
                        ▼
              le passager paie chez le PSP (page/app hébergée)
                        ▼
             pago-webhook (Edge Function, signature vérifiée)
                        │ payments.status = captured
                        │ ledger : passenger_escrow → driver_payable
                        ▼
        payout hebdomadaire au conducteur (payout_batches, ACH/Yappy)
```

Le schéma 0001 avait tout prévu : `payments` (avec `provider_order_id`
pour le Botón de Pago Yappy), `payout_batches`, `ledger_entries`
(comptes `passenger_escrow`, `driver_payable`, `platform_revenue`,
`psp_fees`). La migration 0009 ajoute le canal choisi, la 0010 grave la
tarifa par canal en contrainte : 0 hors app, 2,5 % Yappy, 5 % tarjeta —
et le moyen favori (`profiles.preferred_pay_channel`), choisi à
l'inscription, qui présélectionne le canal à la réservation.

## 1. Yappy — le Botón de Pago ⛔ (tes comptes)

Yappy appartient à Banco General ; le produit marchand s'appelle
**Botón de Pago Yappy**.

1. Ouvre une **cuenta comercial** à Banco General et active **Yappy
   Comercial** (l'app Yappy Comercial, avec ton RUC).
2. Dans le portal Yappy Comercial, active le **Botón de Pago** et crée
   les credentials API : un `merchantId` et une clé secrète, plus le
   domaine autorisé (mets `eslmilan-sys.github.io`, puis ton domaine
   final).
3. `supabase secrets set YAPPY_MERCHANT_ID=... YAPPY_SECRET_KEY=...`
4. Flux technique : `pago-crear` appelle l'API du Botón pour créer
   l'ordre (`orderId`, montant = aporte + tarifa), renvoie l'URL/QR
   Yappy ; sur téléphone ça ouvre l'app Yappy directement. Le webhook
   de confirmation (IPN) revient signé — vérifier la firme avec la clé
   secrète avant d'écrire `captured`.
5. Sandbox : le portal fournit un environnement de pruebas — teste tout
   là avant la production. Commission Yappy commerçant : ~1 % (à
   confirmer dans ton contrat) — elle se loge dans `payments.fee_cents`
   et le compte ledger `psp_fees`.

## 2. Tarjeta — quel processeur au Panama ⛔

Stripe n'accepte pas de marchands panaméens. Les options sérieuses :

- **PagueloFacil** — local, accepte Visa/Mastercard/Clave, checkout
  hébergé (LinkDeamon/API), onboarding avec RUC. Le plus courant.
- **Tilopay** — régional (Centroamérica), bonne API, checkout hébergé,
  antifraude inclus.

Dans les deux cas, prends le **checkout hébergé** : la carte est
saisie chez EUX, jamais chez nous — ta charge PCI tombe au niveau
SAQ-A (le plus léger) et aucun numéro de carte ne traverse Partimos.
Même montage : `pago-crear` crée la transaction côté serveur avec la
clé secrète, redirige vers leur page, leur webhook signé confirme.

## 3. Sécurité — les règles non négociables

- Secrets uniquement dans `supabase secrets` — jamais dans le dépôt,
  jamais dans le JS du site (le site est statique et public).
- Webhooks : vérifier la **signature** et appliquer une fenêtre
  anti-rejeu ; écriture idempotente par `UNIQUE (provider,
  provider_ref)` (déjà dans 0001).
- Montants recalculés CÔTÉ SERVEUR dans `pago-crear` depuis la base
  (aporte de la réservation + la tarifa du canal : 2,5 % Yappy, 5 %
  tarjeta) — jamais reçus du client.
- Remboursements : suivre les règles d'annulation existantes (100 % à
  +24 h, aporte entre 24 h et 2 h, 50 % retenu en deçà) — le cobro en
  ligne les rend enfin exécutables automatiquement.
- Jamais de table de solde mutable : le ledger reste la seule vérité.

## 4. Versement au conducteur

Le pilote : lots hebdomadaires manuels (`payout_batches`), virement
ACH Banco General ou Yappy au numéro du conducteur. Le conducteur voit
dans Mi cuenta : aporte dû, viaje par viaje, et la date du prochain
versement. À automatiser plus tard — la table ne change pas.

## 5. Ce que le site montre déjà

Le panneau de réservation propose les trois canaux dans l'ordre (Yappy
recommandé, tarjeta, efectivo en dernier) avec le calcul transparent
(aporte + tarifa du canal = total) et un bouton « Pagar con Yappy » aux
couleurs de la marque — le futur Botón de Pago. Les CGU ont la clause
« El pago — tres vías », le favori se choisit à l'inscription et dans
Mi cuenta, et le mode démonstration dit clairement qu'aucun cobro réel
n'a lieu tant que le processeur n'est pas branché.
