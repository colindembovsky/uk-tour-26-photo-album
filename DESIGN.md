---
name: Four Cities
description: A family photo album on a walnut table; four city chapters bound in hand-tooled leather.
colors:
  gilt: "#c8a25a"
  gilt-soft: "#d9bf86"
  leather-cover: "#4a2c1f"
  leather-edinburgh: "#5b3442"
  leather-london: "#6b1f1d"
  leather-belfast: "#22324a"
  leather-dublin: "#1f4a35"
  walnut: "#2a1c13"
  card: "#191b19"
  card-edge: "#0f100f"
  pencil: "#d6cfbf"
  pencil-dim: "#9a9383"
  glassine: "rgb(234 229 215 / 0.9)"
  ink: "#2b2420"
  print-edge: "#ece6d8"
typography:
  display:
    fontFamily: "Marcellus, Trajan Pro, Georgia, serif"
    fontSize: "clamp(2.3rem, 7.5vw, 4.6rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.16em"
  headline:
    fontFamily: "Marcellus, Trajan Pro, Georgia, serif"
    fontSize: "clamp(1.9rem, 6.2vw, 3.1rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.16em"
  body:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "clamp(1.06rem, 1.9vw, 1.2rem)"
    fontWeight: 400
    lineHeight: 1.68
  caption:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "1.08rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Alegreya Sans SC, Gill Sans, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 400
    letterSpacing: "0.12em"
rounded:
  print: "1px"
  card: "3px"
  leather: "5px"
components:
  album-cover:
    backgroundColor: "{colors.leather-cover}"
    textColor: "{colors.gilt}"
    rounded: "{rounded.leather}"
  chapter-cover:
    backgroundColor: "{colors.leather-edinburgh}"
    textColor: "{colors.gilt}"
    rounded: "{rounded.leather}"
  glassine-history:
    backgroundColor: "{colors.glassine}"
    textColor: "{colors.ink}"
    rounded: "{rounded.print}"
  card-leaf:
    backgroundColor: "{colors.card}"
    textColor: "{colors.pencil}"
    rounded: "{rounded.card}"
  print:
    backgroundColor: "{colors.print-edge}"
    rounded: "{rounded.print}"
---

# Design System: Four Cities

## Overview

**Creative North Star: "The Tooled Family Album"**

The site is a physical object: a leather-bound family album lying open on a walnut table. Every surface is a material the album would really have. Walnut for the table. Tooled leather for the covers. Black card for the leaves. White-bordered prints. A translucent glassine interleaf for each city's history. Gilt keylines and ornaments pressed into the leather tie it together. The interface recedes so the photographs lead; chrome is limited to what a bookbinder would add.

Each city owns one ornament unit and one leather colour: the Edinburgh thistle on heather, the London plane leaf on oxblood, the Belfast riveted porthole on navy, the Dublin harp on bottle green. The units are reused as cover centrepieces, tabs, contents marks and folios, so a city is recognisable from any one of them.

**Key Characteristics:**
- Real materials (raster walnut and leather textures), never flat CSS stand-ins.
- One gilt keyline grammar: a lozenge frame enclosing a city unit.
- One motion moment: ornaments "tooling" themselves into the leather.
- Prints sit slightly askew on black card with pencil captions.

## Colors

Dark, warm and material. Gilt is the only metallic accent, and each city leather is used at chapter scale.

### Primary
- **Bookbinder's Gilt** (gilt): every keyline, ornament, cover title and the active-tab ring. **Gilt Soft** (gilt-soft) carries secondary gilt text (dates, subtitles) and the focus ring.

### Secondary: city leathers
- **Album Brown** (leather-cover): the album cover, slideshow title card and endpaper.
- **Heather** (leather-edinburgh), **Oxblood** (leather-london), **Harbour Navy** (leather-belfast), **Bottle Green** (leather-dublin): each city's chapter cover, tab and contents mark, set per element through the `--leather` custom property. The glassine drop cap also takes the city leather.

### Neutral
- **Walnut** (walnut): the table under everything.
- **Black Card** (card, card-edge): album leaves holding the prints.
- **Pencil** (pencil, pencil-dim): captions, numbers and folios on black card.
- **Glassine** (glassine) with **Ink** (ink): the history interleaf.
- **Print Edge** (print-edge): the white border around every photograph.

### Named Rules
**The One Metal Rule.** Gilt is the only accent colour. Never add a second highlight hue; colour variety comes from the city leathers.

**The Leather Owns the City Rule.** A city's colour appears only where that city is named: its cover, tab, contents mark and drop cap. It is never used for generic UI.

## Typography

**Display Font:** Marcellus (with Trajan Pro, Georgia)
**Body Font:** Alegreya (with Georgia)
**Label Font:** Alegreya Sans SC (with Gill Sans)

**Character:** Marcellus has the flared Roman capitals of a gilt-stamped spine. Alegreya's calligraphic italic reads as a handwritten pencil caption. Alegreya Sans SC gives small-caps labels without faking them with CSS.

