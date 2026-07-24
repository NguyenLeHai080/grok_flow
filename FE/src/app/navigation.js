import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiBox,
  FiCpu,
  FiDatabase,
  FiFileText,
  FiFilm,
  FiGlobe,
  FiImage,
  FiKey,
  FiSettings,
  FiShield,
  FiZap,
} from 'react-icons/fi'

export const primaryNavigation = [
  { path: '/', icon: FiActivity, label: 'Dashboard', end: true },
  { path: '/jobs', icon: FiBox, label: 'Jobs' },
  { path: '/proxies', icon: FiShield, label: 'ProxyAPI' },
]

export const grok2apiNavigation = [
  { path: '/grok2api/dashboard', icon: FiBarChart2, label: 'T\u1ed5ng quan' },
  { path: '/grok2api/accounts', icon: FiDatabase, label: 'T\u00e0i kho\u1ea3n' },
  { path: '/grok2api/quota', icon: FiActivity, label: 'Quota & Billing' },
  { path: '/grok2api/client-keys', icon: FiKey, label: 'Client Keys' },
  { path: '/grok2api/models', icon: FiZap, label: 'Models' },
  { path: '/grok2api/gallery', icon: FiImage, label: 'Th\u01b0 vi\u1ec7n \u1ea3nh' },
  { path: '/grok2api/video-gallery', icon: FiFilm, label: 'Th\u01b0 vi\u1ec7n video' },
  { path: '/grok2api/request-audits', icon: FiFileText, label: 'Request Audit' },
  { path: '/grok2api/creative-console', icon: FiCpu, label: 'Creative Console' },
  { path: '/grok2api/egress', icon: FiGlobe, label: 'Egress Nodes' },
  { path: '/grok2api/settings', icon: FiSettings, label: 'C\u1ea5u h\u00ecnh' },
]

export const grok2apiDocsNavigation = [
  { path: '/grok2api/docs/chat', icon: FiBookOpen, label: 'Chat API' },
  { path: '/grok2api/docs/image', icon: FiImage, label: 'Image API' },
  { path: '/grok2api/docs/video', icon: FiFilm, label: 'Video API' },
]

export const secondaryNavigation = [
  { path: '/api-keys', icon: FiKey, label: 'API Keys' },
  { path: '/logs', icon: FiFileText, label: 'Logs l\u1ed7i' },
  { path: '/reference', icon: FiBookOpen, label: 'API Reference' },
  { path: '/settings', icon: FiSettings, label: 'Settings' },
]
