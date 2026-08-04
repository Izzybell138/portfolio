// ── okolors.js ───────────────────────────────────────────────────────────
// A small JavaScript port of the approach used by Okolors
// (https://github.com/IanManske/Okolors): quantize an image by running
// k-means clustering in the Oklab colour space, then rank the resulting
// clusters. Oklab is perceptually uniform, so clustering there yields far
// nicer, more representative palettes than clustering in sRGB/HSL.
//
// Rust can't run in the browser, so rather than shelling out to the Okolors
// crate this reimplements its core method (Oklab + weighted k-means) in JS.
// Results are cached in localStorage keyed by image URL, so the (already
// cheap) k-means only ever runs once per avatar — no recompute lag on revisit.
//
// Colour-space conversions live in color.js; this file is the quantizer.

import { oklabToRgb, rgbHex, rgbToHsl, rgbToOklab } from './color.js'

// Bumped to v2 when the quantizer changed — old cached results (including
// wrong `{mono:true}` verdicts) are keyed by the old prefix and ignored.
const CACHE_PREFIX = 'okolors-v2:'

// Pixels are downsampled to this square before quantizing. Big enough to keep
// small but saturated details (graffiti, logos, eyes) alive in the histogram.
const SAMPLE_SIZE = 64

// Cluster count. Photographic avatars often have a large dull region (a wall,
// a sky, skin) plus a small vivid one; too few clusters and k-means spends
// them all subdividing the dull region by lightness, averaging every vivid
// pixel away into grey. 20 leaves enough clusters for the minority colours.
const K = 20

// Deterministic PRNG (LCG). k-means seeding needs randomness, but results are
// cached, so Math.random would freeze one arbitrary run's palette per visitor.
// A fixed seed makes the palette a pure function of the image.
function rng(seed) {
  let s = seed >>> 0
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
}

// ── weighted k-means in Oklab ──────────────────────────────────────────────
// points: Float array of [L,a,b] triples; weights: per-point pixel counts.
function kmeans(points, weights, k, iters) {
  const n = points.length
  if (n === 0) return []
  k = Math.min(k, n)

  // k-means++-ish seeding: first centroid pseudo-random, rest favour distant points.
  const rand = rng(0x9e3779b9)
  const cen = []
  cen.push(points[Math.floor(rand() * n)].slice())
  while (cen.length < k) {
    let best = null, bestD = -1
    for (let i = 0; i < n; i++) {
      let dMin = Infinity
      for (const c of cen) {
        const dl = points[i][0] - c[0], da = points[i][1] - c[1], db = points[i][2] - c[2]
        const d = dl * dl + da * da + db * db
        if (d < dMin) dMin = d
      }
      const score = dMin * weights[i]
      if (score > bestD) { bestD = score; best = i }
    }
    cen.push(points[best].slice())
  }

  const assign = new Int32Array(n)
  for (let it = 0; it < iters; it++) {
    // assignment
    for (let i = 0; i < n; i++) {
      let bi = 0, bd = Infinity
      for (let c = 0; c < cen.length; c++) {
        const dl = points[i][0] - cen[c][0], da = points[i][1] - cen[c][1], db = points[i][2] - cen[c][2]
        const d = dl * dl + da * da + db * db
        if (d < bd) { bd = d; bi = c }
      }
      assign[i] = bi
    }
    // update
    const sumL = new Float64Array(k), sumA = new Float64Array(k), sumB = new Float64Array(k), sumW = new Float64Array(k)
    for (let i = 0; i < n; i++) {
      const c = assign[i], w = weights[i]
      sumL[c] += points[i][0] * w; sumA[c] += points[i][1] * w; sumB[c] += points[i][2] * w; sumW[c] += w
    }
    for (let c = 0; c < k; c++) {
      if (sumW[c] > 0) cen[c] = [sumL[c] / sumW[c], sumA[c] / sumW[c], sumB[c] / sumW[c]]
    }
  }

  // final cluster weights
  const clusterW = new Float64Array(k)
  for (let i = 0; i < n; i++) clusterW[assign[i]] += weights[i]

  return cen.map((c, i) => {
    const [r, g, b] = oklabToRgb(c[0], c[1], c[2])
    return {
      L: c[0], a: c[1], b: c[2], r, g, b,
      weight: clusterW[i],
      chroma: Math.hypot(c[1], c[2]),
      // Oklab hue angle, used to keep the picked colours visually distinct.
      hue: (Math.atan2(c[2], c[1]) * 180 / Math.PI + 360) % 360,
    }
  }).filter((c) => c.weight > 0)
}

