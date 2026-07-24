import { CBadge } from '@coreui/react'

const statusColors = {
  success: 'success',
  running: 'info',
  pending: 'warning',
  failed: 'danger',
  active: 'success',
  revoked: 'secondary',
  resolved: 'success',
  open: 'danger',
}

export default function StatusBadge({ value }) {
  return (
    <CBadge color={statusColors[value] || 'secondary'} shape="rounded-pill">
      {value}
    </CBadge>
  )
}
