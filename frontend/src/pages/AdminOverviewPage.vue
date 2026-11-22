<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Users, ClipboardList, CircleCheck, Clock, TriangleAlert, BookOpen, RefreshCw } from '@lucide/vue'
import StatCard from '../components/StatCard.vue'
import BarChart from '../components/BarChart.vue'
import DonutChart from '../components/DonutChart.vue'
import { api, getErrorMessage } from '../services/api'
import type { AdminStats } from '../types/admin'
import { toDateKey } from '../utils/date'

const stats = ref<AdminStats | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/admin/stats', { params: { today: toDateKey(new Date()) } })
    stats.value = data.data
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const labels = computed(() => stats.value?.activity.map((d) => d.label) ?? [])
const taskSeries = computed(() => [
  { name: 'Created', color: '#a5b4fc', values: stats.value?.activity.map((d) => d.tasksCreated) ?? [] },
  { name: 'Completed', color: '#4f46e5', values: stats.value?.activity.map((d) => d.tasksCompleted) ?? [] },
])
const signupSeries = computed(() => [
  { name: 'New students', color: '#0ea5e9', values: stats.value?.activity.map((d) => d.signups) ?? [] },
])

const statusItems = computed(() => {
  const t = stats.value?.tasks
  return [
    { label: 'Completed', value: t?.completed ?? 0, color: '#10b981' },
    { label: 'In progress', value: t?.inProgress ?? 0, color: '#0ea5e9' },
    { label: 'Pending', value: t?.pending ?? 0, color: '#f59e0b' },
  ]
})

const priorityRows = computed(() => {
  const p: Record<string, number> = stats.value?.priorities ?? {}
  const total = (p.High ?? 0) + (p.Medium ?? 0) + (p.Low ?? 0)
  return [
    { name: 'High', count: p.High ?? 0, bar: 'bg-rose-500' },
    { name: 'Medium', count: p.Medium ?? 0, bar: 'bg-amber-500' },
    { name: 'Low', count: p.Low ?? 0, bar: 'bg-emerald-500' },
  ].map((r) => ({ ...r, percent: total === 0 ? 0 : Math.round((r.count / total) * 100) }))
})