// Reduce raw pixels to unique-ish colours (bucketed) with counts, so k-means
// operates on a few hundred weighted points instead of thousands of pixels.
function collect(data) {
  const map = new Map()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 130) continue // skip transparent
    const r = data[i], g = data[i + 1], b = data[i + 2]
    // quantise to 5 bits/channel for the histogram key
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    const e = map.get(key)
    if (e) { e.r += r; e.g += g; e.b += b; e.n++ }
    else map.set(key, { r, g, b, n: 1 })
  }
  const points = [], weights = []
  for (const e of map.values()) {
    const r = e.r / e.n, g = e.g / e.n, b = e.b / e.n
    points.push(rgbToOklab(r, g, b))
    weights.push(e.n)
  }
  return { points, weights }
}

// Analyse an ImageData buffer → { h, s, colors } where `colors` are the image's
// actual dominant vibrant colours (up to 3, most prominent first) so effects
// can reflect the real avatar palette, not just one rotated hue. Returns
// { mono: true } if the image is essentially greyscale.
function analyze(data) {
  const { points, weights } = collect(data)
  const clusters = kmeans(points, weights, K, 14)
  if (!clusters.length) return { mono: true }

  const total = clusters.reduce((sum, c) => sum + c.weight, 0)
  const maxChroma = Math.max(...clusters.map((c) => c.chroma))

  // Only a genuinely colourless image is mono. Judging this on the image's
  // peak chroma (not a fixed cut on every cluster) is what stops a muted but
  // real palette — a photo, a dark or pastel avatar — reading as greyscale.
  if (maxChroma < 0.02) return { mono: true }

  // Vibrancy cut, relative to how colourful this image gets at all. A flat
  // vivid avatar keeps a strict cut; a muted one still surfaces its best
  // colours instead of failing the absolute threshold outright.
  const cut = Math.max(0.022, maxChroma * 0.45)

  // Rank on vibrancy × presence, dropping near-greys and lightness extremes.
  // Chroma is weighted above share so a small vivid region beats a large dull
  // one — the dull region is the background, the vivid one is the subject.
  const vibrant = clusters
    .filter((c) => c.chroma >= cut && c.L >= 0.18 && c.L <= 0.92)
    .map((c) => ({ c, score: Math.pow(c.chroma, 1.4) * Math.pow(c.weight / total, 0.28) }))
    .sort((a, b) => b.score - a.score)
  if (!vibrant.length) return { mono: true }

  // Pick up to 3, skipping hues too close to one already taken, so the banner
  // gets the avatar's distinct colours rather than three shades of one.
  const picked = []
  for (const { c } of vibrant) {
    if (picked.length === 3) break
    const clashes = picked.some((p) => Math.abs(((c.hue - p.hue + 540) % 360) - 180) <= 28)
    if (!clashes) picked.push(c)
  }
  // If hue-dedupe left us short, top up with the best remaining unpicked ones.
  for (const { c } of vibrant) {
    if (picked.length === 3) break
    if (!picked.includes(c)) picked.push(c)
  }

  const primary = picked[0]
  const [h, s] = rgbToHsl(primary.r, primary.g, primary.b)
  const colors = picked.map((c) => rgbHex(c.r, c.g, c.b))
  return { h, s, colors }
}

function readCache(url) {
  try {
    const v = localStorage.getItem(CACHE_PREFIX + url)
    return v ? JSON.parse(v) : null
  } catch { return null }
}

function writeCache(url, val) {
  try { localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(val)) } catch { /* quota/private mode */ }
}

/**
 * Resolve a palette hint for an image URL.
 * @returns Promise<{h:number,s:number,colors:string[]} | {mono:true} | null>
 *   - {h,s,colors}  dominant vibrant hue/sat plus up to 3 dominant hex colours
 *   - {mono}        greyscale image — caller should use a neutral palette
 *   - null          image failed to load / CORS-tainted
 * Cached in localStorage, so repeat calls for the same URL are instant.
 */
export function getPaletteFromUrl(url) {
  const cached = readCache(url)
  if (cached) return Promise.resolve(cached)
  return loadPixels(url).then((data) => {
    if (!data) return null
    const result = analyze(data)
    writeCache(url, result)
    return result
  })
}

// Draw an image into a SAMPLE_SIZE square and hand back its pixels.
// Resolves null on a load failure or a CORS-tainted canvas. Animated PNGs
// (avatar decorations) contribute their first frame, which is all we need.
function loadPixels(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = SAMPLE_SIZE
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, size, size)
        resolve(ctx.getImageData(0, 0, size, size).data)
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

