import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const KEY = 'studyflow_settings'

export type Theme = 'light' | 'dark' | 'system'

export interface NotificationPrefs {
  deadlineReminders: boolean
  weeklySummary: boolean
  emailUpdates: boolean
}

const defaults: NotificationPrefs = {
  deadlineReminders: true,
  weeklySummary: true,
  emailUpdates: false,
}

function load(): { theme?: Theme; notifications?: Partial<NotificationPrefs> } {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const saved = load()
  const theme = ref<Theme>(saved.theme ?? 'light')
  const notifications = ref<NotificationPrefs>({ ...defaults, ...saved.notifications })

  const media = window.matchMedia('(prefers-color-scheme: dark)')

  function applyTheme() {
    const dark = theme.value === 'dark' || (theme.value === 'system' && media.matches)
    document.documentElement.classList.toggle('dark', dark)
  }

  watch(
    [theme, notifications],
    () => {
      applyTheme()
      try {
        localStorage.setItem(KEY, JSON.stringify({ theme: theme.value, notifications: notifications.value }))
      } catch {
        // storage can be unavailable (private mode); the settings still work for this session
      }
    },
    { deep: true },
  )

  media.addEventListener('change', applyTheme)
  applyTheme()

  return { theme, notifications }
})
