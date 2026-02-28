import { getAvatarColor, getInitials } from '../../hooks/usePresence'

export default function PresenceRail({ nearbyMembers, currentPage }) {
  if (nearbyMembers.length === 0) return null

  return (
    <div className="presence-rail">
      {nearbyMembers.map(member => {
        const diff = member.current_page - currentPage
        const isSamePage = diff === 0
        const opacity = 1 - Math.abs(diff) * 0.08 // Fade with distance

        let label
        if (isSamePage) {
          label = '&#128214; here'
        } else if (diff > 0) {
          label = `+${diff}p`
        } else {
          label = `${diff}p`
        }

        return (
          <div
            key={member.id}
            className="presence-member"
            style={{ opacity }}
            title={`${member.name} — Page ${member.current_page}`}
          >
            <div
              className={`presence-avatar ${isSamePage ? 'same-page' : ''}`}
              style={{ backgroundColor: getAvatarColor(member.name) }}
            >
              {getInitials(member.name)}
            </div>
            <span
              className="presence-label"
              dangerouslySetInnerHTML={{ __html: label }}
            />
          </div>
        )
      })}
    </div>
  )
}
