import { useEffect, useRef, useState } from 'react'
import ImageSlot from './components/ImageSlot.jsx'

const DISCORD_ID = '1164594827883728987'

const GAMES = [
  { label: 'Minecraft', short: 'MC' },
  { label: 'Geometry Dash', short: 'GD' },
  { label: 'Rocket League', short: 'RL' },
  { label: 'osu!', short: 'osu' },
  { label: 'Add a game', short: '＋' },
  { label: 'Add a game', short: '＋' },
]

const LANGS = [
  { key: 'html', label: 'HTML' }, { key: 'css', label: 'CSS' }, { key: 'js', label: 'JavaScript' },
  { key: 'react', label: 'React' }, { key: 'cpp', label: 'C++' }, { key: 'java', label: 'Java' },
  { key: 'python', label: 'Python' }, { key: 'git', label: 'Git' }, { key: 'github', label: 'GitHub' },
  { key: 'mysql', label: 'MySQL' },
]

// ── color helpers ──────────────────────────────────────────────────────────
function hslStr(h, s, l) {
  return `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l}%)`
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return [h, s, l]
}

export default function App() {
  const rootRef = useRef(null)
  const rafRef = useRef(null)

  const [state, setState] = useState({
    avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
    displayName: 'username',
    userTag: '@username',
    statusText: 'Connecting…',
    statusColor: '#747f8d',
    activeTab: 'about',
    decorationUrl: '',
    hasDecoration: false,
  })

  // ── palette / status application on the root element ─────────────────────
  const applyStatus = (color) => {
    if (rootRef.current) rootRef.current.style.setProperty('--status', color)
  }

  const applyPalette = (h, s) => {
    const root = rootRef.current
    if (!root) return
    const set = (k, v) => root.style.setProperty(k, v)
    const sp = (s * 100).toFixed(0)
    set('--accent', hslStr(h, +sp, 62))
    set('--accent2', hslStr((h + 28) % 360, +sp, 56))
    set('--bg', hslStr(h, 22, 4.5))
    set('--card', hslStr(h, 18, 8))
    set('--card2', hslStr(h, 16, 12.5))
    set('--card3', hslStr(h, 15, 17))
    set('--border', `hsla(${h.toFixed(0)},25%,82%,0.09)`)
  }

  const applyMono = () => {
    const root = rootRef.current
    if (!root) return
    const set = (k, v) => root.style.setProperty(k, v)
    const H = 225 // cool neutral hue for barely-there tint
    set('--accent', hslStr(H, 8, 84))
    set('--accent2', hslStr(H, 10, 60))
    set('--bg', hslStr(H, 8, 4.5))
    set('--card', hslStr(H, 7, 8))
    set('--card2', hslStr(H, 7, 12.5))
    set('--card3', hslStr(H, 7, 17))
    set('--border', `hsla(${H},12%,85%,0.09)`)
  }

  const extractPalette = (url) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const s = 64
        const c = document.createElement('canvas')
        c.width = s; c.height = s
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0, s, s)
        const data = ctx.getImageData(0, 0, s, s).data
        // Bucket vibrant pixels by hue; weight by saturation so
        // the accent reflects the most colorful dominant hue, not a gray average.
        const buckets = {}
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
          if (a < 130) continue
          const [h, sat, l] = rgbToHsl(r, g, b)
          if (sat < 0.18 || l < 0.15 || l > 0.9) continue // skip grays & extremes
          const key = Math.round(h / 12) * 12
          const w = sat * sat // emphasise saturated pixels
          if (!buckets[key]) buckets[key] = { w: 0, hx: 0, hy: 0, smax: 0, ls: 0, ln: 0 }
          const bk = buckets[key]
          const rad = h * Math.PI / 180
          bk.w += w
          bk.hx += Math.cos(rad) * w
          bk.hy += Math.sin(rad) * w
          bk.smax = Math.max(bk.smax, sat)
          bk.ls += l * w; bk.ln += w
        }
        let best = null
        for (const k in buckets) {
          if (!best || buckets[k].w > best.w) best = buckets[k]
        }
        if (!best) { applyMono(); return } // grayscale / monochrome avatar
        let h = Math.atan2(best.hy, best.hx) * 180 / Math.PI
        if (h < 0) h += 360
        const sat = Math.min(0.9, Math.max(0.55, best.smax))
        applyPalette(h, sat)
      } catch (e) { /* CORS / decode failure — keep defaults */ }
    }
    img.src = url
  }

  // ── lanyard fetch ────────────────────────────────────────────────────────
  const fetchLanyard = async () => {
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)
      const json = await res.json()
      if (!json.success) throw new Error('lanyard failed')
      const d = json.data
      const u = d.discord_user
      const name = u.global_name || u.username || 'user'
      const avatar = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${(Number(u.discriminator) || 0) % 5}.png`
      const statusMap = {
        online: ['#43b581', 'Online'],
        idle: ['#faa61a', 'Idle'],
        dnd: ['#f04747', 'Do Not Disturb'],
        offline: ['#747f8d', 'Offline'],
      }
      const st = statusMap[d.discord_status] || statusMap.offline
      const deco = u.avatar_decoration_data
      setState((prev) => ({
        ...prev,
        avatarUrl: avatar,
        displayName: name,
        userTag: '@' + (u.username || name),
        statusText: st[1],
        statusColor: st[0],
        hasDecoration: !!(deco && deco.asset),
        decorationUrl: deco && deco.asset
          ? `https://cdn.discordapp.com/avatar-decoration-presets/${deco.asset}.png?size=160&passthrough=true`
          : '',
      }))
      applyStatus(st[0])
      extractPalette(avatar)
    } catch (e) {
      setState((prev) => ({ ...prev, statusText: 'Offline', statusColor: '#747f8d' }))
      applyStatus('#747f8d')
    }
  }

  // ── marquees ─────────────────────────────────────────────────────────────
  const startMarquees = () => {
    const reg = new WeakSet()
    const tracks = []
    const scan = () => {
      document.querySelectorAll('.om-marquee').forEach((el) => {
        if (reg.has(el)) return
        reg.add(el)
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
      rafRef.current = requestAnimationFrame(tick)
    }
    scan()
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    fetchLanyard()
    startMarquees()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // apply initial status color once the root is available
  useEffect(() => {
    applyStatus(state.statusColor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── derived render values ────────────────────────────────────────────────
  const active = state.activeTab
  const langs = LANGS.map((l) => ({ ...l, url: `https://skillicons.dev/icons?i=${l.key}` }))
  const langsLoop = [...langs, ...langs]
  const gamesLoop = [...GAMES, ...GAMES]

  const tabBtn = (on) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    cursor: 'pointer',
    padding: '11px 6px',
    borderRadius: '10px',
    border: '1px solid ' + (on ? 'transparent' : 'var(--border)'),
    background: on ? 'var(--accent)' : 'transparent',
    color: on ? '#0b0d10' : 'var(--muted)',
    transition: 'all .18s ease',
  })

  const setTab = (tab) => setState((prev) => ({ ...prev, activeTab: tab }))

  return (
    <div
      ref={rootRef}
      style={{
        '--bg': '#08090c',
        '--card': '#0f1116',
        '--card2': '#161922',
        '--card3': '#1c202b',
        '--accent': '#5865f2',
        '--accent2': '#7d5bf2',
        '--text': '#f4f5f7',
        '--muted': '#8a92a1',
        '--border': 'rgba(255,255,255,.06)',
        '--status': '#43b581',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '48px 20px 80px',
        background: 'radial-gradient(1200px 600px at 50% -10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%), var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ===== PROFILE CARD ===== */}
        <div style={{ animation: 'fadeUp .6s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 60px -20px rgba(0,0,0,.7)' }}>
          <div style={{ height: '130px', background: 'linear-gradient(120deg, var(--accent), var(--accent2))', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(400px 200px at 80% 120%, rgba(255,255,255,.18), transparent 60%)' }} />
          </div>
          <div style={{ padding: '0 22px 22px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-46px', left: '22px' }}>
              <div style={{ position: 'relative', width: '92px', height: '92px' }}>
                <div style={{ width: '92px', height: '92px', borderRadius: '50%', border: '6px solid var(--card)', overflow: 'hidden', background: 'var(--card2)' }}>
                  <img src={state.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                {state.hasDecoration && (
                  <img src={state.decorationUrl} alt="decoration" style={{ position: 'absolute', top: '50%', left: '50%', width: '124%', height: '124%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
                )}
                <span style={{ position: 'absolute', right: '2px', bottom: '8px', width: '20px', height: '20px', borderRadius: '50%', border: '4px solid var(--card)', background: 'var(--status)', animation: 'pulse 2.4s infinite', zIndex: 2 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', gap: '8px' }}>
              <a href="#" title="GitHub" className="om-social" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" /></svg>
              </a>
              <a href="#" title="Email" className="om-social" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
              </a>
            </div>

            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px' }}>{state.displayName}</h1>
                <span style={{ fontSize: '12px', color: 'var(--muted)', background: 'var(--card2)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: '20px' }}>{state.userTag}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '6px', fontSize: '13px', color: 'var(--muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status)', display: 'inline-block' }} />
                {state.statusText}
              </div>
            </div>
          </div>
        </div>

        {/* ===== TAB BAR ===== */}
        <div style={{ animation: 'fadeUp .6s ease .06s both', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '6px' }}>
          <button onClick={() => setTab('about')} title="About" style={tabBtn(active === 'about')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>
          </button>
          <button onClick={() => setTab('skills')} title="Skills" style={tabBtn(active === 'skills')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 6 3 12 8 18" /><polyline points="16 6 21 12 16 18" /></svg>
          </button>
          <button onClick={() => setTab('music')} title="Music" style={tabBtn(active === 'music')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </button>
          <button onClick={() => setTab('projects')} title="Projects" style={tabBtn(active === 'projects')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          </button>
        </div>

        {/* ===== ABOUT ===== */}
        {active === 'about' && (
          <div style={{ animation: 'fadeUp .45s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>✦</span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>About Me</h2>
            </div>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--text)', textWrap: 'pretty' }}>
              placeholder — write a sentence or two about who you are, what you love building, and what you're into. This copy is fully editable, so drop your real bio here whenever you're ready.
            </p>
          </div>
        )}

        {/* ===== SKILLS + CAROUSEL ===== */}
        {active === 'skills' && (
          <div style={{ animation: 'fadeUp .45s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 0 22px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px', padding: '0 22px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>⌘</span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Interests &amp; Skills</h2>
            </div>
            <div style={{ padding: '0 22px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Web Development', 'UI / UX', 'Open Source', 'Game Dev'].map((t) => (
                <span key={t} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '20px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)' }}>{t}</span>
              ))}
            </div>
            <div style={{ position: 'relative', padding: '12px 0', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)' }}>
              <div className="om-marquee om-lang" data-dir="-1" data-speed="38" style={{ display: 'flex', gap: '14px', width: 'max-content', willChange: 'transform' }}>
                {langsLoop.map((lang, i) => (
                  <div key={i} title={lang.label} className="om-lang-tile" style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform .25s ease' }}>
                    <img src={lang.url} alt={lang.label} width="34" height="34" style={{ display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', margin: '22px 22px 14px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>🎮</span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Games In Rotation</h2>
            </div>
            <div style={{ position: 'relative', padding: '12px 0', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)' }}>
              <div className="om-marquee om-games" data-dir="1" data-speed="34" style={{ display: 'flex', gap: '14px', width: 'max-content', willChange: 'transform' }}>
                {gamesLoop.map((game, i) => (
                  <div key={i} title={game.label} className="om-game-card" style={{ width: '118px', flexShrink: 0, borderRadius: '14px', overflow: 'hidden', background: 'var(--card2)', border: '1px solid var(--border)', transition: 'transform .25s ease' }}>
                    <div style={{ height: '66px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', fontSize: '22px', fontWeight: 800, color: '#0b0d10' }}>{game.short}</div>
                    <div style={{ padding: '8px 11px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== MUSIC ===== */}
        {active === 'music' && (
          <div style={{ animation: 'fadeUp .45s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>♫</span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Music Taste</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'album1', title: 'ungrateful', artist: 'gryp' },
                { id: 'album2', title: 'stairs', artist: 'design19' },
                { id: 'album3', title: 'around the fur', artist: 'deftones' },
              ].map((a) => (
                <div key={a.id} className="om-music-row" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '8px', borderRadius: '12px', background: 'var(--card2)', border: '1px solid var(--border)', transition: 'background .2s ease' }}>
                  <ImageSlot shape="rounded" radius={8} placeholder="Cover" style={{ width: '52px', height: '52px', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{a.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PROJECTS ===== */}
        {active === 'projects' && (
          <div style={{ animation: 'fadeUp .45s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>▶</span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Current Projects</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { id: 'proj1', title: 'Project One' },
                { id: 'proj2', title: 'Project Two' },
                { id: 'proj3', title: 'Project Three' },
                { id: 'proj4', title: 'Project Four' },
              ].map((p) => (
                <div key={p.id} className="om-project-card" style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', transition: 'transform .2s ease,border-color .2s ease' }}>
                  <ImageSlot shape="rect" placeholder="Preview" style={{ width: '100%', height: '88px', display: 'block' }} />
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{p.title}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.5 }}>placeholder — one line about it.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', opacity: 0.6, paddingTop: '4px' }}>palette pulled live from your discord avatar via lanyard</div>

      </div>
    </div>
  )
}
