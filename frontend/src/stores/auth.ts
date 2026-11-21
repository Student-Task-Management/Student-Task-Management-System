import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const KEY = 'studyflow_session'

interface User {
  name: string
  email: string
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

// "john.smith@school.com" becomes "John Smith"
function nameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export const useAuthStore = defineStore('auth', () => {
  // Mock authentication. Phase 4 replaces this with real API calls and a JWT.
  const saved = loadSession()
  const user = ref<User>(saved ?? { name: 'Guest', email: '' })
  const isLoggedIn = ref(saved !== null)

  const initials = computed(() =>
    user.value.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
  )

  function startSession(u: User, remember: boolean) {
    user.value = u
    isLoggedIn.value = true
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(KEY, JSON.stringify(u))
  }

  async function login(email: string, _password: string, remember: boolean) {
    await wait(700) // fake network delay
    startSession({ name: nameFromEmail(email) || 'Student', email }, remember)
  }

  async function register(name: string, email: string, _password: string) {
    await wait(700)
    startSession({ name, email }, true)
  }

  async function requestPasswordReset(_email: string) {
    await wait(700)
  }

  async function updateProfile(name: string, email: string) {
    await wait(500)
    user.value = { name, email }
    // keep the saved session in sync, in whichever storage it lives
    const storage = localStorage.getItem(KEY) ? localStorage : sessionStorage
    storage.setItem(KEY, JSON.stringify(user.value))
  }

  async function changePassword(_current: string, _next: string) {
    await wait(700) // Phase 4: the backend checks the current password
  }

  function logout() {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
    user.value = { name: 'Guest', email: '' }
    isLoggedIn.value = false
  }

  return {
    user, isLoggedIn, initials,
    login, register, requestPasswordReset, updateProfile, changePassword, logout,
  }
})
