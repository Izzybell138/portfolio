import ExternalLink from '../ExternalLink.jsx'
import SectionHeading from '../SectionHeading.jsx'
import { cardStyle } from '../../lib/styles.js'

const flourishStyle = {
  textAlign: 'center',
  color: 'var(--accent2)',
  opacity: 0.55,
  fontSize: '12px',
  letterSpacing: '3px',
}

// `type: "text"` — heading, optional flourish dividers, centered paragraphs,
// and trailing links. Used by the About tab.
export default function TextSection({ tab }) {
  return (
    <div style={{ ...cardStyle, padding: '22px' }}>
      <SectionHeading glyph={tab.glyph} icon={tab.headingIcon} style={{ marginBottom: '14px' }}>{tab.heading}</SectionHeading>
      {tab.flourish && <div style={{ ...flourishStyle, marginBottom: '16px' }}>{tab.flourish}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
        {(tab.paragraphs || []).map((line, i) => (
          <p key={i} style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--text)', textWrap: 'pretty' }}>{line}</p>
        ))}
      </div>
      {(tab.links || []).map((l) => (
        <div key={l.url} style={{ textAlign: 'center', marginTop: '18px' }}>
          <ExternalLink href={l.url} style={{ color: 'var(--accent3, var(--accent))', fontSize: '13px', borderBottom: '1px solid color-mix(in srgb, var(--accent3, var(--accent)) 40%, transparent)', paddingBottom: '1px' }}>
            {l.label}
          </ExternalLink>
        </div>
      ))}
      {tab.flourish && <div style={{ ...flourishStyle, marginTop: '16px' }}>{tab.flourish}</div>}
    </div>
  )
}
