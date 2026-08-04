import ExternalLink from '../ExternalLink.jsx'
import Marquee from '../Marquee.jsx'
import SectionHeading from '../SectionHeading.jsx'
import { cardStyle } from '../../lib/styles.js'

export default function SkillsSection({ tab }) {
  const langs = (tab.languages?.items || []).map((l) => ({ ...l, url: `https://skillicons.dev/icons?i=${l.key}` }))
  const langsLoop = [...langs, ...langs]
  const games = tab.games?.items || []
  const gamesLoop = [...games, ...games]
  return (
    <div style={{ ...cardStyle, padding: '20px 0 22px', overflow: 'hidden' }}>
      <SectionHeading glyph={tab.glyph} icon={tab.headingIcon} style={{ marginBottom: '16px', padding: '0 22px' }}>{tab.heading}</SectionHeading>
      <div style={{ padding: '0 22px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {(tab.interests || []).map((t) => (
          <span key={t} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '20px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)' }}>{t}</span>
        ))}
      </div>
      <Marquee settings={tab.languages?.marquee}>
        {langsLoop.map((lang, i) => (
          <ExternalLink key={i} href={lang.link} title={lang.label} className="om-lang-tile" style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform .25s ease' }}>
            <img src={lang.url} alt={lang.label} width="34" height="34" style={{ display: 'block' }} />
          </ExternalLink>
        ))}
      </Marquee>
      {games.length > 0 && (
        <>
          <SectionHeading glyph={tab.games.headingGlyph} icon={tab.games.headingIcon} style={{ margin: '22px 22px 14px' }}>{tab.games.heading}</SectionHeading>
          {games.length === 1 ? (
            <div style={{ padding: '0 22px' }}>
              <ExternalLink href={games[0].link} title={games[0].label} className="om-game-card" style={{ width: '118px', borderRadius: '14px', overflow: 'hidden', background: 'var(--card2)', border: '1px solid var(--border)', transition: 'transform .25s ease', display: 'inline-block' }}>
                <div style={{ aspectRatio: '3 / 4', background: games[0].bg || 'var(--card3)', overflow: 'hidden', padding: games[0].fit === 'contain' ? '16px' : 0 }}>
                  <img src={games[0].img} alt={games[0].label} loading="lazy" draggable="false" style={{ width: '100%', height: '100%', objectFit: games[0].fit || 'cover', display: 'block', userSelect: 'none' }} />
                </div>
                <div style={{ padding: '8px 11px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{games[0].label}</div>
              </ExternalLink>
            </div>
          ) : (
            <Marquee settings={tab.games.marquee}>
              {gamesLoop.map((game, i) => (
                <ExternalLink key={i} href={game.link} title={game.label} className="om-game-card" style={{ width: '118px', flexShrink: 0, borderRadius: '14px', overflow: 'hidden', background: 'var(--card2)', border: '1px solid var(--border)', transition: 'transform .25s ease' }}>
                  <div style={{ aspectRatio: '3 / 4', background: game.bg || 'var(--card3)', overflow: 'hidden', padding: game.fit === 'contain' ? '16px' : 0 }}>
                    <img src={game.img} alt={game.label} loading="lazy" draggable="false" style={{ width: '100%', height: '100%', objectFit: game.fit || 'cover', display: 'block', userSelect: 'none' }} />
                  </div>
                  <div style={{ padding: '8px 11px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.label}</div>
                </ExternalLink>
              ))}
            </Marquee>
          )}
        </>
      )}
    </div>
  )
}
