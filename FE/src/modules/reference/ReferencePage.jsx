import { CCard, CCardBody } from '@coreui/react'
import PageHeader from '../../shared/components/PageHeader'

const endpoints = [
  ['POST', '/auth/login', 'Đăng nhập và cấp token'],
  ['GET', '/jobs', 'Danh sách lịch sử jobs'],
  ['POST', '/jobs/{id}/retry', 'Tạo job retry'],
  ['GET', '/proxies', 'Danh sách CLIProxyAPI'],
  ['POST', '/api-keys', 'Tạo uxpm_live key'],
  ['GET', '/logs', 'Danh sách lỗi hệ thống'],
  ['GET', '/users', 'Quản lý tài khoản (admin)'],
]
export default function ReferencePage() {
  return (
    <>
      <PageHeader
        title="API Reference"
        description="Tóm tắt REST API. Swagger tương tác có tại backend /docs."
      />
      <CCard className="reference-card">
        <CCardBody>
          <h3>Authentication</h3>
          <pre>{`Authorization: Bearer <access_token>\nContent-Type: application/json`}</pre>
          <h3>Endpoints</h3>
          {endpoints.map(([method, path, description]) => (
            <div className="endpoint" key={path + method}>
              <span className={`method ${method.toLowerCase()}`}>{method}</span>
              <code>{path}</code>
              <p>{description}</p>
            </div>
          ))}
        </CCardBody>
      </CCard>
    </>
  )
}
