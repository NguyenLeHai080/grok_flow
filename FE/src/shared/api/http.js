import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  withCredentials: true,
})

let refreshRequest = null

function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${http.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        sessionStorage.setItem('access_token', data.access_token)
        return data.access_token
      })
      .finally(() => {
        refreshRequest = null
      })
  }
  return refreshRequest
}

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config
    const shouldRefresh =
      error.response?.status === 401 &&
      !request?._retried &&
      !request?.url?.includes('/auth/refresh')

    if (shouldRefresh) {
      request._retried = true
      try {
        const accessToken = await refreshAccessToken()
        request.headers.Authorization = `Bearer ${accessToken}`
        return http(request)
      } catch {
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('user')
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default http
