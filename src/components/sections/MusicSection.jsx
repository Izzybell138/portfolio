import SectionHeading from '../SectionHeading.jsx'
import { cardStyle } from '../../lib/styles.js'

// `type: "music"` — official Spotify embed players for each configured track
// (30s preview for anyone, full track for logged-in Spotify listeners), plus
// an optional footnote.
export default function MusicSection({ tab }) {
  return (
    <div style={{ ...cardStyle, padding: '20px 22px' }}>
      <SectionHeading glyph={tab.glyph} icon={tab.headingIcon} style={{ marginBottom: '16px' }}>{tab.heading}</SectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(tab.tracks || []).map((t) => (
          <iframe
            key={t.id}
            title={`${t.title} — ${t.artist}`}
            src={`https://open.spotify.com/embed/track/${t.id}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            loading="lazy"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            style={{ borderRadius: '12px', border: 'none', display: 'block', colorScheme: 'normal' }}
          />
        ))}
      </div>
      {tab.note && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '12px', opacity: 0.7, lineHeight: 1.5 }}>{tab.note}</div>
      )}
    </div>
  )
}
