<script setup lang="ts">
import UserAvatar from './UserAvatar.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu, Search, Bell, Plus, User, LogOut } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import { useTaskStore } from '../stores/tasks'

defineEmits<{ openMenu: [] }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const tasksStore = useTaskStore()
const query = ref('')
const title = computed(() => String(route.meta.title ?? ''))

function search() {
  router.push({ path: '/app/tasks', query: { q: query.value } })
}

// ---------- Dropdowns ----------
const open = ref<'bell' | 'profile' | null>(null)
const root = ref<HTMLElement | null>(null)

function toggle(which: 'bell' | 'profile') {
  open.value = open.value === which ? null : which
}
function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = null
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = null
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})

// ---------- Notifications from the tasks you already have ----------
function daysUntil(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

const alerts = computed(() =>
  tasksStore.tasks
    .filter((t) => t.status !== 'Completed' && t.dueDate)
    .map((t) => ({ id: t.id, title: t.title, days: daysUntil(t.dueDate) }))
    .filter((t) => t.days <= 3)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6),
)

function label(days: number) {
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? '' : 's'}`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

function goTask(taskTitle: string) {
  open.value = null
  router.push({ path: '/app/tasks', query: { q: taskTitle } })
}

// ---------- Profile menu ----------
function goSettings() {
  open.value = null
  router.push('/app/settings')
}
async function logout() {
  open.value = null
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-20 bg-canvas/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
    <div class="flex items-center gap-3">
      <button class="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-white hover:text-ink lg:hidden" aria-label="Open menu" @click="$emit('openMenu')">
        <Menu :size="22" />
      </button>

      <div class="min-w-0">
        <p class="hidden text-xs text-muted sm:block">StudyFlow / {{ title }}</p>
        <h1 class="truncate text-xl font-bold tracking-tight">{{ title }}</h1>
      </div>

      <form class="ml-auto hidden max-w-xs flex-1 md:block" role="search" @submit.prevent="search">
        <label for="global-search" class="sr-only">Search tasks</label>
        <div class="relative">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="global-search"
            v-model="query"
            type="search"
            placeholder="Search tasks..."
            class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </form>

      <div ref="root" class="relative ml-auto flex items-center gap-2 md:ml-0">
        <button
          class="relative grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-white hover:text-ink"
          aria-label="Notifications"
          :aria-expanded="open === 'bell'"
          @click="toggle('bell')"
        >
          <Bell :size="20" />
          <span v-if="alerts.length" class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500"></span>
        </button>

        <div v-if="open === 'bell'" class="card absolute right-0 top-12 z-30 w-72 p-2 shadow-lg">
          <p class="px-3 py-2 text-sm font-semibold">Notifications</p>
          <p v-if="!alerts.length" class="px-3 pb-3 text-sm text-muted">You're all caught up.</p>
          <button
            v-for="a in alerts"
            :key="a.id"
            class="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"
            @click="goTask(a.title)"
          >
            <span class="block truncate text-sm font-medium">{{ a.title }}</span>
            <span class="block text-xs" :class="a.days < 0 ? 'text-rose-600' : 'text-muted'">{{ label(a.days) }}</span>
          </button>
        </div>

        <button
          class="hidden h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 transition hover:ring-2 hover:ring-brand-200 sm:grid"
          aria-label="Account menu"
          :aria-expanded="open === 'profile'"
          @click="toggle('profile')"
        >
          <UserAvatar size="h-full w-full" />
        </button>

        <div v-if="open === 'profile'" class="card absolute right-0 top-12 z-30 w-60 p-2 shadow-lg">
          <div class="px-3 py-2">
            <p class="truncate text-sm font-semibold">{{ auth.user?.name }}</p>
            <p class="truncate text-xs text-muted">{{ auth.user?.email }}</p>
          </div>
          <hr class="my-1 border-slate-100" />
          <button class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50" @click="goSettings">
            <User :size="16" /> Profile &amp; Settings
          </button>
          <button class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-slate-50" @click="logout">
            <LogOut :size="16" /> Log out
          </button>
        </div>

        <button class="btn-primary" @click="ui.openCreate()"><Plus :size="16" /><span class="hidden sm:inline">Create Task</span></button>
      </div>
    </div>
  </header>
</template>