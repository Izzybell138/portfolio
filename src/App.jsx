import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import AmbientAudio from './components/AmbientAudio.jsx'
import Banner from './components/Banner.jsx'
import ExternalLink from './components/ExternalLink.jsx'
import Icon from './components/Icon.jsx'
import { SECTION_TYPES } from './components/sections/registry.js'
import { fetchPresence } from './lib/lanyard.js'
import { startMarquees } from './lib/marquee.js'
import { getPaletteFromUrl } from './lib/okolors.js'
import { MONO_BANNER_COLORS, bannerColors, blendDecoration, monoVars, paletteVars, themeVars } from './lib/palette.js'
import config from './site.config.json'

// All content and tunables (profile, socials, theme, banner effects, tabs and
// their sections, footer) live in src/site.config.json — edit that, not this.
// This file owns page state (presence, palette, active tab) and the layout
// shell; sections render via components/sections/registry.js.

const THEME_VARS = themeVars(config.theme)
const DEFAULT_BANNER_COLORS = config.banner.defaultColors
const BG = config.background || {}
const AUDIO = config.audio || {}

// Loaded on demand so the point-cloud's WebGL code isn't in the entry chunk.
const Particles = lazy(() => import('./components/backgrounds/Particles.jsx'))

// Shared by the social links and the copy-to-clipboard buttons, so the two
// render identically whichever element type they end up as.
const socialStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  background: 'var(--card2)',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all .2s ease',
}

