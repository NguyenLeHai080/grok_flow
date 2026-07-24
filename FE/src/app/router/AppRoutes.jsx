import { Navigate, Route, Routes } from 'react-router-dom'
import ApiKeysPage from '../../modules/apiKeys/ApiKeysPage'
import LoginPage from '../../modules/auth/LoginPage'
import DashboardPage from '../../modules/dashboard/DashboardPage'
import Grok2ApiEmbeddedPage from '../../modules/grok2api/Grok2ApiEmbeddedPage'
import Grok2ApiPage from '../../modules/grok2api/Grok2ApiPage'
import JobsPage from '../../modules/jobs/JobsPage'
import LogsPage from '../../modules/logs/LogsPage'
import ProxiesPage from '../../modules/proxies/ProxiesPage'
import ReferencePage from '../../modules/reference/ReferencePage'
import SettingsPage from '../../modules/settings/SettingsPage'
import ProtectedRoute from './ProtectedRoute'

const embeddedRoutes = [
  { path: 'grok2api/dashboard', source: '/dashboard', title: 'T\u1ed5ng quan' },
  { path: 'grok2api/accounts', source: '/accounts', title: 'T\u00e0i kho\u1ea3n' },
  { path: 'grok2api/client-keys', source: '/client-keys', title: 'Client Keys' },
  { path: 'grok2api/models', source: '/models', title: 'Models' },
  { path: 'grok2api/gallery', source: '/gallery', title: 'Th\u01b0 vi\u1ec7n \u1ea3nh' },
  { path: 'grok2api/video-gallery', source: '/video-gallery', title: 'Th\u01b0 vi\u1ec7n video' },
  { path: 'grok2api/request-audits', source: '/request-audits', title: 'Request Audit' },
  { path: 'grok2api/creative-console', source: '/creative-console', title: 'Creative Console' },
  { path: 'grok2api/egress', source: '/settings', title: 'Egress Nodes' },
  { path: 'grok2api/settings', source: '/settings', title: 'C\u1ea5u h\u00ecnh' },
  { path: 'grok2api/docs/chat', source: '/docs/chat/completions', title: 'Chat API' },
  { path: 'grok2api/docs/image', source: '/docs/image/generations', title: 'Image API' },
  { path: 'grok2api/docs/video', source: '/docs/video/generations', title: 'Video API' },
]

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="proxies" element={<ProxiesPage />} />
        <Route path="grok2api" element={<Navigate to="/grok2api/dashboard" replace />} />
        <Route path="grok2api/quota" element={<Grok2ApiPage section="quota" />} />
        {embeddedRoutes.map(({ path, source, title }) => (
          <Route
            key={path}
            path={path}
            element={<Grok2ApiEmbeddedPage path={source} title={title} />}
          />
        ))}
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="reference" element={<ReferencePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
