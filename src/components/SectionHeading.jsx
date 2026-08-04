import Icon from './Icon.jsx'
import { headingStyle } from '../lib/styles.js'

// Section heading with either a text glyph (e.g. "✦") or an SVG icon from
// assets — config supplies one or the other per section.
export default function SectionHeading({ glyph, icon, children, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', ...style }}>
      {icon
        ? <span style={{ color: 'var(--accent3, var(--accent))', display: 'flex', alignItems: 'center' }}><Icon name={icon} size={16} /></span>
        : <span style={{ color: 'var(--accent3, var(--accent))', fontSize: '15px' }}>{glyph}</span>}
      <h2 style={headingStyle}>{children}</h2>
    </div>
  )
}