const topMax = computed(() => Math.max(1, ...(stats.value?.topSubjects.map((s) => s.count) ?? [])))

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const initials = (name: string) =>
  name.split(' ').map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase()
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold tracking-tight">Admin overview</h1>
        <p class="text-sm text-muted">Platform activity at a glance.</p>
      </div>
      <button class="btn-ghost border border-slate-200 bg-white" :disabled="loading" @click="load">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" /> Refresh
      </button>
    </div>

    <div v-if="error" class="card p-8 text-center" role="alert">
      <p class="font-medium">Could not load the statistics</p>
      <p class="mt-1 text-sm text-muted">{{ error }}</p>
      <button class="btn-primary mt-4" @click="load">Try again</button>
    </div>

    <template v-else>
      <!-- Loading skeleton -->
      <div v-if="!stats" class="space-y-6" aria-busy="true" aria-label="Loading statistics">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div v-for="n in 6" :key="n" class="skeleton h-32"></div>
        </div>
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="skeleton h-72 lg:col-span-2"></div>
          <div class="skeleton h-72"></div>
        </div>
      </div>

      <template v-else>
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Platform statistics">
          <StatCard label="Students" :value="stats.students.total" :hint="`${stats.students.active} active, ${stats.students.disabled} disabled`" :icon="Users" tone="indigo" />
          <StatCard label="Total tasks" :value="stats.tasks.total" :hint="`${stats.students.newThisWeek} new students this week`" :icon="ClipboardList" tone="sky" />
          <StatCard label="Completed" :value="stats.tasks.completed" :hint="`${stats.tasks.completionRate}% completion rate`" :icon="CircleCheck" tone="emerald" />
          <StatCard label="Pending" :value="stats.tasks.pending + stats.tasks.inProgress" :hint="`${stats.tasks.inProgress} in progress`" :icon="Clock" tone="amber" />
          <StatCard label="Overdue" :value="stats.tasks.overdue" hint="Past due and not completed" :icon="TriangleAlert" tone="rose" />
          <StatCard label="Subjects" :value="stats.subjects.catalog" :hint="`${stats.subjects.total} copies held by students`" :icon="BookOpen" tone="indigo" />
        </section>

        <div class="grid gap-6 lg:grid-cols-3">
          <section class="card p-6 lg:col-span-2">
            <h2 class="font-semibold">Task activity</h2>
            <p class="mb-4 text-sm text-muted">Tasks created and completed, last 14 days</p>
            <BarChart :labels="labels" :series="taskSeries" />
          </section>

          <section class="card p-6">
            <h2 class="font-semibold">Task status</h2>
            <p class="mb-4 text-sm text-muted">All students combined</p>
            <DonutChart :items="statusItems" center-label="tasks" />
            <RouterLink
              :to="{ path: '/admin/tasks', query: { overdue: 'true' } }"
              class="mt-5 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              <span>{{ stats.tasks.overdue }} overdue task{{ stats.tasks.overdue === 1 ? '' : 's' }}</span>
              <span>View</span>
            </RouterLink>
          </section>
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
          <section class="card p-6">
            <h2 class="font-semibold">New students</h2>
            <p class="mb-4 text-sm text-muted">Sign-ups, last 14 days</p>
            <BarChart :labels="labels" :series="signupSeries" />
          </section>

          <section class="card p-6">
            <h2 class="font-semibold">Priority distribution</h2>
            <p class="mb-5 text-sm text-muted">How urgent the tasks are</p>
            <ul class="space-y-5">
              <li v-for="p in priorityRows" :key="p.name">
                <div class="mb-1.5 flex justify-between text-sm">
                  <span class="font-medium">{{ p.name }}</span>
                  <span class="text-muted">{{ p.count }} ({{ p.percent }}%)</span>
                </div>
                <div class="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" :aria-valuenow="p.percent" aria-valuemin="0" aria-valuemax="100" :aria-label="`${p.name} priority`">
                  <div :class="['h-full rounded-full transition-all duration-500', p.bar]" :style="{ width: p.percent + '%' }"></div>
                </div>
              </li>
            </ul>
          </section>

          <section class="card p-6">
            <h2 class="font-semibold">Top subjects</h2>
            <p class="mb-5 text-sm text-muted">Most used across all students</p>
            <ul v-if="stats.topSubjects.length" class="space-y-4">
              <li v-for="s in stats.topSubjects" :key="s.name">
                <div class="mb-1.5 flex justify-between text-sm">
                  <span class="flex items-center gap-2 font-medium">
                    <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: s.color }"></span>{{ s.name }}
                  </span>
                  <span class="text-muted">{{ s.count }} task{{ s.count === 1 ? '' : 's' }}</span>
                </div>
                <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div class="h-full rounded-full transition-all duration-500" :style="{ width: Math.round((s.count / topMax) * 100) + '%', backgroundColor: s.color }"></div>
                </div>
              </li>
            </ul>
            <p v-else class="py-8 text-center text-sm text-muted">No tasks yet.</p>
          </section>
        </div>

        <section class="card p-6">
          <div class="mb-2 flex items-center justify-between">
            <div>
              <h2 class="font-semibold">Recent registrations</h2>
              <p class="text-sm text-muted">The five newest students</p>
            </div>
            <RouterLink to="/admin/users" class="text-sm font-medium text-brand-600 hover:text-brand-700">View all users</RouterLink>
          </div>

          <ul v-if="stats.recentUsers.length" class="divide-y divide-slate-100">
            <li v-for="u in stats.recentUsers" :key="u.id">
              <RouterLink :to="`/admin/users/${u.id}`" class="flex items-center gap-3 rounded-xl py-3 transition hover:bg-slate-50">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{{ initials(u.name) }}</span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ u.name }}</p>
                  <p class="truncate text-xs text-muted">{{ u.email }}</p>
                </div>
                <span v-if="u.disabled" class="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">Disabled</span>
                <span class="hidden text-xs text-muted sm:block">{{ formatDate(u.createdAt) }}</span>
              </RouterLink>
            </li>
          </ul>
          <p v-else class="py-10 text-center text-sm text-muted">No students have signed up yet.</p>
        </section>
      </template>
    </template>
  </div>
</template>
