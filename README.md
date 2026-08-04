# Portfolio

A Discord-themed portfolio card built with **React** (Vite). The accent palette
is generated live from a Discord avatar via the
[Lanyard](https://github.com/Phineas/lanyard) API and an
[Okolors](https://github.com/IanManske/Okolors)-style Oklab k-means quantizer,
and the banner shows one of ten
[ReactBits](https://reactbits.dev/) WebGL backgrounds — picked at random per
page load and tinted to match the avatar.

**Everything on the page is driven by one file: [`src/site.config.json`](src/site.config.json).**

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL.

## Build

```bash
npm run build
npm run preview
```

Pushing to `main` on Codeberg also triggers the Woodpecker pipeline
(`.woodpecker.yml`), which builds and publishes `dist/` to the `pages` repo
served at the site's URL.

## Configuration — `src/site.config.json`

| Key | Controls |
| --- | --- |
| `profile` | Discord ID for Lanyard, fallback avatar/name, and the social icon buttons (`title`, `icon`, `url`) |
| `theme` | The default CSS colour variables (`bg`, `card*`, `accent*`, `text`, `muted`, `border`, `status`) before the avatar palette loads |
| `status` | Colour + label for each Discord presence state |
| `banner` | Which background effects are in the random rotation, parallax strength (`parallaxShift`), edge `overscan`, fallback colours, and the reveal timeout |
| `palette` | Saturation clamps applied to the extracted avatar colour |
| `tabs` | The tab bar and every section's content (see below) |
| `footer` | The footer line (empty string hides it) |

### Tabs

Each entry in `tabs` renders a button (with an `icon` from `src/assets/icons/`)
and a section chosen by its `type`. **To add a category, append a tab object** —
the bar and grid resize automatically. Available types:

- **`text`** — heading + optional `flourish` divider, centered `paragraphs`,
  and trailing `links`. (Used by About.)
- **`skills`** — `interests` pill row, a `languages` marquee
  ([skillicons.dev](https://skillicons.dev) keys + home-page links), and a
  `games` marquee (cover images from `public/games/` + links). Marquee `speed`
  and `direction` are per-row settings.
- **`music`** — Spotify track IDs rendered as official embed players, plus an
  optional `note`.
- **`projects`** — text cards (`title`, `desc`, optional `link`) in a grid with
  a configurable `columns` count.

### Icons

SVGs live in `src/assets/icons/` and are referenced by filename (e.g.
`"icon": "gamepad"`). They are inlined at runtime by
`src/components/Icon.jsx` so they inherit the accent colour via
`currentColor` — drop a new `.svg` in that folder to add one.

## Structure

Each file has a single theme; helpers live in `src/lib`, UI in
`src/components`.

- `src/site.config.json` — **all content and tunables; edit this first.**
- `src/App.jsx` — page state (presence, palette, active tab) and the layout
  shell only.
- `src/components/sections/` — one component per tab `type`
  (`TextSection`, `SkillsSection`, `MusicSection`, `ProjectsSection`) plus
  `registry.js`, which maps config types to renderers.
- `src/components/Banner.jsx` — random effect pick + cursor parallax;
  `src/components/backgrounds/registry.js` — effect loaders and the
  palette-to-props mapping; `src/components/backgrounds/*.jsx` — the vendored
  ReactBits effects.
- `src/components/Icon.jsx`, `SectionHeading.jsx`, `ExternalLink.jsx`,
  `Marquee.jsx` — small shared UI pieces.
- `src/lib/color.js` — colour-space conversions (HSL/hex/RGB/Oklab).
- `src/lib/palette.js` — extracted palette → CSS variables and banner colours.
- `src/lib/okolors.js` — the Oklab k-means quantizer with localStorage cache.
- `src/lib/lanyard.js` — Discord presence fetch + normalisation.
- `src/lib/marquee.js` — the marquee animation engine.
- `src/lib/styles.js` — shared inline style objects.
- `src/index.css` — global styles, keyframes, and hover states.
- `.woodpecker.yml` — Codeberg CI build-and-deploy pipeline.
