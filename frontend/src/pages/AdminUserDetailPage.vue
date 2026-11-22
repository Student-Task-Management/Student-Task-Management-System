<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ListChecks, Ban, UserCheck, ClipboardList, CircleCheck, Clock, TriangleAlert } from '@lucide/vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import StatusBadge from '../components/StatusBadge.vue'
import StatCard from '../components/StatCard.vue'
import { api, getErrorMessage } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import type { RecentTask, Role, Totals } from '../types/admin'
import { toDateKey } from '../utils/date'

interface Detail {
  user: { id: string; name: string; email: string; role: Role; disabled: boolean; createdAt: string }
  totals: Totals
  subjects: { id: string; name: string; color: string; description: string; taskCount: number; completedCount: number }[]
  recentTasks: RecentTask[]
}

const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const detail = ref<Detail | null>(null)
const loading = ref(true)
const error = ref('')
const busy = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  detail.value = null
  try {
    const { data } = await api.get(`/admin/users/${route.params.id}`, { params: { today: toDateKey(new Date()) } })
    detail.value = data.data
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)

const isSelf = computed(() => detail.value?.user.id === auth.user.id)

async function toggleDisabled() {
  const d = detail.value
  if (!d) return
  busy.value = true
  try {
    await api.patch(`/admin/users/${d.user.id}/status`, { disabled: !d.user.disabled })
    d.user.disabled = !d.user.disabled
    ui.toast(d.user.disabled ? 'Account disabled' : 'Account enabled')
  } catch (e) {
    ui.toast(getErrorMessage(e), 'error')
  } finally {
    busy.value = false
  }
}

const percent = (done: number, total: number) => (total === 0 ? 0 : Math.round((done / total) * 100))
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const initials = (name: string) =>
  name.split(' ').map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase()
</script>

<template>
  <div class="space-y-6">
    <RouterLink to="/admin/users" class="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
      <ArrowLeft :size="16" /> Back to users
    </RouterLink>

    <div v-if="error" class="card p-10 text-center" role="alert">
      <p class="font-medium">Could not load this user</p>
      <p class="mt-1 text-sm text-muted">{{ error }}</p>
      <button class="btn-primary mt-4" @click="load">Try again</button>
    </div>

    <div v-else-if="loading || !detail" class="space-y-6" aria-busy="true">
      <div class="skeleton h-32"></div>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="n in 4" :key="n" class="skeleton h-32"></div>
      </div>
      <div class="skeleton h-64"></div>
    </div>

    <template v-else>
      <!-- Profile -->
      <section class="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <span class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
          {{ initials(detail.user.name) }}
        </span>
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-xl font-bold tracking-tight">{{ detail.user.name }}</h1>
          <p class="truncate text-sm text-muted">{{ detail.user.email }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span class="rounded-full bg-brand-100 px-2.5 py-0.5 font-medium text-brand-700">{{ detail.user.role === 'admin' ? 'Admin' : 'Student' }}</span>
            <span :class="['rounded-full px-2.5 py-0.5 font-medium', detail.user.disabled ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700']">
              {{ detail.user.disabled ? 'Disabled' : 'Active' }}
            </span>
            <span v-if="isSelf" class="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">You</span>
            <span class="text-muted">Joined {{ formatDate(detail.user.createdAt) }}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink :to="{ path: '/admin/tasks', query: { userId: detail.user.id } }" class="btn-ghost border border-slate-200 bg-white">
            <ListChecks :size="16" /> View all tasks
          </RouterLink>
          <button v-if="detail.user.role !== 'admin'" class="btn-ghost border border-slate-200 bg-white disabled:opacity-60" :disabled="busy" @click="toggleDisabled">
            <UserCheck v-if="detail.user.disabled" :size="16" />
            <Ban v-else :size="16" />
            {{ detail.user.disabled ? 'Enable account' : 'Disable account' }}
          </button>
        </div>
      </section>

      <!-- Totals -->
      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Task totals">
        <StatCard label="Total tasks" :value="detail.totals.total" hint="Created by this user" :icon="ClipboardList" tone="indigo" />
        <StatCard label="Completed" :value="detail.totals.completed" :hint="`${percent(detail.totals.completed, detail.totals.total)}% completion rate`" :icon="CircleCheck" tone="emerald" />
        <StatCard label="Pending" :value="detail.totals.pending + detail.totals.inProgress" :hint="`${detail.totals.inProgress} in progress`" :icon="Clock" tone="amber" />
        <StatCard label="Overdue" :value="detail.totals.overdue" hint="Past due and not completed" :icon="TriangleAlert" tone="rose" />
      </section>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Subjects -->
        <section class="card p-6">
          <h2 class="font-semibold">Subjects</h2>
          <p class="mb-4 text-sm text-muted">Progress per subject</p>
          <ul v-if="detail.subjects.length" class="space-y-4">
            <li v-for="s in detail.subjects" :key="s.id">
              <div class="mb-1.5 flex justify-between text-sm">
                <span class="flex items-center gap-2 font-medium">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: s.color }"></span>{{ s.name }}
                </span>
                <span class="text-muted">{{ s.completedCount }} / {{ s.taskCount }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full transition-all duration-500" :style="{ width: percent(s.completedCount, s.taskCount) + '%', backgroundColor: s.color }"></div>
              </div>
            </li>
          </ul>
          <p v-else class="py-8 text-center text-sm text-muted">No subjects.</p>
        </section>

        <!-- Recent activity -->
        <section class="card p-6 lg:col-span-2">
          <h2 class="font-semibold">Recent activity</h2>
          <p class="mb-2 text-sm text-muted">The ten most recently updated tasks</p>
          <ul v-if="detail.recentTasks.length" class="divide-y divide-slate-100">
            <li v-for="t in detail.recentTasks" :key="t.id" class="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              <div class="min-w-0 flex-1">
                <p :class="['truncate text-sm font-medium', t.status === 'Completed' ? 'text-muted line-through' : '']">{{ t.title }}</p>
                <p class="flex items-center gap-1.5 text-xs text-muted">
                  <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: t.subject?.color ?? '#94a3b8' }"></span>
                  {{ t.subject?.name ?? 'Unknown subject' }} · due {{ t.dueDate }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span v-if="t.overdue" class="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">Overdue</span>
                <PriorityBadge :priority="t.priority" />
                <StatusBadge :status="t.status" />
              </div>
            </li>
          </ul>
          <p v-else class="py-10 text-center text-sm text-muted">This user has no tasks yet.</p>
        </section>
      </div>
    </template>
  </div>
</template>
