import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'om-audio-muted'
const FOCUS_KEY = 'om-audio-focus'
const VOL_KEY = 'om-audio-vol'

export default function AmbientAudio({
  src,
  volume = 0.1,
  loop = false,
  showToggle = true,
  clickToStart = true,
  pauseWhenUnfocused = true,
  gateLabel = 'click anywhere to enter'
}) {
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })
  const [keepPlaying, setKeepPlaying] = useState(() => {
    try { return localStorage.getItem(FOCUS_KEY) === '1' } catch { return false }
  })
  const [vol, setVol] = useState(() => {
    try {
      const v = localStorage.getItem(VOL_KEY)
      return v !== null ? parseFloat(v) : volume
    } catch { return volume }
  })
  const [started, setStarted] = useState(!clickToStart)
  const [focused, setFocused] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (pauseWhenUnfocused && !keepPlaying) return
    const sync = () => setFocused(document.hasFocus() && !document.hidden)
    sync()
    window.addEventListener('focus', sync)
    window.addEventListener('blur', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('focus', sync)
      window.removeEventListener('blur', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [pauseWhenUnfocused])

  useEffect(() => {
    const el = audioRef.current
    if (!el || !src) return
    el.volume = vol

    if (started && !muted && (keepPlaying || !pauseWhenUnfocused || focused)) {
      const p = el.play()
      if (p && p.then) p.then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      el.pause()
      setPlaying(false)
    }
  }, [started, muted, focused, src, vol, pauseWhenUnfocused, keepPlaying])

  useEffect(() => {
    if (clickToStart || muted || !src) return
    const el = audioRef.current
    if (!el || !el.paused) return

    const onGesture = () => { setStarted(true); cleanup() }
    const opts = { once: true, passive: true }
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, onGesture, opts))
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, onGesture))
    return cleanup
  }, [clickToStart, muted, src, playing])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0') } catch {}
  }, [muted])

  useEffect(() => {
    try { localStorage.setItem(FOCUS_KEY, keepPlaying ? '1' : '0') } catch {}
  }, [keepPlaying])

  useEffect(() => {
    try { localStorage.setItem(VOL_KEY, String(vol)) } catch {}
  }, [vol])

  if (!src) return null

  const toggle = () => {
    if (playing) { setMuted(true); return }
    setMuted(false)
    setStarted(true)
  }

  const showGate = clickToStart && !started && !muted && !failed

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop={loop}
        preload="auto"
        onEnded={() => setPlaying(false)}
        onError={() => { setFailed(true); setStarted(true) }}
      />

      {showGate && (
        <div className="om-gate" onClick={() => setStarted(true)}>
          <button className="om-gate-bubble" onClick={() => setStarted(true)}>
            {gateLabel}
          </button>
        </div>
      )}

      {showToggle && !failed && !showGate && (
        <button
          onClick={toggle}
          className="om-audio-toggle"
          title={playing ? 'Mute music' : 'Play music'}
          aria-label={playing ? 'Mute music' : 'Play music'}
        >
          {playing ? '♪' : '♪̸'}
        </button>
      )}

      {showToggle && !failed && !showGate && (
        <button
          onClick={() => setKeepPlaying(!keepPlaying)}
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            zIndex: 9999,
            background: keepPlaying ? 'var(--accent)' : 'var(--card2)',
            color: keepPlaying ? 'var(--bg)' : 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            opacity: 0.85,
            transition: 'all .2s ease'
          }}
          title={keepPlaying ? 'Pause when tab loses focus' : 'Keep playing in background'}
          aria-label={keepPlaying ? 'Pause when tab loses focus' : 'Keep playing in background'}
        >
          ▶ Play
        </button>
      )}

      {showToggle && !failed && !showGate && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '6px 14px',
            opacity: 0.85,
            transition: 'all .2s ease'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text)', userSelect: 'none' }}>🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={vol}
            onChange={(e) => setVol(parseFloat(e.target.value))}
            style={{
              width: '80px',
              height: '4px',
              accentColor: 'var(--accent)',
              cursor: 'pointer'
            }}
            title={`Volume: ${Math.round(vol * 100)}%`}
            aria-label="Volume"
          />
          <span style={{ fontSize: '11px', color: 'var(--text)', userSelect: 'none', minWidth: '28px', textAlign: 'right' }}>{Math.round(vol * 100)}%</span>
        </div>
      )}
    </>
  )
}
