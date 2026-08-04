import { Suspense, lazy, useCallback, useMemo, useRef } from 'react'
import { EFFECT_LOADERS, effectColorProps } from './backgrounds/registry.js'

// The banner: picks one background effect at random per page load (from the
// config's enabled list), tints it with the avatar palette, and gives it a
// subtle cursor parallax that never reveals the layer's edges.
export default function Banner({ ready, colors = [], effects, shift = 12, overscan = 26 }) {
  // Pick one effect for the life of this mount (unknown names are ignored).
  const name = useMemo(() => {
    const pool = (effects || Object.keys(EFFECT_LOADERS)).filter((n) => EFFECT_LOADERS[n])
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const Effect = useMemo(() => (name ? lazy(EFFECT_LOADERS[name]) : null), [name])
  const layerRef = useRef(null)

  // The effect layer is inset by `overscan` on every side, so shifting up to
  // `shift` px toward the cursor keeps its edges outside the frame — the
  // effect moves with the cursor but never reveals a seam.
  const onMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    if (layerRef.current) {
      layerRef.current.style.transform =
        `translate(${(dx * shift).toFixed(1)}px, ${(dy * shift).toFixed(1)}px)`
    }
  }, [shift])

  const onLeave = useCallback(() => {
    if (layerRef.current) layerRef.current.style.transform = 'translate(0,0)'
  }, [])

  if (!Effect) return null

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      <div
        ref={layerRef}
        style={{
          position: 'absolute',
          inset: `-${overscan}px`,
          transition: 'transform .35s cubic-bezier(.22,.61,.36,1)',
          willChange: 'transform',
        }}
      >
        {ready && (
          <Suspense fallback={null}>
            {/* keyed on colours so a late palette update remounts with the right tint */}
            <Effect key={colors.join(',')} {...effectColorProps(name, colors)} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
