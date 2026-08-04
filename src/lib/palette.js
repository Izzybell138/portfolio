// ── palette.js ───────────────────────────────────────────────────────────
// Turns an extracted avatar palette (or its absence) into concrete colours:
// CSS custom-property sets for the page theme, and the [primary, secondary,
// tertiary, dark] quad handed to the banner effect. Pure functions — the
// caller applies the returned vars to an element.

import { hexToRgb01, hslStr, hslToHex, rgbToHsl } from './color.js'

// Neutral hue used when the avatar is greyscale.
const MONO_HUE = 225

// Hue (0-360) of a hex colour.
function hueOf(hex) {
  const [r, g, b] = hexToRgb01(hex)
  return rgbToHsl(r * 255, g * 255, b * 255)[0]
}

// Lightness (0-1) of a hex colour.
function lightOf(hex) {
  const [r, g, b] = hexToRgb01(hex)
  return rgbToHsl(r * 255, g * 255, b * 255)[2]
}

// Shortest signed distance from hue a to hue b, in -180..180.
function hueDelta(a, b) {
  return ((b - a + 540) % 360) - 180
}

// Move `t` of the way from hue a toward hue b, the short way round the wheel.
// t = 0 stays on a, t = 1 lands on b.
function hueMix(a, b, t) {
  return (a + hueDelta(a, b) * t + 360) % 360
}

// ── palette → CSS vars ────────────────────────────────────────────────────
// The accents are deliberately *not* three unrelated colours. Each secondary
// accent starts at the primary hue and moves part-way toward one of the other
// colours found in the avatar/decoration, so the set stays recognisably one
// palette while still showing more than a single hue. `shifts[i]` is how far
// colour i is allowed to pull — blendDecoration gives decoration-sourced
// colours a smaller pull than the avatar's own.
export function paletteVars(res, s) {
  const sp = +(s * 100).toFixed(0)
  const cols = (res.colors || []).filter(Boolean)
  const shifts = res.shifts || []
  const h = res.h

  // Hue for accent slot i: part-way toward cols[i] when we have it. When we
  // don't, stay in the primary's own family — a large rotation here would
  // invent a hue the image never contained (a blue avatar with no second
  // colour used to produce a purple accent from a +28 rotation). The slots
  // already differ in lightness below, so same-hue accents still read apart.
  const accentHue = (i, fallback) => {
    const hex = cols[i]
    if (!hex) return (h + fallback + 360) % 360
    return hueMix(h, hueOf(hex), shifts[i] == null ? 0.55 : shifts[i])
  }

  const h2 = accentHue(1, 10)
  const h3 = accentHue(2, -12)

  return {
    '--accent': hslStr(h, sp, 62),
    '--accent2': hslStr(h2, sp, 56),
    '--accent3': hslStr(h3, sp, 66),
    '--bg': hslStr(h, 22, 4.5),
    '--card': hslStr(h, 18, 8),
    // The raised surfaces drift toward the secondary/tertiary hues. It reads as
    // depth rather than colour at these saturations, but it stops every panel
    // from being the same flat tint of the primary.
    '--card2': hslStr(hueMix(h, h2, 0.5), 16, 12.5),
    '--card3': hslStr(hueMix(h, h3, 0.5), 15, 17),
    '--border': `hsla(${h2.toFixed(0)},25%,82%,0.09)`,
  }
}

// CSS vars for a greyscale avatar — barely-there cool tint.
export function monoVars() {
  const H = MONO_HUE
  return {
    '--accent': hslStr(H, 8, 84),
    '--accent2': hslStr(H, 10, 60),
    '--accent3': hslStr(H, 9, 72),
    '--bg': hslStr(H, 8, 4.5),
    '--card': hslStr(H, 7, 8),
    '--card2': hslStr(H, 7, 12.5),
    '--card3': hslStr(H, 7, 17),
    '--border': `hsla(${H},12%,85%,0.09)`,
  }
}

// Map a theme config object ({ accent: '#...' , ... }) to CSS custom props.
export function themeVars(theme) {
  return Object.fromEntries(Object.entries(theme).map(([key, value]) => ['--' + key, value]))
}