### Hierarchy
- **Display** (Marcellus, uppercase): chapter-cover city names, set in gilt with a pressed text shadow.
- **Headline** (Marcellus, uppercase): the album title.
- **Body** (Alegreya, max 64ch, old-style numerals): the glassine history, opened by a Marcellus drop cap 3.55em tall in the city leather.
- **Caption** (Alegreya italic, max 34ch): pencil captions under each print.
- **Label** (Alegreya Sans SC, tracked): dates, print numbers, folios and the contents count.

### Named Rules
**The Stamped Capitals Rule.** Marcellus appears only as uppercase gilt on leather, or as the drop cap. It is never used for body text or as a heading on black card.

## Layout

The page is a single column of album leaves, each up to `min(1120px, 100vw − 2 × gutter)` wide on the walnut, with a fluid gutter of `clamp(0.6rem, 3vw, 2.5rem)`. Each chapter follows the same order: leather chapter cover → glassine history → black card leaves of prints. Prints come in rows: single, wide, tall, and pairs. Pairs go side by side at ≥900px. Each print is capped at `78svh × aspect ratio` so a whole photo always fits on screen. Captions match the print's width so they line up with its edge. City tabs are a bottom bar on narrow screens and become vertical leather tabs off the album's right edge at ≥1240px. Leather corner ornaments are hidden below 700px.

## Elevation & Depth

Depth is physical, not interface depth. Leather and card leaves cast long, soft table shadows. Leather also carries inset shading so it reads as a thick padded board. Prints have a tight contact shadow and lift 3px on hover. The slideshow lays one print on a darkened, vignetted table.

### Shadow Vocabulary
- **Board on table** (`0 1px 2px rgb(0 0 0/.5), 0 22px 50px -18px rgb(0 0 0/.75)` plus insets): leather covers.
- **Leaf on table** (`0 1px 2px rgb(0 0 0/.55), 0 26px 60px -24px rgb(0 0 0/.8)`): black card leaves.
- **Print on card** (`0 1px 1px rgb(0 0 0/.55), 0 10px 24px -10px rgb(0 0 0/.85)`): mounted photos at rest.
- **Lifted print** (`0 2px 2px rgb(0 0 0/.45), 0 22px 40px -14px rgb(0 0 0/.9)`): print hover.

## Shapes

Corners are almost square, as in bookbinding: prints 1px, card leaves 3px, leather boards 5px. The signature geometry is a 45° lozenge: a double keyline diamond frames every city unit. A gilt roll inside each leather board repeats the lozenge between two keylines, alternating with dots, using a `border-image` tile. Prints are rotated a fraction of a degree (`--tilt`) as if mounted by hand.

## Components

### Leather Board (album cover, chapter cover, endpaper)
Leather texture over the city colour, with the gilt roll border inset `clamp(.65rem, 2vw, 1.1rem)`. The title is gilt Marcellus, with a lozenge ornament above it.

### Ornament Unit
An inline SVG in a 64-unit viewBox, made of `pathLength=1` keyline paths. Stroke width scales with the rendered size: a ResizeObserver sets `--s`. On first view, chapter-cover units "tool" in: stroke-dashoffset animates to 0 over 1.6s, as if gilt were being pressed in. This is the system's only decorative animation, and it is turned off under reduced motion.

### Glassine Interleaf
A translucent paper sheet (glassine at 90% opacity with a top sheen) holding one paragraph of history in ink. It opens with a drop cap in the city leather.

### Mounted Print
The photo sits in a white print-edge border of `clamp(.3rem, .8vw, .5rem)`, with a slight tilt and its median colour as a placeholder until it loads. Clicking a print opens the slideshow at that photo. Films carry a gilt-cream play mark. Every still is signed in a bottom corner when it's built, in the photographer's hand, black or white to suit the corner, at 85% opacity, about 24% of the short edge wide. It's set in the image, not drawn by the UI.

### Navigation
- **Contents:** a black-card leaf listing each city with its unit, name, dates and print count.
- **Tabs:** small leather squares, each holding its city unit. The current city has an inset gilt ring.

### Slideshow
A dialog over the walnut. One print at a time, with a slow 9s drift and a gilt progress hairline. City changes show a mini leather cover with the city's history on glassine beside it (stacked on mobile). That slide holds for about 250ms per word so there's time to read it. Captions are pencil-on-dark with a soft text shadow.

## Do's and Don'ts

### Do:
- **Do** take every accent from gilt (#c8a25a) and every city colour from its leather.
- **Do** build new ornaments from the 64-unit lozenge frame with `pathLength=1` keylines so they can tool in.
- **Do** keep captions short, in Alegreya italic and ≤34ch.
- **Do** reuse the textures in `docs/assets/` for any new surface; regenerate them with `scripts/textures.mjs`.

### Don't:
- **Don't** render leather, card or walnut as flat colour or CSS gradients alone.
- **Don't** add a second animated flourish; tooling is the one motion moment.
- **Don't** use `vector-effect: non-scaling-stroke` on `pathLength` ornaments; Chrome breaks the dash maths.
- **Don't** use rounded corners above 5px, glass blur, or gradient text.
