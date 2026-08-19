# Partimos — Design System

Partimos is a shared-mobility app for **Panama**: riders search a route, book a seat with a driver going the same way, and travel together. The product family sits between the long-distance carpool model (BlaBlaCar) and on-demand ride hailing (Uber): trips are **published in advance, priced per seat, and paid in-app**, with driver identity, rating and vehicle shown before booking.

The brand is warm, plain-spoken and quietly confident. The identity comes from the **flag of Panama** — its two colours and, more importantly, its four-square quadrant geometry. Both flag colours carry the brand, split by job: **azul `#005293` owns surfaces** — headers, hero fields, bars, dark chrome — and **rojo `#D21034` owns interaction** — every button, link, active state and the publish FAB. White is structural: it keeps the two apart. One blurred gradient built from those same colours is the single decorative motif; everything else is warm neutrals, black type and generous space.

Launch market is Panama. Interface strings are Spanish, prices in US dollars (`15 $`); documentation is English.

## Sources given

- Eleven inspiration screenshots supplied by the user, copied to `refs/ref-01.png` … `refs/ref-11.png` (originals in `uploads/`).
- No codebase, Figma file, logo, font binary or photography was provided.
- Brief: "like BlaBlaCar or Uber… strong yet minimalist identity… warm, for a Latin country… slick, minimalist, good taste." Positioning confirmed in review: **the cheapest way to travel — practical, honest, no frills**, for **everyone** (not a student-only or premium product). Gradient confirmed as a **signature** element (hero cards and the publish flow). Identity loudness: **balanced**.

Everything here is an **original system built from a brief plus mood references**, not a recreation of an existing product. Nothing was copied from BlaBlaCar, Uber, or the brands appearing in the references.

### How the palette was chosen

Refs 01 and 11 are a *third party's* brand board (cobalt / coral / amber / near-black, Roobert). An early draft lifted that palette almost directly. That was wrong — it is someone else's identity — and it was rejected in review.

Several further directions were built and rejected before the brief sharpened: the market is **Panama**, and the identity should take the flag's colours and its **square geometry**. The selected direction is **Damero** — the flag palette held light, full-strength rojo and azul reserved for the mark and one action, with pale tinted squares as content tiles. It is the closest of the candidates to the soft, rounded app screens in the references.

Directions built and reviewed, kept in `explorations/` for the record:

| File | Direction | Outcome |
| --- | --- | --- |
| `A-buganvilla.html` | Magenta / rosa mexicano | Rejected — connotations |
| `B-barro.html` · `C-tinto.html` | Terracotta · wine + blood orange | Not chosen |
| `D-verde.html` · `E-brasa.html` | Field green · ember orange | Not chosen |
| `F-lima.html` · `G-malva.html` · `H-bloques.html` | Chartreuse · periwinkle · four rotating brights | Not chosen |
| `I-boleto.html` · `J-sobremesa.html` | Printed-ticket system · serif editorial | Not chosen |
| `K-senal.html` · `L-trazo.html` | Road signage · the route line as the mark | Not chosen |
| `M-cuadrantes.html` · `O-istmo.html` | Quadrant layout grid · hard-edged canal blue | Not chosen |
| **`N-damero.html`** | **Panama palette held light, squares as tiles, rounded** | **Selected** |

Confirmed in review: **rojo is the brand, azul supports**; corners stay **rounded** as in the references; the blurred gradient is a **signature** element; loudness **balanced**.

### Decisions taken from the references

| Reference | What was taken | What was rejected |
| --- | --- | --- |
| refs 06, 08, 09, 11 | Periwinkle as the brand hue; soft pastel-bright surfaces on a paper page | The full four-colour rotation (see `H-bloques`) — one hue is more minimalist |
| ref-05, ref-10 | The gradient *inside* a white card, blurred and cropped by the radius — became `--grad-sunrise` and `Card tone="sunrise"` | Full-bleed gradient screens |
| refs 02, 05, 08, 09 | Near-black pill as the **default action**; colour reserved for confirm and live states | Coloured primary buttons |
| refs 08, 09 | Capsule and 24px-card geometry; warm off-white page, pure white cards | Photo-in-hand hero style |
| refs 01, 03, 04 | Tight-tracked geometric grotesk; two weights inside one headline | The cobalt/coral/amber palette; Roobert (unlicensed) |
| ref-07 | Gradients as light, never as containers | Magenta and violet→blue ramps |

