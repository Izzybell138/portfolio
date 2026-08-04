// Anchor that opens in a new tab with the safe rel attributes. Used for every
// outbound link on the site so the attributes live in exactly one place.
export default function ExternalLink({ href, title, className, style, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={className} style={style}>
      {children}
    </a>
  )
}
