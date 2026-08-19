# Handoff: Partimos — app móvil de viajes compartidos (Panamá)

## Overview

Partimos is a **carpooling app for Panama**: a passenger searches a route, books a seat with a driver already making that trip, and pays a per-seat contribution in-app. It sits between the long-distance carpool model and ride hailing — trips are **published in advance, priced per seat with a route cap, and the contribution is held until arrival**.

This package contains a **complete high-fidelity design** of that app: **58 screens** covering both journeys end to end (passenger and driver), plus the decision documents behind them. Every dead end found in a self-audit has been closed — there is no button in these designs that leads nowhere.

Interface language is **Spanish (Panama)**. Currency is USD written the Spanish way: `6 $` (amount, hard space, symbol), comma decimals, 24-hour clock with leading zero.

## About the design files

The five `.dc.html` files in this bundle are **design references created in HTML** — prototypes that show intended look and behaviour. They are **not production code to copy**. Several are interactive (steppers, switches, radio groups recompute prices and copy live) so you can see the intended behaviour, but they are driven by a small throwaway state object, not by an architecture worth porting.

**Your task is to recreate these designs in the target codebase's environment**, using its established patterns and libraries. If no mobile environment exists yet, choose the framework and implement there. See "Relationship to the existing repo" below — this is a **new mobile app**, not a change to the existing website.

## Fidelity

**High-fidelity.** Final colours, typography, spacing, radii, shadows and copy. Recreate the UI pixel-accurately using the codebase's own component library where one exists. Every screen is drawn at **390 × 844** (iPhone 14/15 logical size). All values in "Design tokens" are exact.

## Relationship to the existing repo

`eslmilan-sys/test`, path `partimos/` — a **marketing/booking website** with routes `/`, `/buscar`, `/viaje/[ruta]`, `/ya`, `/viajes`, `/publicar`, `/cuenta`, `/ayuda`, `/seguridad`, `/como-funciona`.

The designs in this package are a **native-feeling mobile app**, a different product surface from that site. Treat the site as:
- the **source of truth for Spanish copy** (voice, terminology, legal wording),
- the **source of truth for business rules already written down** (how payment works, the safety promises),
- **not** the code to extend.

Two things should stay in sync between site and app: the fee percentages and the refund rules. Everything else can diverge.

## The two journeys

The product has exactly two paths, and the difference between them is **where the account gate sits**.

**Passenger — 17 steps. Searches first, account later.**
A passenger can install, search, see complete results with prices, and open a trip detail **without an account**. The gate is step 06, when they tap "Pedir puesto" — by then they know what they get for signing up. Then: propose a pickup point → pay → wait for the driver's yes → travel → rate.

**Driver — 14 steps. ID verification first.**
A driver cannot publish without a verified national ID (cédula), so that is step 03. Then: register the car → publish (the contribution is calculated for them) → manage the trip → **accept a request, which is the moment money is charged** → get paid weekly.

The two journeys share exactly three screens: the trip chat, the boarding code, and the in-transit screen.

Screens `13a`/`13b` in `Partimos App Hi-Fi - Plan.dc.html` render both journeys as step tables (`action → screen`), with every screen id hyperlinked. **Read those two first** — they are the map for everything else.

## Business rules — read before building UI

These are decided, not decorative. Several screens exist only to express them, and getting them wrong breaks the product's whole premise (which is *not* being a taxi).

### Money

| Rule | Value |
| --- | --- |
| Contribution ("aporte") per seat | Set by the driver, default **calculated**, hard cap per route |
| Default calculation | `ceil(trip_cost / (seats + 1))`, clamped to `[3, route_cap]` — the driver counts as one payer |
| Reference trip | Albrook → Chitré, 250 km, 3 h 30, cost **20,60 $**, cap **7 $**, resulting default **6 $** |
| Yappy fee | **5 %** (0,30 $ on 6 $) — cheapest, the default in Panama |
| Card fee | **8 %** (0,48 $ on 6 $) |
| Cash | **no fee**, paid to the driver on boarding |
| Driver receives | The **full contribution**, with every method. The fee is Partimos's and is added on top of what the passenger pays. |
| Driver payout | Weekly, Mondays, to their Yappy |

