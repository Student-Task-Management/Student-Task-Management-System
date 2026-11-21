<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  LayoutDashboard, ListChecks, CalendarDays, BookOpen, ChartColumn,
  Settings, LogOut, PanelLeftClose, PanelLeftOpen, X,
} from '@lucide/vue'
import AppLogo from './AppLogo.vue'
import { useAuthStore } from '../stores/auth'

defineProps<{ collapsed: boolean; mobileOpen: boolean }>()
const emit = defineEmits<{ toggle: []; close: [] }>()

const auth = useAuthStore()
const router = useRouter()

const links = [
  { to: '/app/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/tasks', label: 'My Tasks', icon: ListChecks },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/app/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-100 bg-white transition-all duration-300',
      collapsed ? 'lg:w-20' : 'lg:w-64',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
    aria-label="Sidebar"
  >
    <div class="flex h-16 items-center justify-between px-4">
      <AppLogo :collapsed="collapsed" />
      <button class="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100 lg:hidden" aria-label="Close menu" @click="emit('close')">
        <X :size="18" />
      </button>
    </div>

    <nav class="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
      <RouterLink
        v-for="item in links"
        :key="item.to"
        :to="item.to"
        :title="item.label"
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-slate-50 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        active-class="!bg-brand-50 !text-brand-700"
        @click="emit('close')"
      >
        <component :is="item.icon" :size="20" class="shrink-0" />
        <span :class="collapsed ? 'lg:hidden' : ''">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <button
      class="mx-3 mb-2 hidden items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-slate-50 hover:text-ink lg:flex"
      :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="emit('toggle')"
    >
      <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" :size="20" class="shrink-0" />
      <span :class="collapsed ? 'lg:hidden' : ''">Collapse</span>
    </button>

    <div class="border-t border-slate-100 p-3">
      <div :class="['flex items-center gap-3 rounded-xl p-2', collapsed ? 'lg:flex-col' : '']">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {{ auth.initials }}
        </span>
        <div :class="['min-w-0 flex-1', collapsed ? 'lg:hidden' : '']">
          <p class="truncate text-sm font-semibold">{{ auth.user.name }}</p>
          <p class="truncate text-xs text-muted">{{ auth.user.email }}</p>
        </div>
        <button class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-600" aria-label="Log out" title="Log out" @click="logout">
          <LogOut :size="18" />
        </button>
      </div>
    </div>
  </aside>
</template>
