import axios, { type AxiosError } from 'axios'

export const SESSION_KEY = 'studyflow_session'

export interface SessionUser {
  id: string
  role?: 'user' | 'admin'
  name: string
  email: string
}

export interface Session {
  token: string
  user: SessionUser
}

// The login is kept in localStorage ("Remember me") or sessionStorage (until the tab closes)
export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token && parsed?.user ? (parsed as Session) : null
  } catch {
    return null
  }
}

export const api = axios.create({ baseURL: '/api', timeout: 15000 })

// Send the token with every request
api.interceptors.request.use((config) => {
  const session = readSession()
  if (session) config.headers.Authorization = `Bearer ${session.token}`
  return config
})

// If the server rejects the token, the login has expired: clear it and go to the login page
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? ''
    const isAuthForm = url.startsWith('/auth/login') || url.startsWith('/auth/register')

    if (error.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login?expired=1')
    }
    return Promise.reject(error)
  },
)

// Turns any API error into a short message that is safe to show to the user
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Cannot reach the server. Please check your connection and try again.'

    const data = error.response.data as { message?: string; errors?: { message: string }[] } | string | undefined
    if (data && typeof data === 'object') {
      if (data.errors?.length) return data.errors.map((e) => e.message).join(' ')
      if (data.message) return data.message
    }
    if (error.response.status >= 500) return 'The server is not responding. Please try again in a moment.'
  }
  return 'Something went wrong. Please try again.'
}