**The cap is the anti-taxi mechanism.** A driver can never price above the route cap. Nobody profits; the contribution covers fuel and tolls. Screens `5d` and `16b` say this out loud.

### When money moves

1. Passenger requests a seat → **nothing is charged**
2. Driver accepts → contribution is **held** (not the driver's yet)
3. Trip runs → still held
4. Arrival confirmed → **released to the driver**

A seat request **expires in 4 hours** if the driver does not act.

### Refunds

The rule and the amount change with the reason. Screen `7d` is the picker, `15c` the status.

| Reason | Rule | Amount on a 6 $ + 0,30 $ trip |
| --- | --- | --- |
| Passenger cancelled, > 2 h before departure | Full, fee included | 6,30 $ |
| Passenger cancelled, < 2 h before departure | Contribution minus 1 $, kept by the driver for the lost seat | 5,00 $ |
| Driver cancelled | Full, and we offer another car at the same time first | 6,30 $ |
| Driver never showed | Full, after checking the boarding code was never marked; driver receives nothing | 6,30 $ |
| Trip never happened | **Automatic** 2 h after scheduled departure, no user action | 6,30 $ |

Payout window: 24 h for the no-show case, 3–5 business days otherwise, automatic for the last.

### Luggage — deliberately simple

Do **not** build a luggage-space accounting system. It was designed that way first and thrown out for being unusable.

- The driver sets **one boolean** when publishing: "Acepto maletas" (screen `5c`).
- The passenger's booking form **adapts to that boolean** (screen `7a`): switch on → a "Maleta" stepper appears alongside "Mochila"; switch off → only "Mochila", with the line "Andrés no lleva maletas en este viaje".
- Result cards show one of two strings: **"Acepta maletas"** or **"Solo mochila"**.
- A backpack always travels with the passenger and never counts.

### Boarding

Every passenger gets a **4-digit boarding code** (`1f` passenger side, `1g` driver side). The driver marks each passenger on boarding. That mark is what proves the trip happened; the no-show refund depends on it.

### Safety

- ID verification is **mandatory for drivers**, so never render "verified" as a filter or a badge that distinguishes drivers — they all are.
- "Solo mujeres" is a trip attribute a driver sets when publishing; it filters results and hides the trip from men.
- Reporting (`15d`) puts the **national emergency number 104** first, with the plate and route ready to hand over, and only then asks what happened. Blocking is in the same place, and the reported person is never told.

## Screens

58 screens across five boards. Each board is one `.dc.html` file; open it and you see that group side by side, in journey order. Ids like `7a` are stable and used throughout this document.

### A · `Partimos App Hi-Fi.dc.html` — Passenger: find and enter (14)

| Id | Screen | Purpose |
| --- | --- | --- |
| `4a` | Apertura | First launch. Full-bleed red field with the city skyline silhouette. |
| `1a` | Bienvenida | Three departures offered with no account. |
| `3a` | Inicio | The search, saved routes, and the driver hook. |
| `1b` | Resultados (sin cuenta) | Complete results — price, seats, luggage, driver — before signing up. |
| `3b` | Resultados | Same list with a filter applied. |
| `3c` | Resultados, destino de fondo | Variant with a destination photograph. |
| `5a` | Detalle del viaje | Map, route, person, money. |
| `6b` | Perfil público | What the other party sees before boarding. |
| `1c` | La Puerta | **The account gate.** Only reached by tapping "Pedir puesto". |
| `4b` `4c` `4d` | Registro 1–3 | Phone → SMS code → name. |
| `4e` `14e` | Entrar | Login for an existing account; the phone number is the key. |

### B · `Partimos App Hi-Fi - Viaje.dc.html` — Passenger: pay and travel (14)

| Id | Screen | Purpose |
| --- | --- | --- |
| `7a` | Reserva | Passenger types their own pickup address, with the minutes it adds to the driver's route shown. Luggage steppers adapt to the driver's boolean. |
| `7b` | Pago del aporte | Yappy / card / cash; picking one rewrites total, button and retention note. |
| `9a` | Métodos de pago | Saved methods, each with its fee, default applied on tap. |
| `14c` | Añadir método | Yappy or card; fee shown at display size before saving. |
| `12a` | Pantalla bloqueada | Lock-screen push carrying its actions — the only dark-glass surface. |
| `11b` | Bandeja de avisos | Action-needed pinned above informational. |
| `6c` | Chat del viaje | Where the pickup point is agreed in writing. |
| `16a` | Conversaciones | All threads, each with its trip context. |
| `1d` `1e` | Ya | Departure day — list variant and map variant. |
| `1f` | Código de abordaje | Passenger side. |
| `1h` | En ruta | Dark map, glass, contribution visible. |
| `1i` | Llegada | The code closes the trip and releases the contribution. |
| `1j` | Calificar | One question, four shortcuts. |

### C · `Partimos App Hi-Fi - Conductor.dc.html` — Driver: from ID to payout (13)

| Id | Screen | Purpose |
| --- | --- | --- |
| `6d` | Verificación de cédula | Three steps, and what is not stored. **Blocks publishing.** |
| `6a` | Cuenta | Who you are and what is missing. |
| `14b` | Registrar el carro | Brand → model → year from **our catalogue** (no free text); colour swatches; seats derived from the model; **photo of the car from behind with a legible plate, mandatory**. |
| `5c` | Publicar | One screen: registered car, intermediate stops, **contribution calculated automatically**, seats, luggage boolean, women-only, and publish. |
| `5d` | El tope | The cap and the cost split. |
| `7c` | Puestos y maletas | Detail view of seats + luggage. |
| `10a` | Panel del conductor | Trip cards; **pending requests pinned at top in red with their 4 h expiry**. |
| `5b` | Mis viajes | Today's trip dominates. |
| `14d` | Editar el viaje | Fields a paid passenger has locked are shown padlocked with the reason. |
| `11a` | Solicitudes de puesto | **Where money is charged.** Who, where they board, what luggage. Accept turns the card into a receipt. |
| `15e` | Quién pide puesto | The requester's profile — fixes the asymmetry where only passengers could vet. |
| `1g` | Código de abordaje | Driver side; marks each passenger. |
| `10b` | Lo que te han aportado | Monthly total, per-trip breakdown, Monday payout. |

### D · `Partimos App Hi-Fi - Deshacer y ayuda.dc.html` — Undo, claim, ask (10)

| Id | Screen | Purpose |
| --- | --- | --- |
| `14a` | Cancelar el puesto | Reason picker; the refund rule and amount change with it, shown **before** confirming. |
| `7d` | Reembolso | Starts from what happened. |
| `15c` | Estado del reembolso | Four dated steps, no banking jargon. |
| `15b` | Ayuda | Your trip first, then the four things that actually go wrong, then FAQs. |
| `15d` | Reportar | 104 first, then reason, then block. |
| `15a` | Rutas guardadas | Destination of "Avisarme"; a switch per route. |
| `8a` | Ajustes | Notices, trip, money, account. |
| `16b` | Cómo se paga | The three numbers and the money clock. |
| `16c` | Comprobante | Passenger's receipt. Explicitly **not an invoice** — Partimos sells no transport. |
| `16d` | Permiso de avisos | Pre-permission: three concrete reasons, then the OS dialog. |

### E · `Partimos App Hi-Fi - Plan.dc.html` — Plan and decisions (7 documents)

`13a` `13b` `13c` the two journeys as step tables · `12b` the notification event map (which event, to whom, which channel, does it carry an action) · `2a` `2b` `2c` the three reds compared, with the chosen one · plus the closed audit and the decision notes.

## Interactions & behaviour

Recreate these; they are the designed behaviour, not prototype decoration.

**`5c` Publicar.** Changing the seat stepper **recalculates the contribution** and rewrites the publish button label ("Publicar · 3 puestos a 6 $") and the cost line ("Gasolina y peajes: 20,60 $. Con 3 puestos recuperas 18 $ de 20,60 $."). A pill next to the amount says whether it is `calculado`, `lo pusiste tú`, or `tope de la ruta`. Stops can be added and removed; the arrival time moves with them; the add link **names the next stop** ("Añadir Aguadulce") rather than saying "add stop".

**`7a` Reserva.** The luggage rows are conditional on the driver's boolean. The badge and helper line restate the state ("Acepta maletas" / "Solo mochila").

**`7b` Pago and `9a` Métodos.** Selecting a method rewrites the fee line, total, button label and retention note. Cash changes "Pagas ahora" to "Pagas al subir" and the button to "Confirmar el puesto".

**`11a` Solicitudes.** Accept → the card becomes a receipt ("Aceptado · le cobramos 6 $"), the seat counter decrements, the header recounts. Decline asks no reason. A request under 1 h from expiry gets a **solid red** pill; others get pale red.

**`14b` Registrar el carro.** Brand cycles the catalogue; changing brand resets the model; changing model sets the seat count.

**`14d` Editar.** Locked fields render at reduced opacity with a padlock. Turning off "Acepto maletas" when a passenger booked with a suitcase turns the warning **red**.

**`7d` / `14a` Refunds.** The reason drives rule text, amount and payout window.

**`11b` / `15a` Notices.** Tap marks read and the unread counter follows. Route switches turn the notice off while keeping the route saved.

**`10b` Aportes.** Este mes / Todo switches both the headline figure and the list.

## State

Small and local. Nothing here needs a global store beyond the session.

- **Trip search**: origin, destination, date, applied filters (`acepta_maletas`, `solo_mujeres`, payment method)
- **Booking draft**: pickup address, backpack count, suitcase count (only if the driver accepts luggage), payment method
- **Publish draft**: car id, stops[], contribution (null = use calculated), seats, accepts_luggage, women_only
- **Requests**: per request `pendiente | aceptada | rechazada` + expiry timestamp
- **Notices**: read ids
- **Refund**: selected reason

Server-side truths you will need: the route cap table, the trip cost estimate (fuel + tolls by distance), the payment hold/release state machine, boarding-code verification, and the weekly payout batch.

## Design tokens

The full token set ships as CSS custom properties in `design_system/tokens/`. The values below are the ones you cannot get wrong.

### Colour — the flag, with jobs

The identity comes from the flag of Panama, and the two colours **have separate jobs**:

- **Azul `#005293` owns surfaces** — headers, informational bars, eyebrows, dark chrome. It is what you sit *on*. Never the main call to action.
- **Rojo `#D21034` owns interaction** — buttons, links, active states, the publish FAB, the live route leg. It is what you *touch*.
- **The two never touch.** White or sand always sits between them. This is from the flag, and it is also what stops the gradient turning purple.

| Token | Value | Use |
| --- | --- | --- |
| `--rojo-500` | `#D21034` | Every primary action |
| `--rojo-700` | `#8C0A22` | Danger text, destructive outline |
| `--rojo-100` / `--rojo-50` | pale red tints | Urgent pills, soft red backgrounds |
| `--azul-500` | `#005293` | Surfaces, eyebrows, the in-sheet action |
| `--azul-700` | `#003A69` | Azul text on tint |
| `--azul-100` | `#DBE7F0` | Informational pills |
| `--ink-900` | `#26232B` | Text. Warm charcoal, not black. |
| `--ink-600` | `#6B6672` | Body copy |
| `--sand-100` / `--sand-200` | warm off-whites | Page and neutral fills |
| `--oro-500` | `#E0A83C` | Rating stars, nothing else |

**No black bars, no black tab bar, no black buttons.** Large ink fills next to rojo read like a games console.

### The red field — the screen archetype

Every primary screen opens with a red gradient field carrying an uppercase eyebrow, an oversized two-weight headline, and one supporting line. A **white sheet then overlaps the field's lower edge** with a red-tinted shadow; everything below returns to sand.

```css
background:
  radial-gradient(86% 60% at 88% 0%, rgba(255,216,188,.34) 0%, rgba(255,216,188,0) 62%),
  radial-gradient(96% 76% at 2% 100%, rgba(94,7,23,.62) 0%, rgba(94,7,23,0) 70%),
  linear-gradient(166deg, #DD1D3F 0%, #D21034 44%, #AF0B29 100%);
```

Field height: **326px** on a home screen, **186–214px** on a secondary one. Sheet shadow: `0 18px 40px -18px rgba(120,10,30,.28)`.

Three rules: the action **inside the sheet is azul**, not rojo (red on red does not read); controls sitting **on** the field are 40px circles at `rgba(255,255,255,.18)`, never glass; one field per screen, and nothing below the subtitle sits on the red.

### Typography

One neutral grotesk. `"Helvetica Neue", Helvetica, "Inter Tight", Arial` — real Helvetica Neue on Apple, **Inter Tight** elsewhere.

| Role | Size / weight / tracking |
| --- | --- |
| Screen headline | 31–33px / 400 with a 600 span inside / `-.04em` |
| Secondary headline | 27–28px / 400 / `-.042em` |
| Card title | 15.5–16px / 500 / `-.018em` |
| Body | 13.5–14.5px / 400 / 1.45 |
| List row | 14.5–15px / 500 / `-.015em` |
| Eyebrow | 11px / 600 / uppercase / `--track-micro` |
| Price | 26–44px / **700** / `-.045em` |
| Pill | 10.5–11.5px / 600 |

**Two weights inside one line** is a signature: `Albrook → **Chitré**`, `Hola, **Mateo**`. Never weight 300.

**There is no monospace.** Times, prices, plates and durations use the UI font with `font-variant-numeric: tabular-nums` so columns align without a technical voice.

### Space, radii, elevation

Four numbers set the product: **26px screen gutters**, **32px between sections**, **8–10px between sibling cards**, **22px inside a card** (26 for sheets). List rows 60px with 15px vertical padding. Sections are separated by **space, not rules** — hairlines appear only *inside* a card.

| Token | Value |
| --- | --- |
| `--radius-sheet` | 26px |
| `--radius-l` | 20px |
| `--radius-square` | 12px (the flag-quadrant motif: avatars, tiles, the FAB) |
| `--radius-pill` | 999px |
| `--shadow-s` | `0 1px 2px rgba(38,35,43,.06), 0 4px 12px -6px rgba(38,35,43,.10)` |
| `--shadow-l` | `0 24px 60px -24px rgba(38,35,43,.30)` |

### Glass — one translucent layer, and where it is forbidden

What makes glass read as glass is the **edge**, not the blur: a hairline plus an inset top highlight over a shadow. Blur is `saturate(180%) blur(22px)` — the saturation is what keeps the colour behind it alive instead of grey.

Glass only exists **on top of something with colour** (the gradient, an azul header, a night map). Over the plain sand page it turns grey and dirty — use a plain card. Never glass on glass, never over body text, never more than two glass layers on a screen. Used in `1h`, `1c`, `1d/1e` (light) and `12a` (dark).

## Content and voice

- Address the user as **tú**, never *usted*. "We" only when we are doing something for them.
- **Sentence case everywhere.** UPPERCASE only for eyebrows and date stamps, always with micro-tracking.
- **Buttons are verb-first, two or three words**: "Buscar viajes", "Pedir puesto", "Publicar viaje", "Aceptar · 6 $". Not "Continuar", never "¡Vamos!".
- **No exclamation marks anywhere.** No emoji, in UI or notifications. The rating star is an SVG path, not ★.
- **Money and safety copy is factual and specific**: "Se retiene hasta la salida. Si el viaje se cancela, se devuelve entero."
- **Say the consequence before the confirm**, not after. Cancel screens show what comes back and why while you can still back out. Destructive buttons are **outlined red with red text, never filled** — filled red is what you tap to go forward.
- Errors never blame: "No hemos podido cobrar la tarjeta", not "Tu pago ha fallado".
- Empty states name the situation, then offer one action.
- Screen titles ≤ 24 characters; supporting lines ≤ 90.

## Notifications

`12b` is the full event map. The five rules:

1. The title says what happened; the second line carries route and time.
2. **If there is an action, it goes inside the push.** Accepting a seat request without opening the app is the difference.
3. One event, one notice. Only money repeats across two channels.
4. **Permission is asked when it already matters** — on booking or on publishing, never on launch (`16d`).
5. No promotions. If it is not your trip, we do not write.

## Assets

- `assets/pa-skyline-tornillo.svg` — layered city skyline with the Tornillo tower, supplied by the client, converted to a **silhouette** (sky and ground plates removed, three depth layers collapsed to one ink at 34/58/82 % opacity). Used at the base of the red field in `4a`.
- `assets/pa-skyline.svg`, `assets/pa-mapa.svg`, `assets/pa-palmera.svg`, `assets/pa-hibisco.svg` — Panama motifs used as **watermarks only on red fields**, dark ink at 20–26 % opacity, cropped by the field edge. Never over text.
- **Icons are inline SVG**, 1.6–1.8 stroke, round caps, drawn per screen. Replace with the codebase's icon set; keep the weight.
- **Destination photography, client-supplied**: `assets/chitre.jpeg`, `assets/david.jpeg`, `assets/boquete.jpeg`, `assets/playa-blanca.jpeg`, `assets/chorrera.jpeg`, `assets/venao.webp`. Used three ways — full-bleed behind the red block in `3c`, 52 × 40 thumbnails in the popular-routes list in `3a`, and a 64px band on the departure cards in `1a`. All `object-fit: cover`. Every destination in the product needs one; the six here cover the routes shown.
- Two mechanics from the original references are **still not implemented for lack of material**: cut-out photography breaking a card edge, and a tactile hero shot (phone in hand on a real surface).
- **No logo file was supplied.** The mark is drawn as a four-square quadrant grid (the flag geometry) — see the top of `14e` and `12a`.

## What is not designed, and is engineering

Honest scope line. None of these are missing screens; they are systems:

- **Real Yappy integration.** Yappy has its own SDK and merchant onboarding. The designs assume a hold/capture/refund model.
- **Cédula verification** against the Panamanian registry. `6d` shows the capture flow, not the check.
- **Real maps.** Every map in these designs is a placeholder block. Route geometry, ETA and the live in-transit position in `1h` need a real provider.
- **The payment hold state machine** and the weekly payout batch.
- **Push delivery** and the event map in `12b` wired to real triggers.

## Files

| File | Contents |
| --- | --- |
| `Partimos App Hi-Fi.dc.html` | Board A — passenger: find and enter (14 screens) |
| `Partimos App Hi-Fi - Viaje.dc.html` | Board B — passenger: pay and travel (14) |
| `Partimos App Hi-Fi - Conductor.dc.html` | Board C — driver: ID to payout (13) |
| `Partimos App Hi-Fi - Deshacer y ayuda.dc.html` | Board D — undo, claim, ask (10) |
| `Partimos App Hi-Fi - Plan.dc.html` | Board E — journeys, event map, colour decisions, audit |
| `design_system/` | Token CSS and the component bundle these designs compose with |
| `assets/` | The SVG motifs |
| `ref/content-map.md` | Spanish strings extracted from the existing website |

Open any board in a browser. Screens sit side by side in journey order, grouped under phase labels, with a nav bar linking the other four boards.

**Suggested build order**, which is also the order of risk: `5c` publish (it encodes the whole pricing model) → `11a` accept (where money moves) → `7a`/`7b` book and pay → `1f`/`1g` boarding codes → `1i` arrival and release → then the passenger discovery screens, then the edges.
