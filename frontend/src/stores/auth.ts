import { defineStore } from 'pinia'
import { useSubjectStore } from './subjects'
import { useTaskStore } from './tasks'
import { computed, ref } from 'vue'
import { api, getErrorMessage, readSession, SESSION_KEY, type Session, type SessionUser } from '../services/api'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useAuthStore = defineStore('auth', () => {
  const saved = readSession()
  const user = ref<SessionUser>(saved?.user ?? { id: '', name: 'Guest', email: '' })
  const isLoggedIn = ref(saved !== null)

  const initials = computed(() =>
    user.value.name.split(' ').map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase(),
  )

  function startSession(session: Session, remember: boolean) {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(SESSION_KEY, JSON.stringify(session))
    user.value = session.user
    isLoggedIn.value = true
  }

  // Keep the saved login in sync when the profile changes
  function saveUser(updated: SessionUser) {
    const session = readSession()
    if (!session) return
    const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage
    storage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: updated }))
    user.value = updated
  }

  async function login(email: string, password: string, remember: boolean) {
    try {
      const { data } = await api.post('/auth/login', { email, password, remember })
      startSession({ token: data.data.token, user: data.data.user }, remember)
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      startSession({ token: data.data.token, user: data.data.user }, true)
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  // The API has no password-reset endpoint yet (it needs an email service),
  // so this only simulates sending the email.
  async function requestPasswordReset(_email: string) {
    await wait(700)
  }

  // Ask the server to confirm the saved login and refresh the name and email
  async function refresh() {
    try {
      const { data } = await api.get('/auth/me')
      saveUser(data.data.user)
    } catch {
      // A 401 is handled by the API client. Other errors can be ignored here.
    }
  }

  async function updateProfile(name: string, email: string) {
    try {
      const { data } = await api.put('/users/profile', { name, email })
      saveUser(data.data.user)
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      await api.put('/users/password', { currentPassword, newPassword })
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  function logout() {
    useTaskStore().reset()
    useSubjectStore().reset()
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    user.value = { id: '', name: 'Guest', email: '' }
    isLoggedIn.value = false
  }

  return {
    user, isLoggedIn, initials,
    login, register, requestPasswordReset, refresh, updateProfile, changePassword, logout,
  }
})
