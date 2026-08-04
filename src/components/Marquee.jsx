import { marqueeMask } from '../lib/styles.js'

// A masked, infinitely-scrolling row. The actual animation is driven by the
// engine in lib/marquee.js, which finds rows by the .om-marquee class and
// reads speed/direction from the data attributes set here. Children should be
// rendered twice by the caller for a seamless wrap.
export default function Marquee({ settings = {}, children }) {
  return (
    <div style={marqueeMask}>
      <div
        className="om-marquee"
        data-dir={settings.direction ?? -1}
        data-speed={settings.speed ?? 36}
        style={{ display: 'flex', gap: '14px', width: 'max-content', willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  )
}
