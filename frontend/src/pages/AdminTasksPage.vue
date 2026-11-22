<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Trash2, ListChecks, SearchX, ChevronLeft, ChevronRight } from '@lucide/vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api, getErrorMessage } from '../services/api'
import { useUiStore } from '../stores/ui'
import type { Priority, Status } from '../types'
import type { AdminTask, Totals } from '../types/admin'
import { toDateKey } from '../utils/date'

type Quick = 'all' | Status | 'overdue'

const PAGE_SIZE = 20
const route = useRoute()
const ui = useUiStore()

// Links from other pages can open this page already filtered (?userId=...&overdue=true)
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const pick = <T extends string>(v: unknown, allowed: readonly T[]): '' | T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : ''

const filters = reactive({
  q: str(route.query.q),
  userId: str(route.query.userId),
  subject: str(route.query.subject),
  priority: pick(route.query.priority, ['Low', 'Medium', 'High'] as const) as '' | Priority,
  status: pick(route.query.status, ['Pending', 'In Progress', 'Completed'] as const) as '' | Status,
  overdue: route.query.overdue === 'true',
  sort: 'dueDate' as 'dueDate' | 'createdAt',
})
const page = ref(1)

const tasks = ref<AdminTask[]>([])
const pagination = ref({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 })
const summary = ref<Totals>({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 })
const subjectNames = ref<string[]>([])
const students = ref<{ id: string; name: string; email: string }[]>([])
const loading = ref(true)
const loaded = ref(false)
const error = ref('')
const deleting = ref<AdminTask | null>(null)

let requestId = 0
async function load() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/admin/tasks', {
      params: {
        q: filters.q.trim(),
        userId: filters.userId,
        subject: filters.subject,
        priority: filters.priority,
        status: filters.status,
        overdue: filters.overdue ? 'true' : '',
        sort: filters.sort,
        page: page.value,
        limit: PAGE_SIZE,
        today: toDateKey(new Date()),
      },
    })
    if (id !== requestId) return
    tasks.value = data.data.tasks
    pagination.value = data.data.pagination
    summary.value = data.data.summary
    subjectNames.value = data.data.subjectNames
    loaded.value = true
  } catch (e) {
    if (id === requestId) error.value = getErrorMessage(e)
  } finally {
    if (id === requestId) loading.value = false
  }
}

async function loadStudents() {
  try {
    const { data } = await api.get('/admin/users', { params: { role: 'user' } })
    students.value = data.data.users
  } catch {
    // The student filter simply stays empty. The task list shows its own errors.
  }
}

onMounted(() => {
  void loadStudents()
  void load()
})

// A changed filter goes back to page 1 and reloads 300 ms later
let timer: ReturnType<typeof setTimeout>
watch(filters, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    void load()
  }, 300)
})

function goToPage(p: number) {
  page.value = p
  void load()
}

function clearFilters() {
  filters.q = ''
  filters.userId = ''
  filters.subject = ''
  filters.priority = ''
  filters.status = ''
  filters.overdue = false
}

const hasFilters = computed(
  () => !!(filters.q || filters.userId || filters.subject || filters.priority || filters.status || filters.overdue),
)

// Summary tiles double as quick filters
const activeQuick = computed<Quick>(() => (filters.overdue ? 'overdue' : filters.status || 'all'))
function quick(k: Quick) {
  filters.overdue = k === 'overdue'
  filters.status = k === 'all' || k === 'overdue' ? '' : k
}
const tiles = computed<{ key: Quick; label: string; value: number }[]>(() => [
  { key: 'all', label: 'All tasks', value: summary.value.total },
  { key: 'Pending', label: 'Pending', value: summary.value.pending },
  { key: 'In Progress', label: 'In progress', value: summary.value.inProgress },
  { key: 'Completed', label: 'Completed', value: summary.value.completed },
  { key: 'overdue', label: 'Overdue', value: summary.value.overdue },
])