## Index

| Path | What's there |
| --- | --- |
| `styles.css` | The single entry point consumers link. `@import` list only. |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radii.css`, `elevation.css`, `glass.css`, `motion.css`, `base.css` (resets + the three utility classes). |
| `components/` | React primitives, grouped `brand/`, `core/`, `forms/`, `navigation/`, `feedback/`, `mobility/`. |
| `ui_kits/rider_app/` | Five-screen click-through of the passenger app. See its README. |
| `guidelines/` | 20 specimen cards (colour, type, spacing, radii, elevation, motion, iconography, wordmark) — these populate the Design System tab. |
| `assets/README.md` | What imagery and marks are missing, and the icon substitution. |
| `refs/` | The user's eleven inspiration screenshots. |
| `explorations/` | The eight branding directions and four type specimens reviewed before landing on malva. Not part of the shipped system. |
| `thumbnail.html` | Homepage tile. |
| `SKILL.md` | Agent-Skills front matter for use outside this project. |

### Components

`brand/` — **Mark** (the quadrant mark + wordmark lockup)
`core/` — **Button**, **IconButton**, **Card**, **Badge**, **Tag**, **Avatar**
`forms/` — **Input**, **Select**, **Checkbox**, **Radio**, **Switch**, **Stepper**
`navigation/` — **Tabs**, **TabBar**
`feedback/` — **Dialog**, **Toast**, **Tooltip**
`mobility/` — **TripCard**, **RouteStops**, **DriverRow**, **VehicleChip**

Each directory has `<Name>.jsx`, `<Name>.d.ts`, most have `<Name>.prompt.md`, and one `@dsCard` HTML showing every variant.

**Intentional additions** (no source defined an inventory, so a standard set was authored): `Mark` exists because the brand needs a signature and no logo was supplied — see below. The four `mobility/` components exist because the product's core screens are unbuildable without them — a trip result row, a route timeline, a driver identity row, a vehicle line. Tooltip is included for desktop/web surfaces only; it has no mobile use.

## Content fundamentals

**Voice.** Direct, warm, unhurried. Short declarative sentences. The product speaks like a competent friend who has done the trip before, not like a platform.

**Person.** Address the user as **tú** (never *usted* — it reads institutional). The company says **we** only when it is doing something for the user: "Te escribimos cuando alguien publique tu ruta" / "Avísanos y te buscamos plaza." Never "nosotros en Partimos creemos…".

**Casing.** Sentence case everywhere — headings, buttons, labels, dialog titles. UPPERCASE is reserved for eyebrows and date stamps, always with `--track-micro` letterspacing: `SÁBADO 14 DE JUNIO`. Title Case is never used.

**Buttons** are verb-first and two or three words: `Buscar viajes`, `Reservar`, `Confirmar y pagar`, `Publicar viaje`, `Avisarme`. Not `Continuar`, not `Enviar`, never `¡Vamos!`.

**Numbers and money.** Spanish convention: `15 €` with a hard space, comma decimals, `3 h 45` for duration, 24-hour clock (`08:00`). Plate numbers, times and codes are set in DM Mono so they align in lists.

**Length.** Screen titles ≤ 24 characters. Supporting lines ≤ 90. If a paragraph needs a third line on mobile, it is the wrong paragraph.

**Reassurance beats enthusiasm.** Money and safety copy is factual and specific: "Pago retenido hasta la salida. Si el viaje se cancela, se devuelve entero." No exclamation marks anywhere in the product. No "¡Bienvenido!".

**Empty and error states** name the situation, then offer one action: "Sin plaza a tu hora. Avísanos y te escribimos cuando alguien publique." Errors never blame: "No hemos podido cobrar la tarjeta" not "Tu pago ha fallado".

**Emoji: no.** Not in UI, not in notifications, not in marketing. The star glyph in ratings is drawn as an SVG path, not ★ as text; the CO₂ subscript is real Unicode because it is typography, not decoration.

**Vibe check.** Good: *"Hola, Mateo" / "Rutas guardadas" / "Llega en 4 min" / "Publica tu viaje y cubre la gasolina."* Wrong: *"¡Tu aventura empieza aquí!" / "Optimizamos tu movilidad" / "Let's go 🚗".*

## The screen archetype — Bandera

Chosen in review from three built directions (`explorations/id-A-damero.html`, `id-B-bandera.html`, `id-C-ruta.html`). Bandera won; the route line, the oversized headline, the floating white card and the gradient were all carried into it.

**Every primary screen opens with a red field.** `--grad-bandera` fills the top 326px of a home screen (186–214px on a secondary one), carrying an uppercase eyebrow, an oversized two-line headline in two weights, and one supporting line. Then a **white sheet overlaps the field's lower boundary** by 60–80px with a red-tinted shadow, and everything below it returns to sand, hairlines and air.

Three rules make it work:
1. **The action inside the sheet is azul**, not rojo — red owns the field, and red on red does not read.
2. **Controls sitting on the field** are 40px circles at `rgba(255,255,255,.18)`. Never glass (see the blur rule below), never white pills.
3. **One field per screen, and nothing below the subtitle sits on the red.** All content belongs on the sheet.

The component is `BanderaField` (`components/brand/`). The archetype is shown in `guidelines/bandera.card.html`.

**The route line** threads the sheet and every trip surface: a 1.5px rail with 10px nodes, solid rojo where the journey has happened and a hollow 2px ink ring where it hasn't. It is the one gesture that appears on every screen — home, results, trip detail, live ride.

**The gradient survives in exactly one place per screen flow**: a single earning or confirmation card, blurred inside its own radius. It is no longer furniture.

## Signature mechanics

The palette is the identity's surface; these nine moves are its behaviour. They are what separate Partimos from a default app, and they come from the reference set rather than from taste.

1. **Gradient inside the card, bottom-anchored.** The signature gradient is a *light source* rising from a card's bottom edge, not a background behind it — and controls are meant to sit **on** it. `Card tone="bloom"`. This is the mechanic ref-04 states out loud: the gradients behave as sunrises inside the cards.
2. **Full azul panel with cards floating clear of it.** A screen's top third is an azul field; white and glass cards float over it and cross its lower boundary. Azul owning surfaces is what makes this legible.
3. **Stacked full-width button pairs.** Filled rojo above outlined charcoal, both `block`. Decisions read faster stacked than side by side on a phone.
4. **Coloured uppercase eyebrows section a screen** instead of dividers — azul for ordinary sections, rojo reserved for live or urgent ones. `--text-eyebrow` + `--track-micro`.
5. **Two weights inside one line.** `Panamá → **David**`, `Hola, **Mateo**` — 400 beside 600 in a single sentence, no colour needed for emphasis.
6. **Square monogram tiles, tint-on-tint.** `Avatar shape="square"` derives a stable hue from the person's name, so a driver keeps their colour across screens. Doubles as the Panama square motif in list rows.
7. **Active tab is a filled rojo pill with its label inline;** inactive tabs are icon-only and dimmed. The bar itself is charcoal or dark glass.
8. **Oversized number with a tiny rotated pill beside it** — the price at display size, `por plaza` / `2 plazas` as a 10.5px pill rotated −8°. The one playful gesture in the system; never more than one per card.
9. **Applied filters are tinted chips with a solid dot X** (`Tag tone="azul" onRemove`). Plain choosers stay neutral; colour means *applied*.

Two mechanics from the references are **not** implemented, for lack of material: cut-out photography breaking a card edge, and the tactile hero shot (product on a real surface, phone in hand). Until real photography exists the gradients carry that warmth alone, which makes the system read cooler than its references. See `assets/README.md`.

## Visual foundations

**Colour.** Two flag colours, warm neutrals, and one rule about who does what.

- **Azul `--azul-500 #005293` owns surfaces.** App headers, hero fields, informational bars, the dark chrome, the base route line on a map, `Card tone="brand"`. It is the colour you sit *on*, and it is never the main call to action.
- **Rojo `--rojo-500 #D21034` owns interaction.** Every button (`Button variant="primary"` is rojo), links, active tab indicators, the live route leg, the square publish FAB. It is the colour you *touch*.
- **Ink is warm charcoal `#26232B`, not black — and it is used sparingly.** Text and hairlines, essentially. Large ink fills next to rojo read like a games console rather than a minimal app, so the system has **no black bars, no black tab bar and no black buttons in product UI**: the tab bar is off-white with a hairline and a rojo active state, and `Button variant="ink"` exists for dark surfaces only. Body copy at `--text-secondary #6B6672`.
- **Arena** is the warm tertiary: the light between the two in every gradient, plus soft surfaces. **Oro `--oro-500 #E0A83C`** does rating stars and nothing else.

