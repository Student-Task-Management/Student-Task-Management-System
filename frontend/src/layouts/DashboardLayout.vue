<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import AppTopbar from '../components/AppTopbar.vue'
import TaskFormPanel from '../components/TaskFormPanel.vue'
import ToastHost from '../components/ToastHost.vue'
import { useAuthStore } from '../stores/auth'
import { useSubjectStore } from '../stores/subjects'
import { useTaskStore } from '../stores/tasks'

const auth = useAuthStore()
const tasks = useTaskStore()
const subjects = useSubjectStore()

const collapsed = ref(false)
const mobileOpen = ref(false)

// Pages are shown only after the first load, so they never flash empty
const ready = computed(() => tasks.loaded && subjects.loaded)
const error = computed(() => (ready.value ? '' : tasks.error || subjects.error))

function loadData() {
  void tasks.load()
  void subjects.load()
}

onMounted(() => {
  void auth.refresh() // confirm the saved login with the server
  loadData()
})
</script>

<template>
  <div class="min-h-screen">
    <AppSidebar
      :collapsed="collapsed"
      :mobile-open="mobileOpen"
      @toggle="collapsed = !collapsed"
      @close="mobileOpen = false"
    />
    <div v-if="mobileOpen" class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" @click="mobileOpen = false"></div>

    <div :class="['transition-all duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-64']">
      <AppTopbar @open-menu="mobileOpen = true" />
      <main class="px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <!-- Could not load -->
        <div v-if="error" class="card mx-auto max-w-md p-10 text-center" role="alert">
          <h2 class="font-semibold">Could not load your data</h2>
          <p class="mt-1 text-sm text-muted">{{ error }}</p>
          <button class="btn-primary mt-5" @click="loadData">Try again</button>
        </div>

        <!-- Loading skeleton -->
        <div v-else-if="!ready" class="space-y-6" aria-busy="true" aria-label="Loading your data">
          <div class="skeleton h-28"></div>
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="n in 4" :key="n" class="skeleton h-32"></div>
          </div>
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="skeleton h-72 lg:col-span-2"></div>
            <div class="skeleton h-72"></div>
          </div>
        </div>

        <RouterView v-else v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <!-- Shared by every dashboard page -->
    <TaskFormPanel />
    <ToastHost />
  </div>
</template>
