// ── backgrounds/registry.js ──────────────────────────────────────────────
// The catalogue of ReactBits banner effects: how to load each one, and how to
// map the avatar palette onto its colour props. Banner.jsx consumes both.
// To add an effect: vendor the component into this folder, add a loader, and
// add a colour mapping.

import { hexToRgb01 } from '../../lib/color.js'

// Loaders are dynamic imports so only the randomly-chosen effect's chunk (and
// its WebGL deps) is ever downloaded — the others cost nothing at runtime.
// Which of these are actually in the rotation is controlled by
// `banner.effects` in site.config.json.
export const EFFECT_LOADERS = {
  SideRays: () => import('./SideRays.jsx'),
  ColorBends: () => import('./ColorBends.jsx'),
  LineWaves: () => import('./LineWaves.jsx'),
  SoftAurora: () => import('./SoftAurora.jsx'),
  Plasma: () => import('./Plasma.jsx'),
  // GridScan is a named-only export; webcam stays off so it never asks for a camera.
  GridScan: () => import('./GridScan.jsx').then((m) => ({ default: m.GridScan })),
  Dither: () => import('./Dither.jsx'),
  RippleGrid: () => import('./RippleGrid.jsx'),
  ShapeGrid: () => import('./ShapeGrid.jsx'),
  Balatro: () => import('./Balatro.jsx'),
}

// Map the avatar-derived palette [primary, secondary, tertiary, dark] onto
// each effect's own colour props, so whichever effect shows matches the pfp.
export function effectColorProps(name, [c1, c2, c3, dark]) {
  switch (name) {
    case 'SideRays': return { rayColor1: c1, rayColor2: c2 }
    case 'ColorBends': return { colors: [c1, c2, c3] }
    case 'LineWaves': return { color1: c1, color2: c2, color3: c3 }
    case 'SoftAurora': return { color1: c1, color2: c2 }
    case 'Plasma': return { color: c1 }
    case 'GridScan': return { linesColor: dark, scanColor: c1, enableWebcam: false }
    case 'Dither': return { waveColor: hexToRgb01(c1) }
    case 'RippleGrid': return { gridColor: c1 }
    case 'ShapeGrid': return { borderColor: c1, hoverFillColor: c2 }
    case 'Balatro': return { color1: c1, color2: c2, color3: dark }
    default: return {}
  }
}
