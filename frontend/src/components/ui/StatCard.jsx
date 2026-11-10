const iconMap = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
}

export default function StatCard({ label, value, icon: IconComponent, color = 'primary', sub }) {
  const tone = iconMap[color] || 'primary'

  return (
    <div className={`card stat-card stat-card-${tone}`}>
      <div className={`stat-icon ${tone}`}>
        {IconComponent && <IconComponent size={22} />}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}
