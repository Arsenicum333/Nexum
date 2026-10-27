const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1'
const TOKEN_KEY = 'nexum:access-token'

function getToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)
}

function getPayload(payload) {
  return payload?.data ?? payload
}

async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...options.headers
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.errors?.[0]?.message || payload?.message || 'Request failed'
    throw new Error(message)
  }

  return getPayload(payload)
}

function saveSession(session) {
  localStorage.setItem(TOKEN_KEY, session.token)
  return session.user
}

export const authApi = {
  async register(data) {
    const session = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return saveSession(session)
  },

  async login(data) {
    const session = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return saveSession(session)
  },

  async profile() {
    return request('/account/profile')
  },

  async logout() {
    try {
      if (getToken()) await request('/account/logout', { method: 'POST' })
    } finally {
      localStorage.removeItem(TOKEN_KEY)
    }
  },

  hasSession() {
    return Boolean(getToken())
  }
}
