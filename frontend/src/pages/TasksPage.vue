<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Search, List, Columns3, Check, Pencil, Trash2, ClipboardList, SearchX } from '@lucide/vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import StatusBadge from '../components/StatusBadge.vue'
import TaskCard from '../components/TaskCard.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useTaskStore } from '../stores/tasks'
import { useSubjectStore } from '../stores/subjects'
import { useUiStore } from '../stores/ui'
import { daysUntil, dueLabel } from '../utils/date'
import type { Priority, Status, Task } from '../types'

const route = useRoute()
const store = useTaskStore()
const subjectStore = useSubjectStore()
const ui = useUiStore()

// Filters (the top bar search sends ?q=... in the URL)
const search = ref(String(route.query.q ?? ''))
watch(() => route.query.q, (q) => { search.value = String(q ?? '') })
const statusFilter = ref<'All' | Status>('All')
const priorityFilter = ref<'All' | Priority>('All')
const subjectFilter = ref('All')
const sortBy = ref<'dueDate' | 'createdAt'>('dueDate')
const view = ref<'list' | 'kanban'>('list')

const columns: Status[] = ['Pending', 'In Progress', 'Completed']
const dragOver = ref<Status | null>(null)
const deleting = ref<Task | null>(null)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.tasks
    .filter((t) => !q || t.title.toLowerCase().includes(q))
    .filter((t) => statusFilter.value === 'All' || t.status === statusFilter.value)
    .filter((t) => priorityFilter.value === 'All' || t.priority === priorityFilter.value)
    .filter((t) => subjectFilter.value === 'All' || t.subjectId === subjectFilter.value)
    .sort((a, b) =>
      sortBy.value === 'dueDate'
        ? a.dueDate.localeCompare(b.dueDate)
        : b.createdAt.localeCompare(a.createdAt),
    )
})

const hasFilters = computed(
  () =>
    search.value !== '' ||
    statusFilter.value !== 'All' ||
    priorityFilter.value !== 'All' ||
    subjectFilter.value !== 'All',
)

function clearFilters() {
  search.value = ''
  statusFilter.value = 'All'
  priorityFilter.value = 'All'
  subjectFilter.value = 'All'
}

const byStatus = (s: Status) => filtered.value.filter((t) => t.status === s)
const isOverdue = (t: Task) => t.status !== 'Completed' && daysUntil(t.dueDate) < 0

function toggleDone(t: Task) {
  store.setStatus(t.id, t.status === 'Completed' ? 'Pending' : 'Completed')
}

function onDrop(e: DragEvent, status: Status) {
  const id = e.dataTransfer?.getData('text/plain')
  if (id) store.setStatus(id, status)
  dragOver.value = null
}

const deleteMessage = computed(() =>
  deleting.value ? `"${deleting.value.title}" will be permanently removed. This cannot be undone.` : '',
)

function confirmDelete() {
  if (!deleting.value) return
  store.deleteTask(deleting.value.id)
  
  deleting.value = null
}
</script>

