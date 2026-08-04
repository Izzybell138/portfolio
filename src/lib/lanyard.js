// ── lanyard.js ───────────────────────────────────────────────────────────
// Fetches Discord presence via the Lanyard API and normalises it into the
// shape the app renders: display name, tag, avatar/decoration URLs, and the
// presence key ('online' | 'idle' | 'dnd' | 'offline'). Throws on failure —
// the caller decides the fallback.

const CDN = 'https://cdn.discordapp.com'

export async function fetchPresence(discordId) {
  const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`)
  const json = await res.json()
  if (!json.success) throw new Error('lanyard request failed')

  const data = json.data
  const user = data.discord_user
  const name = user.global_name || user.username || 'user'
  const avatarUrl = user.avatar
    ? `${CDN}/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
    : `${CDN}/embed/avatars/${(Number(user.discriminator) || 0) % 5}.png`
  const deco = user.avatar_decoration_data

  return {
    displayName: name,
    userTag: '@' + (user.username || name),
    avatarUrl,
    statusKey: data.discord_status,
    decorationUrl: deco && deco.asset
      ? `${CDN}/avatar-decoration-presets/${deco.asset}.png?size=160&passthrough=true`
      : '',
  }
}
