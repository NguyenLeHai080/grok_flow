import { useCallback, useEffect, useState } from 'react'
import http from '../api/http'

export default function useResource(endpoint) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadIndex, setReloadIndex] = useState(0)

  const reload = useCallback(() => {
    setLoading(true)
    setReloadIndex((current) => current + 1)
  }, [])

  useEffect(() => {
    let active = true

    http
      .get(endpoint)
      .then(({ data }) => {
        if (!active) return
        setItems(data)
        setError('')
      })
      .catch((requestError) => {
        if (!active) return
        setError(
          requestError.response?.data?.detail ||
            'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c d\u1eef li\u1ec7u',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [endpoint, reloadIndex])

  return { items, loading, error, load: reload }
}