const rangeText = computed(() => {
  const p = pagination.value
  if (p.total === 0) return 'No tasks'
  const start = (p.page - 1) * p.limit + 1
  const end = Math.min(p.page * p.limit, p.total)
  return `Showing ${start}-${end} of ${p.total}`
})

// ---------- Delete ----------
const deleteMessage = computed(() => {
  const t = deleting.value
  if (!t) return ''
  return `"${t.title}"${t.user ? ` (${t.user.name})` : ''} will be permanently deleted. This cannot be undone.`
})

async function confirmDelete() {
  const t = deleting.value
  if (!t) return
  deleting.value = null
  try {
    await api.delete(`/admin/tasks/${t.id}`)
    ui.toast('Task deleted')
    // If that was the last task on the page, go back one page
    if (tasks.value.length === 1 && page.value > 1) page.value -= 1
    await load()
  } catch (e) {
    ui.toast(getErrorMessage(e), 'error')
  }
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-bold tracking-tight">Tasks</h1>
      <p class="text-sm text-muted">Every task created by students, with filters.</p>
    </div>

    <!-- Summary tiles (click to filter) -->
    <section class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Task summary">
      <button
        v-for="t in tiles"
        :key="t.key"
        type="button"
        :aria-pressed="activeQuick === t.key"
        :class="[
          'card p-4 text-left outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-500',
          activeQuick === t.key ? '!border-brand-500 bg-brand-50' : '',
        ]"
        @click="quick(t.key)"
      >
        <p :class="['text-xs font-medium', t.key === 'overdue' ? 'text-rose-600' : 'text-muted']">{{ t.label }}</p>
        <p class="mt-1 text-2xl font-bold tracking-tight">{{ t.value }}</p>
      </button>
    </section>

    <!-- Filters -->
    <section class="card space-y-3 p-4" aria-label="Filters">
      <div class="relative">
        <label for="task-search" class="sr-only">Search tasks by title</label>
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input id="task-search" v-model="filters.q" type="search" placeholder="Search tasks by title..." class="field pl-9" />
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div>
          <label for="f-student" class="sr-only">Filter by student</label>
          <select id="f-student" v-model="filters.userId" class="field">
            <option value="">All students</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label for="f-subject" class="sr-only">Filter by subject</label>
          <select id="f-subject" v-model="filters.subject" class="field">
            <option value="">All subjects</option>
            <option v-for="n in subjectNames" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div>
          <label for="f-priority" class="sr-only">Filter by priority</label>
          <select id="f-priority" v-model="filters.priority" class="field">
            <option value="">All priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div>
          <label for="f-status" class="sr-only">Filter by status</label>
          <select id="f-status" v-model="filters.status" class="field">
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>
        <div>
          <label for="f-sort" class="sr-only">Sort tasks</label>
          <select id="f-sort" v-model="filters.sort" class="field">
            <option value="dueDate">Sort by deadline</option>
            <option value="createdAt">Sort by newest</option>
          </select>
        </div>
        <button
          type="button"
          :aria-pressed="filters.overdue"
          :class="[
            'rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500',
            filters.overdue ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-muted hover:text-ink',
          ]"
          @click="filters.overdue = !filters.overdue"
        >
          Overdue only
        </button>
      </div>
    </section>

    <div v-if="error" class="card p-8 text-center" role="alert">
      <p class="font-medium">Could not load tasks</p>
      <p class="mt-1 text-sm text-muted">{{ error }}</p>
      <button class="btn-primary mt-4" @click="load">Try again</button>
    </div>

    <div v-else-if="!loaded" class="card space-y-3 p-5" aria-busy="true">
      <div v-for="n in 6" :key="n" class="skeleton h-12"></div>
    </div>

    <template v-else>
      <p class="px-1 text-sm text-muted">{{ rangeText }}</p>

      <div v-if="tasks.length === 0" class="card py-16 text-center">
        <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-muted">
          <SearchX v-if="hasFilters" :size="28" />
          <ListChecks v-else :size="28" />
        </span>
        <h2 class="mt-4 text-lg font-semibold">{{ hasFilters ? 'No matching tasks' : 'No tasks yet' }}</h2>
        <p class="mt-1 text-sm text-muted">{{ hasFilters ? 'Try different filters.' : 'Tasks appear here after students create them.' }}</p>
        <button v-if="hasFilters" class="btn-primary mt-5" @click="clearFilters">Clear filters</button>
      </div>

      <div v-else :class="['card overflow-x-auto transition', loading ? 'opacity-60' : '']">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="border-b border-slate-100 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" class="px-5 py-3 font-medium">Task</th>
              <th scope="col" class="hidden px-5 py-3 font-medium md:table-cell">Student</th>
              <th scope="col" class="hidden px-5 py-3 font-medium lg:table-cell">Subject</th>
              <th scope="col" class="px-5 py-3 font-medium">Priority</th>
              <th scope="col" class="px-5 py-3 font-medium">Status</th>
              <th scope="col" class="px-5 py-3 font-medium">Due</th>
              <th scope="col" class="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="t in tasks" :key="t.id" class="transition hover:bg-slate-50">
              <td class="max-w-xs px-5 py-3">
                <p :class="['truncate font-medium', t.status === 'Completed' ? 'text-muted line-through' : '']">{{ t.title }}</p>
                <p class="truncate text-xs text-muted">{{ t.description || 'No description' }}</p>
                <p class="mt-0.5 truncate text-xs text-muted md:hidden">{{ t.user?.name ?? 'Deleted user' }} · {{ t.subject?.name ?? 'No subject' }}</p>
              </td>
              <td class="hidden px-5 py-3 md:table-cell">
                <RouterLink v-if="t.user" :to="`/admin/users/${t.user.id}`" class="font-medium hover:text-brand-700">{{ t.user.name }}</RouterLink>
                <span v-else class="text-muted">Deleted user</span>
                <p v-if="t.user" class="text-xs text-muted">{{ t.user.email }}</p>
              </td>
              <td class="hidden px-5 py-3 lg:table-cell">
                <span class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: t.subject?.color ?? '#94a3b8' }"></span>
                  {{ t.subject?.name ?? 'Unknown' }}
                </span>
              </td>
              <td class="px-5 py-3"><PriorityBadge :priority="t.priority" /></td>
              <td class="px-5 py-3"><StatusBadge :status="t.status" /></td>
              <td class="whitespace-nowrap px-5 py-3">
                <p class="text-xs font-medium">{{ t.dueDate }}</p>
                <span v-if="t.overdue" class="mt-0.5 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">Overdue</span>
              </td>
              <td class="px-5 py-3">
                <div class="flex justify-end">
                  <button
                    class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-600"
                    :aria-label="`Delete ${t.title}`"
                    title="Delete task"
                    @click="deleting = t"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="pagination.pages > 1" class="flex items-center justify-between gap-3" aria-label="Pagination">
        <button class="btn-ghost border border-slate-200 bg-white disabled:opacity-50" :disabled="pagination.page <= 1 || loading" @click="goToPage(pagination.page - 1)">
          <ChevronLeft :size="16" /> Previous
        </button>
        <span class="text-sm text-muted">Page {{ pagination.page }} of {{ pagination.pages }}</span>
        <button class="btn-ghost border border-slate-200 bg-white disabled:opacity-50" :disabled="pagination.page >= pagination.pages || loading" @click="goToPage(pagination.page + 1)">
          Next <ChevronRight :size="16" />
        </button>
      </nav>
    </template>

    <ConfirmDialog
      :open="!!deleting"
      title="Delete this task?"
      :message="deleteMessage"
      confirm-text="Delete task"
      @confirm="confirmDelete"
      @cancel="deleting = null"
    />
  </div>
</template>
