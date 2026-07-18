# Portfolio

A Discord-themed portfolio card, migrated to **React** (Vite) from the original
static build. The accent palette is pulled live from a Discord avatar via the
[Lanyard](https://github.com/Phineas/lanyard) API, and the layout is identical
to the original: profile card with live status, a four-tab switcher
(About / Skills / Music / Projects), animated skill + game marquees, and
user-fillable image slots for album covers and project previews.

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

## Configuration

The Discord user is set by `DISCORD_ID` in `src/App.jsx`. The avatar's dominant
hue drives every accent, card, and border color at runtime.

## Structure

- `src/App.jsx` — the whole portfolio: Lanyard fetch, palette extraction,
  marquee animation, and tab layout.
- `src/components/ImageSlot.jsx` — the fillable image placeholder (click or
  drop an image to fill).
- `src/index.css` — global styles, keyframes, and hover states.