**The separation rule.** Rojo and azul **never touch**. Wherever both appear, white or sand sits between them — a gutter, a card edge, a quadrant gap. Taken straight from the flag, and it is also what stops the gradient muddying into purple. Full-strength rojo and azul never share a button, chip or card edge.

**Danger, when red is interactive.** Rojo is what a user taps, so error red cannot look like an action. Errors use `--text-danger` (`--rojo-700`, darker than any button) **with an alert icon and an explicit label**, never colour alone. Destructive buttons are outlined with red text, never filled. Success is green; information is azul.

**Glass.** The one translucent layer, and the system's most expressive move. Light glass (`--glass-bg`) over the gradient, an azul header, or photography; dark glass (`--glass-bg-ink`) over a night map. What makes it read as glass is not the blur alone but the **edge**: a `--glass-border` hairline plus a `--glass-highlight` inset top highlight, over `--shadow-glass`. Blur is `saturate(180%) blur(22px)` — the saturation boost is what keeps the colour behind it alive instead of grey.

**Where glass is forbidden.** Glass only exists on top of something with colour. Over the plain sand page it turns grey and dirty — use `Card tone="plain"` there. Never glass on glass, never glass over body text, and never more than two glass layers on one screen. Available as `Card tone="glass" | "glassInk"`, `Button variant="glass"`, `IconButton variant="glass" | "glassInk"`, `TabBar tone="glass"`.

