# Partimos — the design system

> Chosen by the user for **both surfaces**: the app and the site. The tokens in
> `design_system/tokens/` are the reference, not an inspiration. `../DESIGN.md`
> describes the site's previous system and is superseded.

Partimos is a shared-mobility app for Panama: riders search a route, book a seat
with a driver going the same way, and travel together. The product family sits
between the long-distance carpool model and on-demand ride hailing: trips are
published in advance, priced per seat, with driver identity, rating and vehicle
shown before booking.

The brand is warm, plain-spoken and quietly confident. The identity comes from
the flag of Panama — its two colours and, more importantly, its four-square
quadrant geometry. Launch market is Panama. **Interface strings are Spanish,
prices in US dollars, documentation is English.**

## The palette rule, which is the whole identity

- **Azul `#005293` owns surfaces** — headers, hero fields, bars, dark chrome,
  the base route line, `Card tone="brand"`. It is the colour you sit on, and it
  is never the main call to action.
- **Rojo `#D21034` owns interaction** — every button, link, active tab, the live
  route leg, the publish FAB. It is the colour you touch.
- **White is structural: it keeps the two apart.** Rojo and azul never touch.
  Wherever both appear, white or sand sits between them. Taken from the flag,
  and it is also what stops the gradient muddying into purple.

**Ink is warm charcoal `#26232B`, used sparingly** — text and hairlines. Large
ink fills next to rojo read like a games console rather than a minimal app: no
black bars, no black tab bar, no black buttons in product UI. The tab bar is
off-white with a hairline and a rojo active state.

**Danger cannot be red**, because red is what you tap. Errors use `--text-danger`
(`rojo-700`, darker than any button) **with an alert icon and an explicit
label**, never colour alone. Destructive buttons are outlined with red text,
never filled. Success is green; information is azul.

## The screen archetype — Bandera

Every primary screen opens with a red field. `--grad-bandera` fills the top
**326px** of a home screen (**186–214px** on a secondary one), carrying an
uppercase eyebrow, an oversized two-line headline in two weights, and one
supporting line. Then a **white sheet overlaps the field's lower boundary by
60–80px** with a red-tinted shadow, and everything below returns to sand,
hairlines and air.

Three rules make it work:

1. **The action inside the sheet is azul, not rojo** — red owns the field, and
   red on red does not read.
2. **Controls on the field are 40px circles at `rgba(255,255,255,.18)`.** Never
   glass, never white pills.
3. **One field per screen**, and nothing below the subtitle sits on the red. All
   content belongs on the sheet.

**The route line** threads the sheet and every trip surface: a 1.5px rail with
10px nodes, solid rojo where the journey has happened and a hollow 2px ink ring
where it hasn't. It is the one gesture that appears on every screen.

**The gradient survives in exactly one place per screen flow** — a single
earning or confirmation card, blurred inside its own radius. It is not
furniture.

## Signature mechanics

1. **Gradient inside the card, bottom-anchored** — a light source rising from a
   card's bottom edge, not a background behind it. Controls are meant to sit on it.
2. **Full azul panel with cards floating clear of it**, crossing its lower boundary.
3. **Stacked full-width button pairs** — filled rojo above outlined charcoal.
   Decisions read faster stacked than side by side on a phone.
4. **Coloured uppercase eyebrows section a screen instead of dividers** — azul
   for ordinary sections, rojo for live or urgent ones.
5. **Two weights inside one line** — `Panamá → **David**`, 400 beside 600, no
   colour needed for emphasis.
6. **Square monogram tiles, tint-on-tint** — the hue derives from the person's
   name, so a driver keeps their colour across screens.
7. **Active tab is a filled rojo pill with its label inline**; inactive tabs are
   icon-only and dimmed.
8. **Oversized number with a tiny rotated pill beside it** — the price at display
   size, `por plaza` as a 10.5px pill rotated −8°. One per card, never more.
9. **Applied filters are tinted chips with a solid dot X.** Plain choosers stay
   neutral; colour means applied.

## Glass — the one translucent layer

