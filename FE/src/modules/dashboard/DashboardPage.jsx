import { CCard, CCardBody, CCol, CProgress, CRow } from '@coreui/react'
import { FiBox, FiCheckCircle, FiKey, FiShield } from 'react-icons/fi'
import PageHeader from '../../shared/components/PageHeader'
import useResource from '../../shared/hooks/useResource'

export default function DashboardPage() {
  const jobs = useResource('/jobs'),
    proxies = useResource('/proxies'),
    keys = useResource('/api-keys')
  const successful = jobs.items.filter((job) => job.status === 'success').length
  const stats = [
    [FiBox, 'Tổng Jobs', jobs.items.length, 'primary'],
    [FiCheckCircle, 'Hoàn thành', successful, 'success'],
    [FiShield, 'Proxy hoạt động', proxies.items.filter((item) => item.is_active).length, 'info'],
    [FiKey, 'API Keys', keys.items.filter((item) => !item.revoked_at).length, 'warning'],
  ]
  return (
    <>
      <PageHeader title="Dashboard" description="Tổng quan hoạt động hệ thống và tài nguyên API." />
      <CRow className="g-4">
        {stats.map(([Icon, label, value, color]) => (
          <CCol md={6} xl={3} key={label}>
            <CCard className="stat-card">
              <CCardBody>
                <span className={`stat-icon bg-${color}`}>
                  <Icon />
                </span>
                <div>
                  <p>{label}</p>
                  <h2>{value}</h2>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>
      <CRow className="g-4 mt-1">
        <CCol lg={8}>
          <CCard className="panel-card">
            <CCardBody>
              <div className="panel-title">
                <div>
                  <h3>Job Performance</h3>
                  <p>Phân bố trạng thái xử lý hiện tại</p>
                </div>
                <b>{jobs.items.length} jobs</b>
              </div>
              {['success', 'running', 'pending', 'failed'].map((status) => {
                const count = jobs.items.filter((item) => item.status === status).length
                return (
                  <div className="metric" key={status}>
                    <div>
                      <span>{status}</span>
                      <b>{count}</b>
                    </div>
                    <CProgress
                      color={
                        status === 'failed'
                          ? 'danger'
                          : status === 'success'
                            ? 'success'
                            : 'primary'
                      }
                      value={jobs.items.length ? (count / jobs.items.length) * 100 : 0}
                    />
                  </div>
                )
              })}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CCard className="panel-card gateway">
            <CCardBody>
              <FiShield />
              <h3>CLIProxyAPI Gateway</h3>
              <p>Quản lý nhiều provider qua OpenAI-compatible API.</p>
              <div className="gateway-status">
                <span />
                <b>{proxies.items.filter((item) => item.is_active).length} endpoint đang bật</b>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}
