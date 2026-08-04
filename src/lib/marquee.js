// ── marquee.js ───────────────────────────────────────────────────────────
// The infinite-scroll marquee engine. Watches the document for `.om-marquee`
// elements (rows appear and disappear as tabs switch), scrolls each at its
// `data-speed` px/s in `data-dir`, eases to a stop on hover, and wraps at the
// halfway point (rows render their items twice for a seamless loop).
//
// Returns a stop() function that cancels the animation frame loop.

export function startMarquees() {
  const registered = new WeakSet()
  const tracks = []
  let rafId = null

  const scan = () => {
    document.querySelectorAll('.om-marquee').forEach((el) => {
      if (registered.has(el)) return
      registered.add(el)
      const full = parseFloat(el.dataset.speed) || 36
      const dir = parseFloat(el.dataset.dir) || -1
      const st = { el, full, dir, speed: full, target: full, offset: 0, half: 0 }
      el.addEventListener('mouseenter', () => { st.target = 0 })
      el.addEventListener('mouseleave', () => { st.target = st.full })
      tracks.push(st)
    })
  }

  let last = performance.now(), acc = 0
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    acc += dt
    if (acc > 0.4) { acc = 0; scan() }
    for (let i = tracks.length - 1; i >= 0; i--) {
      const st = tracks[i]
      if (!st.el.isConnected) { tracks.splice(i, 1); continue }
      if (!st.half) { st.half = st.el.scrollWidth / 2; if (!st.half) continue }
      st.speed += (st.target - st.speed) * Math.min(1, dt * 6) // smooth slow-to-stop
      st.offset += st.dir * st.speed * dt
      if (st.offset <= -st.half) st.offset += st.half
      else if (st.offset >= 0) st.offset -= st.half
      st.el.style.transform = 'translateX(' + st.offset.toFixed(2) + 'px)'
    }
    rafId = requestAnimationFrame(tick)
  }

  scan()
  rafId = requestAnimationFrame(tick)

  return function stop() {
    if (rafId) cancelAnimationFrame(rafId)
  }
}