Light glass over the gradient, an azul header or photography; dark glass over a
night map. What makes it read as glass is **not the blur but the edge**: a
hairline plus an inset top highlight, over a shadow. Blur is
`saturate(180%) blur(22px)` — the saturation boost keeps the colour behind it
alive instead of grey.

**Where glass is forbidden:** over the plain sand page (it turns grey and
dirty — use a plain card). Never glass on glass, never over body text, never
more than two glass layers on one screen.

## Type

One neutral grotesk does everything, and the reference is Helvetica —
sophisticated precisely because it is unremarkable.
`"Helvetica Neue", Helvetica, "Inter Tight", Arial`.

- Display carries tight optical tracking: `-0.04em` at 27px+, `-0.022em` at
  title sizes. Body stays at `1.45` line-height and `-0.006em`.
- Weights: **400** body and the light half of two-weight headlines, **500**
  labels and list rows, **600** headings and buttons, **700** only for prices.
  **Never 300.**
- **There is no monospace.** Times, prices, plates, ratings and durations use the
  UI font with `font-variant-numeric: tabular-nums` so columns align without a
  typewriter voice. A mono face reads technical, and this product is not.
- Uppercase eyebrows are the UI font at 11px/600 with `--track-micro`.

## Space

4px base, but **four numbers set the whole product**: **26px** screen gutters,
**32px** between sections, **10px** between sibling cards in a list, **22px**
inside a card (26 for sheets). List rows are **60px** with 15px vertical padding.

Partimos runs deliberately airier than a default app — whitespace is the layout
device, and sections are separated by space rather than rules. Hairlines appear
only inside a card. **If a screen feels crowded, the fix is the section gap,
never a divider.**

## Content fundamentals

**Voice.** Direct, warm, unhurried. Short declarative sentences. The product
speaks like a competent friend who has done the trip before, not like a platform.

**Person.** Address the user as **tú**, never *usted* — it reads institutional.
The company says *we* only when doing something for the user: «Te escribimos
cuando alguien publique tu ruta». Never «nosotros en Partimos creemos…».

**Casing.** Sentence case everywhere — headings, buttons, labels, dialog titles.
UPPERCASE is reserved for eyebrows and date stamps, always with `--track-micro`:
`SÁBADO 14 DE JUNIO`. **Title Case is never used.**

**Buttons are verb-first and two or three words:** «Buscar viajes», «Reservar»,
«Confirmar y pagar», «Publicar viaje», «Avisarme». Not «Continuar», not
«Enviar», never «¡Vamos!».

**Numbers and money.** `15 $` with a hard space, comma decimals, `3 h 45` for
duration, 24-hour clock (`08:00`). Prices, times and codes use tabular figures
so they align in lists.

**Length.** Screen titles ≤ 24 characters. Supporting lines ≤ 90. If a paragraph
needs a third line on mobile, it is the wrong paragraph.

**Reassurance beats enthusiasm.** Money and safety copy is factual and specific.
**No exclamation marks anywhere in the product.** No «¡Bienvenido!».

**Empty and error states name the situation, then offer one action.** Errors
never blame: «No hemos podido cobrar la tarjeta», not «Tu pago ha fallado».

**Emoji: no.** Not in UI, not in notifications, not in marketing. The star glyph
in ratings is drawn as an SVG path, not `★` as text.

**Vibe check.** Good: «Hola, Mateo» · «Rutas guardadas» · «Llega en 4 min».
Wrong: «¡Tu aventura empieza aquí!» · «Optimizamos tu movilidad».

## What the system is missing

Two mechanics from the references are not implemented, for lack of material:
**cut-out photography breaking a card edge**, and **the tactile hero shot**.
Until real photography exists the gradients carry that warmth alone, which makes
the system read cooler than its references.

## Notes on this document

Three small inconsistencies, left as they came so nothing is invented:

- The money section writes `15 €`; the header and the market say **US dollars**.
  Panama uses USD — read it as `15 $`.
- «malva» and «periwinkle» appear as the brand hue in the reference notes. They
  belong to a draft that was rejected. **The selected direction is Damero**, the
  flag palette held light.
- `refs/`, `explorations/`, `components/` and `ui_kits/` are described but are
  not in this repository — only `design_system/` and the `.dc.html` boards came
  across. The component names are useful as a naming reference even so.
