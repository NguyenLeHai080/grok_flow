import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { FiGlobe } from 'react-icons/fi'

export function Dashboard({ data }) {
  const usage = data.usage || {}
  const resources = data.resources || {}
  const series = data.series || []
  const maxRequests = Math.max(...series.map((item) => item.requests || 0), 1)
  const cards = [
    ['Requests', usage.requests || 0],
    ['Tỷ lệ thành công', `${usage.successRate || 0}%`],
    ['Total tokens', usage.tokens || 0],
    ['Chi phí', `$${((usage.billedCostUsdTicks || 0) / 1e9).toFixed(4)}`],
    ['Accounts hoạt động', `${resources.activeAccounts || 0}/${resources.totalAccounts || 0}`],
    ['Models khả dụng', `${resources.enabledModels || 0}/${resources.totalModels || 0}`],
    ['Client keys', `${resources.activeClientKeys || 0}/${resources.totalClientKeys || 0}`],
  ]
  return (
    <div className="g2a-dashboard-grid">
      <div className="g2a-overview-cards">
        {cards.map(([key, value]) => (
          <CCard className="g2a-stat-card" key={key}>
            <CCardBody>
              <small>{key}</small>
              <h4>{value}</h4>
            </CCardBody>
          </CCard>
        ))}
      </div>
      <div className="g2a-chart-card">
        <div className="g2a-chart-title">
          <div>
            <small>REQUEST TREND</small>
            <h3>Hoạt động 7 ngày</h3>
          </div>
          <CBadge color="light" textColor="dark">
            {usage.successfulRequests || 0} thành công · {usage.failedRequests || 0} lỗi
          </CBadge>
        </div>
        <div className="g2a-bar-chart">
          {series.map((item) => (
            <div className="g2a-bar-column" key={item.start}>
              <div className="g2a-bar-value">{item.requests}</div>
              <div className="g2a-bar-track">
                <span
                  style={{
                    height: `${Math.max(((item.requests || 0) / maxRequests) * 100, item.requests ? 8 : 2)}%`,
                  }}
                />
              </div>
              <small>
                {new Date(item.start).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function QuotaPanel({ rows }) {
  return (
    <div className="g2a-quota-grid">
      {rows.map((account) => {
        const quota = account.quota || {}
        const percent = Math.min(Math.max(quota.usagePercent || 0, 0), 100)
        return (
          <CCard className="g2a-quota-card" key={account.id}>
            <CCardBody>
              <div className="g2a-quota-head">
                <div>
                  <small>{account.provider}</small>
                  <h3>{account.name || account.email}</h3>
                  <span>{account.email}</span>
                </div>
                <CBadge color={account.authStatus === 'active' ? 'success' : 'warning'}>
                  {account.authStatus || 'unknown'}
                </CBadge>
              </div>
              <div className="g2a-quota-main">
                <div className="g2a-quota-ring" style={{ '--quota': `${percent * 3.6}deg` }}>
                  <div>
                    <strong>{quota.limitKnown ? `${quota.remaining}` : '∞'}</strong>
                    <small>còn lại</small>
                  </div>
                </div>
                <div className="g2a-quota-details">
                  <span>
                    Loại quota <b>{quota.type || 'unknown'}</b>
                  </span>
                  <span>
                    Đã dùng{' '}
                    <b>{quota.limitKnown ? `${quota.used}/${quota.limit}` : `${percent}%`}</b>
                  </span>
                  <span>
                    Chu kỳ{' '}
                    <b>
                      {quota.periodEnd
                        ? new Date(quota.periodEnd).toLocaleString('vi-VN')
                        : 'Không giới hạn'}
                    </b>
                  </span>
                </div>
              </div>
              {!!account.quotaWindows?.length && (
                <div className="g2a-window-list">
                  {account.quotaWindows.map((window) => (
                    <div key={window.mode}>
                      <span>{window.mode}</span>
                      <div>
                        <i style={{ width: `${100 - (window.usagePercent || 0)}%` }} />
                      </div>
                      <b>
                        {window.remaining}/{window.total}
                      </b>
                    </div>
                  ))}
                </div>
              )}
            </CCardBody>
          </CCard>
        )
      })}
    </div>
  )
}

export function EgressPanel({ rows, action, onTest, onToggle, onDelete }) {
  return (
    <div className="g2a-egress-grid">
      {rows.map((item) => (
        <CCard className="g2a-egress-card" key={item.id}>
          <CCardBody>
            <div className="g2a-egress-head">
              <span className={`g2a-node-icon ${item.probeStatus === 'healthy' ? 'healthy' : ''}`}>
                <FiGlobe />
              </span>
              <div>
                <h3>{item.name}</h3>
                <p>
                  {item.scope} · {item.exitIp || 'Chưa có exit IP'}
                </p>
              </div>
              <CBadge color={item.probeStatus === 'healthy' ? 'success' : 'secondary'}>
                {item.probeStatus || 'unknown'}
              </CBadge>
            </div>
            <div className="g2a-egress-stats">
              <span>
                Latency <b>{item.probeLatencyMs ? `${item.probeLatencyMs} ms` : '-'}</b>
              </span>
              <span>
                Health <b>{Math.round((item.health || 0) * 100)}%</b>
              </span>
              <span>
                Accounts{' '}
                <b>
                  {item.assignedAccountCount || 0}/{item.accountCapacity || 0}
                </b>
              </span>
            </div>
            <div className="g2a-egress-actions">
              <CButton size="sm" disabled={!!action} onClick={() => onTest(item)}>
                Probe
              </CButton>
              <CButton
                size="sm"
                color="secondary"
                disabled={!!action}
                onClick={() => onToggle(item)}
              >
                {item.enabled ? 'Disable' : 'Enable'}
              </CButton>
              <CButton
                size="sm"
                color="danger"
                variant="outline"
                disabled={!!action}
                onClick={() => onDelete(item)}
              >
                Delete
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      ))}
    </div>
  )
}

export function DataTable({ section, rows, action, onToggle, onDelete }) {
  return (
    <div className="g2a-table-wrap">
      <CTable hover responsive align="middle">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Tên / ID</CTableHeaderCell>
            <CTableHeaderCell>Provider / Type</CTableHeaderCell>
            <CTableHeaderCell>Capability</CTableHeaderCell>
            <CTableHeaderCell>Trạng thái</CTableHeaderCell>
            <CTableHeaderCell>Thao tác</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {rows.map((item, index) => {
            const id = item.id || index
            const enabled = item.enabled !== false && !item.disabled
            return (
              <CTableRow key={id}>
                <CTableDataCell>
                  <b>{item.name || item.publicId || item.filename || item.id}</b>
                  <div>
                    <small>{item.email || item.upstreamModel || item.createdAt || ''}</small>
                  </div>
                </CTableDataCell>
                <CTableDataCell>{item.provider || item.type || item.kind || '-'}</CTableDataCell>
                <CTableDataCell>{item.capability || item.scope || '-'}</CTableDataCell>
                <CTableDataCell>
                  <CBadge color={enabled ? 'success' : 'secondary'}>
                    {enabled ? 'Active' : 'Disabled'}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>
                  <div className="d-flex gap-2">
                    {['accounts', 'models', 'client-keys'].includes(section) && (
                      <CButton
                        size="sm"
                        color="secondary"
                        disabled={!!action}
                        onClick={() => onToggle(item)}
                      >
                        {enabled ? 'Disable' : 'Enable'}
                      </CButton>
                    )}
                    <CButton
                      size="sm"
                      color="danger"
                      variant="outline"
                      disabled={!!action}
                      onClick={() => onDelete(item)}
                    >
                      Delete
                    </CButton>
                  </div>
                </CTableDataCell>
              </CTableRow>
            )
          })}
          {!rows.length && (
            <CTableRow>
              <CTableDataCell colSpan={5} className="text-center py-5">
                Khong co du lieu.
              </CTableDataCell>
            </CTableRow>
          )}
        </CTableBody>
      </CTable>
    </div>
  )
}

export function JsonPanel({ data }) {
  return <pre className="gateway-log-view mb-0">{JSON.stringify(data, null, 2)}</pre>
}
