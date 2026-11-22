<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Users, ListChecks, BookOpen, LogOut, ShieldCheck } from '@lucide/vue'
import AppLogo from '../components/AppLogo.vue'
import ToastHost from '../components/ToastHost.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const links = [
  { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
]

// Confirm the role with the server when the area opens and on every page change
onMounted(() => auth.refresh())
watch(() => route.fullPath, () => auth.refresh())

// If the role was removed, leave the admin area right away
watch(
  () => auth.isAdmin,
  (isAdmin) => {
    if (!isAdmin && auth.isLoggedIn) router.replace('/app/overview')
  },
)

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-30 border-b border-slate-100 bg-canvas/80 backdrop-blur">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <AppLogo />
          <span class="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            <ShieldCheck :size="14" /> Admin
          </span>
        </div>

        <nav class="order-last -mx-1 flex w-full gap-1 overflow-x-auto px-1 sm:order-none sm:mx-0 sm:w-auto sm:px-0" aria-label="Admin navigation">
          <RouterLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-50 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            active-class="!bg-brand-50 !text-brand-700"
          >
            <component :is="l.icon" :size="18" />
            {{ l.label }}
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-3">
          <div class="hidden text-right sm:block">
            <p class="text-sm font-semibold leading-tight">{{ auth.user.name }}</p>
            <p class="text-xs text-muted">{{ auth.user.email }}</p>
          </div>
          <button
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            @click="logout"
          >
            <LogOut :size="18" /> <span class="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <ToastHost />
  </div>
</template>