**Type.** One neutral grotesk does everything, and the reference is **Helvetica** — sophisticated precisely because it is unremarkable. `--font-display` and `--font-ui` resolve to `"Helvetica Neue", Helvetica, "Inter Tight", Arial`: on Apple devices that is real Helvetica Neue; elsewhere **Inter Tight** stands in (near-identical proportions, tighter than plain Inter). Display sizes carry tight optical tracking (`-0.04em` at 27px+, `-0.022em` at title sizes); body stays at `1.45` and `-0.006em`. Weights: 400 body and the light half of two-weight headlines, 500 labels and list rows, 600 headings and buttons, 700 only for prices. Never 300.

**There is no monospace.** Times, prices, plates, ratings and durations use the UI font with `font-variant-numeric: tabular-nums` (`--font-data`, or the `.p-data` class) so columns still align down a list without a typewriter voice — a mono face reads technical, and this product is not technical. Uppercase eyebrows are the UI font at 11px/600 with `--track-micro`, never mono.

**Space.** 4px base, but four numbers set the whole product: **26px screen gutters**, **32px between sections**, **10px between sibling cards in a list**, **22px inside a card** (`--card-pad`; 26 for sheets). List rows are 60px with 15px vertical padding. Partimos runs deliberately airier than a default app — whitespace is the layout device, and sections are separated by space rather than rules (hairlines appear only *inside* a card). If a screen feels crowded, the fix is the section gap, never a divider.


