<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu, Search, Bell, Plus } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'

defineEmits<{ openMenu: [] }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const query = ref('')
const title = computed(() => String(route.meta.title ?? ''))

function search() {
  router.push({ path: '/app/tasks', query: { q: query.value } })
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

      <div class="ml-auto flex items-center gap-2 md:ml-0">
        <button class="relative grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-white hover:text-ink" aria-label="Notifications">
          <Bell :size="20" />
          <span class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500"></span>
        </button>
        <span class="hidden h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 sm:grid">
          {{ auth.initials }}
        </span>
        <RouterLink to="/app/tasks" class="btn-primary">
          <Plus :size="16" /><span class="hidden sm:inline">Create Task</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