<template>
  <div class="space-y-5">
    <!-- Toolbar -->
    <section class="card space-y-4 p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative flex-1">
          <label for="task-search" class="sr-only">Search tasks by title</label>
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input id="task-search" v-model="search" type="search" placeholder="Search tasks by title..." class="field pl-9" />
        </div>
        <div class="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Choose view">
          <button
            :class="['flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition', view === 'list' ? 'bg-white text-ink shadow-sm' : 'text-muted']"
            :aria-pressed="view === 'list'"
            @click="view = 'list'"
          >
            <List :size="16" /> List
          </button>
          <button
            :class="['flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition', view === 'kanban' ? 'bg-white text-ink shadow-sm' : 'text-muted']"
            :aria-pressed="view === 'kanban'"
            @click="view = 'kanban'"
          >
            <Columns3 :size="16" /> Kanban
          </button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label for="f-status" class="sr-only">Filter by status</label>
          <select id="f-status" v-model="statusFilter" class="field">
            <option value="All">All statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>
        <div>
          <label for="f-priority" class="sr-only">Filter by priority</label>
          <select id="f-priority" v-model="priorityFilter" class="field">
            <option value="All">All priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div>
          <label for="f-subject" class="sr-only">Filter by subject</label>
          <select id="f-subject" v-model="subjectFilter" class="field">
            <option value="All">All subjects</option>
            <option v-for="s in subjectStore.subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label for="f-sort" class="sr-only">Sort tasks</label>
          <select id="f-sort" v-model="sortBy" class="field">
            <option value="dueDate">Sort by deadline</option>
            <option value="createdAt">Sort by newest</option>
          </select>
        </div>
      </div>
    </section>

    <p class="px-1 text-sm text-muted">Showing {{ filtered.length }} of {{ store.tasks.length }} tasks</p>

    <!-- Empty state: no tasks at all -->
    <div v-if="store.tasks.length === 0" class="card py-16 text-center">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ClipboardList :size="28" /></span>
      <h2 class="mt-4 text-lg font-semibold">No tasks yet</h2>
      <p class="mt-1 text-sm text-muted">Create your first task to start planning your study time.</p>
      <button class="btn-primary mt-5" @click="ui.openCreate()"><Plus :size="16" /> Create Task</button>
    </div>

    <!-- Empty state: filters match nothing -->
    <div v-else-if="filtered.length === 0" class="card py-16 text-center">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-muted"><SearchX :size="28" /></span>
      <h2 class="mt-4 text-lg font-semibold">No matching tasks</h2>
      <p class="mt-1 text-sm text-muted">Try a different search or clear your filters.</p>
      <button v-if="hasFilters" class="btn-primary mt-5" @click="clearFilters">Clear filters</button>
    </div>

    <!-- List view -->
    <ul v-else-if="view === 'list'" class="card divide-y divide-slate-100 overflow-hidden">
      <li v-for="t in filtered" :key="t.id" class="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
        <button
          :class="[
            'grid h-8 w-8 shrink-0 place-items-center rounded-full border transition',
            t.status === 'Completed'
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-200 text-slate-400 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600',
          ]"
          :aria-label="t.status === 'Completed' ? 'Mark as not completed' : 'Mark as completed'"
          @click="toggleDone(t)"
        >
          <Check :size="16" />
        </button>

        <div class="min-w-0 flex-1">
          <button
            :class="['block max-w-full truncate text-left text-sm font-semibold hover:text-brand-700', t.status === 'Completed' ? 'text-muted line-through' : '']"
            @click="ui.openEdit(t)"
          >
            {{ t.title }}
          </button>
          <p class="truncate text-xs text-muted">{{ t.description }}</p>
          <p class="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: subjectStore.colorOf(t.subjectId) }"></span>
            {{ subjectStore.nameOf(t.subjectId) }}
          </p>
        </div>

        <div class="hidden items-center gap-2 md:flex">
          <PriorityBadge :priority="t.priority" />
          <StatusBadge :status="t.status" />
        </div>

        <div class="hidden w-28 shrink-0 text-right sm:block">
          <p class="text-xs font-medium">{{ t.dueDate }}</p>
          <p :class="['text-xs', isOverdue(t) ? 'font-medium text-rose-600' : 'text-muted']">
            {{ t.status === 'Completed' ? 'Done' : dueLabel(t.dueDate) }}
          </p>
        </div>

        <div class="flex shrink-0 gap-1">
          <button class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Edit task" title="Edit task" @click="ui.openEdit(t)">
            <Pencil :size="16" />
          </button>
          <button class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-600" aria-label="Delete task" title="Delete task" @click="deleting = t">
            <Trash2 :size="16" />
          </button>
        </div>
      </li>
    </ul>

    <!-- Kanban view -->
    <div v-else class="grid gap-4 md:grid-cols-3">
      <section
        v-for="col in columns"
        :key="col"
        :class="[
          'rounded-2xl border border-dashed p-3 transition',
          dragOver === col ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200 bg-slate-50/60',
        ]"
        @dragover.prevent="dragOver = col"
        @dragleave="dragOver = null"
        @drop.prevent="onDrop($event, col)"
      >
        <header class="mb-3 flex items-center justify-between px-1">
          <h3 class="text-sm font-semibold">{{ col }}</h3>
          <span class="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted">{{ byStatus(col).length }}</span>
        </header>
        <div class="space-y-3">
          <TaskCard v-for="t in byStatus(col)" :key="t.id" :task="t" @edit="ui.openEdit" @remove="deleting = $event" />
          <p v-if="!byStatus(col).length" class="py-6 text-center text-xs text-muted">Drop tasks here</p>
        </div>
      </section>
    </div>

    <ConfirmDialog
      :open="!!deleting"
      title="Delete this task?"
      :message="deleteMessage"
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="deleting = null"
    />
  </div>
</template>