export default function App() {
  const rootRef = useRef(null)

  const [state, setState] = useState({
    avatarUrl: config.profile.fallbackAvatar,
    displayName: config.profile.fallbackName,
    userTag: '@' + (config.profile.username || config.profile.fallbackName),
    statusText: config.status.connecting.label,
    statusColor: config.status.connecting.color,
    activeTab: config.tabs[0]?.id,
    decorationUrl: '',
    hasDecoration: false,
  })

  // Colours handed to the banner effect. `ready` gates the effect so it mounts
  // once with the correct (avatar-matched) colours instead of flashing defaults.
  const [banner, setBanner] = useState({ ready: false, colors: DEFAULT_BANNER_COLORS })
  const revealBanner = (colors, force) =>
    setBanner((b) => (force || !b.ready ? { ready: true, colors } : b))

  const setRootVars = (vars) => {
    const root = rootRef.current
    if (!root) return
    for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value)
  }

  // The avatar and its decoration are analysed separately, then blended. The
  // decoration contributes at reduced strength — see blendDecoration for why
  // an equal-terms merge would let it take the theme over outright.
  const resolvePalette = (avatarUrl, decorationUrl) => {
    const { decorationInfluence = 0.35, accentShift = 0.55 } = config.palette
    if (!decorationUrl || decorationInfluence <= 0) {
      return getPaletteFromUrl(avatarUrl).then((res) =>
        (res && !res.mono ? blendDecoration(res, null, 0, accentShift) : res))
    }
    return Promise.all([getPaletteFromUrl(avatarUrl), getPaletteFromUrl(decorationUrl)])
      .then(([avatar, deco]) =>
        (avatar ? blendDecoration(avatar, deco, decorationInfluence, accentShift) : avatar))
  }

  // Palette generation via Okolors' approach (Oklab k-means), see lib/okolors.js.
  // Results are cached per-URL in localStorage, so this is instant on revisit.
  const extractPalette = (url, decorationUrl) => {
    resolvePalette(url, decorationUrl).then((res) => {
      if (!res) { revealBanner(DEFAULT_BANNER_COLORS, false); return } // load/CORS failure
      if (res.mono) { setRootVars(monoVars()); revealBanner(MONO_BANNER_COLORS, true); return } // greyscale
      const sat = Math.min(config.palette.maxSaturation, Math.max(config.palette.minSaturation, res.s))
      setRootVars(paletteVars(res, sat))
      revealBanner(bannerColors(res, sat), true)
    })
  }

  const loadPresence = async () => {
    try {
      const presence = await fetchPresence(config.profile.discordId)
      const st = config.status[presence.statusKey] || config.status.offline
      setState((prev) => ({
        ...prev,
        avatarUrl: presence.avatarUrl,
        displayName: presence.displayName,
        userTag: presence.userTag,
        statusText: st.label,
        statusColor: st.color,
        hasDecoration: !!presence.decorationUrl,
        decorationUrl: presence.decorationUrl,
      }))
      setRootVars({ '--status': st.color })
      extractPalette(presence.avatarUrl, presence.decorationUrl)
    } catch (e) {
      const st = config.status.offline
      setState((prev) => ({ ...prev, statusText: st.label, statusColor: st.color }))
      setRootVars({ '--status': st.color })
      revealBanner(DEFAULT_BANNER_COLORS, false)
    }
  }

  useEffect(() => {
    loadPresence()
    const stopMarquees = startMarquees()
    // Fallback: if the avatar never resolves, show the effect with defaults.
    const t = setTimeout(() => revealBanner(DEFAULT_BANNER_COLORS, false), config.banner.revealTimeoutMs)
    return () => { clearTimeout(t); stopMarquees() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── render ───────────────────────────────────────────────────────────────
  const active = state.activeTab
  const activeTab = config.tabs.find((t) => t.id === active)
  const Section = activeTab ? SECTION_TYPES[activeTab.type] : null

  // Which social was just copied, so the button can confirm it briefly.
  const [copied, setCopied] = useState('')
  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // clipboard API needs a secure context; fall back for plain http.
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* nothing else to try */ }
      document.body.removeChild(ta)
    }
    setCopied(key)
    setTimeout(() => setCopied((c) => (c === key ? '' : c)), 1600)
  }

  const bg = BG
  // The palette's dark shade — index 3 of the banner quad. Falls back to the
  // configured default before the avatar has been analysed.
  const particleColor = banner.colors[3] || DEFAULT_BANNER_COLORS[3]

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
        ...THEME_VARS,
        '--vignette': bg.vignetteStrength ?? 0.55,
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
      {/* ===== PAGE BACKGROUND ===== */}
      {bg.particles !== false && (
        <div className="om-particles" aria-hidden="true">
          <Suspense fallback={null}>
            {/* keyed on the colour so a late palette update restarts the field */}
            <Particles
              key={particleColor}
              particleColors={[particleColor]}
              particleCount={bg.particleCount ?? 800}
              particleSpread={bg.particleSpread ?? 20}
              speed={bg.particleSpeed ?? 0.3}
              particleBaseSize={bg.particleBaseSize ?? 100}
              moveParticlesOnHover
              alphaParticles={false}
              disableRotation
            />
          </Suspense>
        </div>
      )}
      {bg.vignette !== false && <div className="om-vignette" aria-hidden="true" />}

      {/* Renders nothing until audio.src is set in site.config.json. */}
      <AmbientAudio
        src={AUDIO.src}
        volume={AUDIO.volume ?? 0.1}
        loop={AUDIO.loop ?? false}
        showToggle={AUDIO.showToggle !== false}
        clickToStart={AUDIO.clickToStart !== false}
        pauseWhenUnfocused={AUDIO.pauseWhenUnfocused !== false}
        gateLabel={AUDIO.gateLabel || 'click anywhere to enter'}
      />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ===== PROFILE CARD ===== */}
        <div style={{ animation: 'fadeUp .6s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 60px -20px rgba(0,0,0,.7)' }}>
          <div style={{ height: '130px', background: 'linear-gradient(120deg, var(--accent), var(--accent2) 55%, var(--accent3, var(--accent2)))', position: 'relative', overflow: 'hidden' }}>
            <Banner
              ready={banner.ready}
              colors={banner.colors}
              effects={config.banner.effects}
              shift={config.banner.parallaxShift}
              overscan={config.banner.overscan}
            />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(400px 200px at 80% 120%, rgba(255,255,255,.18), transparent 60%)' }} />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,.28))' }} />
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
              {config.profile.socials.map((s) => (
                // A social with `copy` instead of `url` puts that text on the
                // clipboard rather than navigating — used for the address, so
                // it isn't a mailto: and isn't scrapeable as a link.
                s.copy ? (
                  <button
                    key={s.title}
                    onClick={() => copyToClipboard(s.copy, s.title)}
                    className="om-social"
                    title={copied === s.title ? 'Copied' : `Copy ${s.copy}`}
                    aria-label={`Copy ${s.title.toLowerCase()} address`}
                    style={{ ...socialStyle, cursor: 'pointer', fontFamily: 'inherit', color: copied === s.title ? 'var(--accent3, var(--accent))' : 'inherit' }}
                  >
                    {copied === s.title ? '✓' : <Icon name={s.icon} size={18} />}
                  </button>
                ) : (
                  <ExternalLink key={s.title} href={s.url} title={s.title} className="om-social" style={socialStyle}>
                    <Icon name={s.icon} size={18} />
                  </ExternalLink>
                )
              ))}
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
        <div style={{ animation: 'fadeUp .6s ease .06s both', display: 'grid', gridTemplateColumns: `repeat(${config.tabs.length},1fr)`, gap: '6px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '6px' }}>
          {config.tabs.map((tab) => (
            <button key={tab.id} onClick={() => setTab(tab.id)} title={tab.title} style={tabBtn(active === tab.id)}>
              <Icon name={tab.icon} size={18} />
            </button>
          ))}
        </div>

        {/* ===== ACTIVE SECTION ===== */}
        {Section && <Section key={activeTab.id} tab={activeTab} />}

        {config.footer && (
          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', opacity: 0.6, paddingTop: '4px' }}>{config.footer}</div>
        )}

      </div>
    </div>
  )
}
