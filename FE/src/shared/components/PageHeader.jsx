import { CButton } from '@coreui/react'
import { FiPlus } from 'react-icons/fi'

export default function PageHeader({
  title,
  description,
  action,
  actionLabel = 'Th\u00eam m\u1edbi',
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <CButton color="primary" onClick={action}>
          <FiPlus /> {actionLabel}
        </CButton>
      )}
    </div>
  )
}
