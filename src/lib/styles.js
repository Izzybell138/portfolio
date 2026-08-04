// ── styles.js ────────────────────────────────────────────────────────────
// Shared inline style objects used by more than one component. Anything used
// by a single component stays in that component.

// The rounded card every tab section sits in.
export const cardStyle = {
  animation: 'fadeUp .45s ease both',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
}

// The small uppercase section heading text.
export const headingStyle = {
  margin: 0,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// Horizontal fade mask wrapped around each marquee row.
export const marqueeMask = {
  position: 'relative',
  padding: '12px 0',
  WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)',
  maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)',
}
