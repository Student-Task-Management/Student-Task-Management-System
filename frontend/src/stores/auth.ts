import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Mock user. Phase 4 replaces this with the real logged-in user.
  const user = ref({ name: 'Alex Student', email: 'alex@student.com' })

  const initials = computed(() =>
    user.value.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
  )

  function logout() {
    // Real logout (clear token) comes in Phase 4
  }

  return { user, initials, logout }
})