// ── decoration blending ───────────────────────────────────────────────────
// Fold an avatar decoration's colours into the avatar's own palette.
//
// Decorations are typically far more saturated than a photographic avatar
// (mean chroma 0.19 vs 0.03 is normal), so clustering both on equal terms
// hands the entire theme to the decoration. Instead the avatar always keeps
// the primary, and the decoration's colours join the list as secondaries that
// pull the derived accents only `influence` as far as the avatar's own would.
export function blendDecoration(base, deco, influence = 0.35, accentShift = 0.55) {
  const baseCols = ((base && base.colors) || []).filter(Boolean)
  const decoCols = ((deco && !deco.mono && deco.colors) || []).filter(Boolean)

  if (!base || base.mono) {
    // A greyscale avatar has nothing to contribute; let the decoration carry
    // the palette outright rather than falling back to the neutral theme.
    return decoCols.length ? deco : base
  }
  if (!baseCols.length) return base
  if (!decoCols.length || influence <= 0) {
    return { ...base, shifts: baseCols.map(() => accentShift) }
  }

  const colors = [baseCols[0]]
  const shifts = [accentShift]
  // Two colours count as distinct if they differ in hue OR clearly in
  // lightness. Hue alone throws away everything from a single-hue image (a
  // blue avatar with a pale blue decoration), which then leaves empty accent
  // slots for the fallback to fill with a hue that isn't in the image at all.
  const distinct = (hex) => colors.every((c) =>
    Math.abs(hueDelta(hueOf(hex), hueOf(c))) > 28 || Math.abs(lightOf(hex) - lightOf(c)) > 0.12)

  // Alternate avatar and decoration candidates so the palette shows both
  // sources rather than three variations of whichever had more colours.
  const queue = []
  const rest = baseCols.slice(1)
  for (let i = 0; i < Math.max(rest.length, decoCols.length); i++) {
    if (decoCols[i]) queue.push({ hex: decoCols[i], shift: accentShift * influence })
    if (rest[i]) queue.push({ hex: rest[i], shift: accentShift })
  }
  for (const { hex, shift } of queue) {
    if (colors.length === 3) break
    if (distinct(hex)) { colors.push(hex); shifts.push(shift) }
  }

  return { ...base, colors, shifts }
}

// ── banner ────────────────────────────────────────────────────────────────
// Keep a colour's hue but push its saturation/lightness into a range the
// banner shaders can actually show. Colours pulled from a photographic avatar
// are often correct in hue yet too muted or too dark to read once a shader
// blends them, which looks washed out rather than avatar-matched.
function vivify(hex, S, L) {
  return hslToHex(hueOf(hex), S, L)
}

// Build [primary, secondary, tertiary, dark] for the banner. Prefer the
// avatar's *actual* dominant colours from Okolors so multi-colour effects look
// like the pfp; fall back to hue-derived shades when only one colour is found.
//
// Unlike the CSS accents these are used at full strength — the banner is the
// one place the palette's real spread should be visible, not just hinted at.
export function bannerColors(res, s) {
  const S = Math.round(Math.min(0.92, Math.max(0.5, s)) * 100)
  const cols = (res.colors || []).filter(Boolean)
  // Same rule as the CSS accents: when a slot has no real colour, vary
  // lightness within the primary's hue family rather than rotating away into
  // a hue the avatar never had.
  const c1 = cols[0] ? vivify(cols[0], S, 62) : hslToHex(res.h, S, 62)
  const c2 = cols[1] ? vivify(cols[1], S, 56) : hslToHex(res.h + 10, S, 48)
  const c3 = cols[2] ? vivify(cols[2], S, 50) : hslToHex(res.h - 12, S, 70)
  return [c1, c2, c3, hslToHex(res.h, S, 15)]
}

// Banner colours for a greyscale avatar.
export const MONO_BANNER_COLORS = [
  hslToHex(MONO_HUE, 12, 78),
  hslToHex(MONO_HUE, 10, 56),
  hslToHex(MONO_HUE, 10, 40),
  hslToHex(MONO_HUE, 10, 13),
]
