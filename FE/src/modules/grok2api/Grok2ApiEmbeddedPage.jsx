import { useRef, useState } from 'react'
import { FiExternalLink, FiRefreshCw } from 'react-icons/fi'
import './grok2api-embedded.scss'

const runtimeBase = import.meta.env.VITE_GROK2API_CONSOLE_URL || 'http://127.0.0.1:8002'

const copy = {
  description:
    'Giao di\u1ec7n Grok2API \u0111\u01b0\u1ee3c t\u00edch h\u1ee3p tr\u1ef1c ti\u1ebfp trong h\u1ec7 th\u1ed1ng qu\u1ea3n tr\u1ecb Groks.',
  reload: 'T\u1ea3i l\u1ea1i',
  open: 'M\u1edf ri\u00eang',
  loading: '\u0110ang t\u1ea3i Grok2API...',
}

export default function Grok2ApiEmbeddedPage({ path = '/dashboard', title = 'Grok2API' }) {
  const frame = useRef(null)
  const [loading, setLoading] = useState(true)
  const url = `${runtimeBase}${path}`

  const reload = () => {
    setLoading(true)
    frame.current.src = url
  }

  return (
    <div className="g2a-embedded-page">
      <header className="g2a-embedded-header">
        <div>
          <span>INTERNAL GROK2API</span>
          <h1>{title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="g2a-embedded-actions">
          <button type="button" onClick={reload}>
            <FiRefreshCw /> {copy.reload}
          </button>
          <a href={url} target="_blank" rel="noreferrer">
            <FiExternalLink /> {copy.open}
          </a>
        </div>
      </header>
      <div className="g2a-frame-shell">
        {loading && (
          <div className="g2a-frame-loading">
            <span />
            <b>{copy.loading}</b>
          </div>
        )}
        <iframe ref={frame} src={url} title={title} onLoad={() => setLoading(false)} />
      </div>
    </div>
  )
}
