import ExternalLink from '../ExternalLink.jsx'
import Icon from '../Icon.jsx'
import SectionHeading from '../SectionHeading.jsx'
import { cardStyle } from '../../lib/styles.js'

const projectCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '150px',
  background: 'var(--card2)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '16px',
  transition: 'transform .2s ease,border-color .2s ease',
}

// `type: "projects"` — description cards in a configurable-column grid.
// Cards with a `link` are clickable and get an external-link arrow; cards
// without one render dimmed (e.g. "coming soon").
export default function ProjectsSection({ tab }) {
  const columns = tab.columns || 2
  return (
    <div style={{ ...cardStyle, padding: '20px 22px' }}>
      <SectionHeading glyph={tab.glyph} icon={tab.headingIcon} style={{ marginBottom: '16px' }}>{tab.heading}</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns},1fr)`, gap: '12px' }}>
        {(tab.items || []).map((p) => {
          const body = (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{p.title}</div>
                {p.link && <Icon name="external" size={13} style={{ color: 'var(--muted)' }} />}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '9px', lineHeight: 1.6, textWrap: 'pretty', flexGrow: 1 }}>{p.desc}</div>
            </>
          )
          return p.link ? (
            <ExternalLink key={p.id} href={p.link} className="om-project-card" style={projectCardStyle}>{body}</ExternalLink>
          ) : (
            <div key={p.id} style={{ ...projectCardStyle, opacity: 0.72 }}>{body}</div>
          )
        })}
      </div>
    </div>
  )
}
