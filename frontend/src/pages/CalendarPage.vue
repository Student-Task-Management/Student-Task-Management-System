<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight, Plus, Pencil, CalendarDays } from '@lucide/vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useTaskStore } from '../stores/tasks'
import { useSubjectStore } from '../stores/subjects'
import { useUiStore } from '../stores/ui'
import { toDateKey } from '../utils/date'
import type { Priority, Task } from '../types'

const store = useTaskStore()
const subjects = useSubjectStore()
const ui = useUiStore()

const todayKey = toDateKey(new Date())
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const selected = ref(todayKey)

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const dotColor: Record<Priority, string> = {
  High: 'bg-rose-500',
  Medium: 'bg-amber-500',
  Low: 'bg-emerald-500',
}
const chipColor: Record<Priority, string> = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-emerald-50 text-emerald-700',
}

const monthTitle = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
)

// Group tasks by due date so each calendar cell can look them up quickly
const tasksByDate = computed(() => {
  const map: Record<string, Task[]> = {}
  for (const t of store.tasks) {
    if (!map[t.dueDate]) map[t.dueDate] = []
    map[t.dueDate].push(t)
  }
  return map
})

// 6 weeks x 7 days = 42 cells, starting on the Sunday before the 1st of the month
const days = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const start = new Date(viewYear.value, viewMonth.value, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const key = toDateKey(d)
    return {
      key,
      day: d.getDate(),
      inMonth: d.getMonth() === viewMonth.value,
      tasks: tasksByDate.value[key] ?? [],
      label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    }
  })
})

const selectedTasks = computed(() => tasksByDate.value[selected.value] ?? [])

const selectedLabel = computed(() => {
  const [y, m, d] = selected.value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

function shiftMonth(n: number) {
  const d = new Date(viewYear.value, viewMonth.value + n, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function goToday() {
  const now = new Date()
  viewYear.value = now.getFullYear()
  viewMonth.value = now.getMonth()
  selected.value = todayKey
}

function selectDay(day: { key: string; inMonth: boolean }) {
  selected.value = day.key
  if (!day.inMonth) {
    const [y, m] = day.key.split('-').map(Number)
    viewYear.value = y
    viewMonth.value = m - 1
  }
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Calendar grid -->
    <section class="card p-4 sm:p-6 lg:col-span-2">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">{{ monthTitle }}</h2>
        <div class="flex items-center gap-1.5">
          <button class="btn-ghost border border-slate-200 bg-white !px-3 !py-1.5" @click="goToday">Today</button>
          <button class="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-muted transition hover:text-ink" aria-label="Previous month" @click="shiftMonth(-1)">
            <ChevronLeft :size="18" />
          </button>
          <button class="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-muted transition hover:text-ink" aria-label="Next month" @click="shiftMonth(1)">
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-medium text-muted">
        <span v-for="w in weekdays" :key="w">{{ w }}</span>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="d in days"
          :key="d.key"
          type="button"
          :aria-label="`${d.label}, ${d.tasks.length} task${d.tasks.length === 1 ? '' : 's'}`"
          :aria-pressed="selected === d.key"
          :aria-current="d.key === todayKey ? 'date' : undefined"
          :class="[
            'flex min-h-16 flex-col items-stretch rounded-xl border p-1.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500 sm:min-h-24 sm:p-2',
            selected === d.key ? 'border-brand-500 bg-brand-50/60' : 'border-transparent hover:bg-slate-50',
            d.inMonth ? '' : 'opacity-40',
          ]"
          @click="selectDay(d)"
        >
          <span
            :class="[
              'grid h-6 w-6 place-items-center rounded-full text-xs font-medium',
              d.key === todayKey ? 'bg-brand-600 text-white' : 'text-ink',
            ]"
          >
            {{ d.day }}
          </span>

          <!-- Small screens: dots only -->
          <span v-if="d.tasks.length" class="mt-1.5 flex flex-wrap gap-1 sm:hidden">
            <span v-for="t in d.tasks.slice(0, 4)" :key="t.id" :class="['h-1.5 w-1.5 rounded-full', dotColor[t.priority]]"></span>
          </span>

          <!-- Larger screens: up to 2 task chips -->
          <span v-if="d.tasks.length" class="mt-1 hidden space-y-1 sm:block">
            <span
              v-for="t in d.tasks.slice(0, 2)"
              :key="t.id"
              :class="['block truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium', chipColor[t.priority], t.status === 'Completed' ? 'line-through opacity-60' : '']"
            >
              {{ t.title }}
            </span>
            <span v-if="d.tasks.length > 2" class="block px-1 text-[11px] text-muted">+{{ d.tasks.length - 2 }} more</span>
          </span>
        </button>
      </div>

      <div class="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-muted">
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-rose-500"></span>High</span>
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-amber-500"></span>Medium</span>
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Low</span>
      </div>
    </section>

    <!-- Selected day -->
    <section class="card h-fit p-6">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold">{{ selectedLabel }}</h3>
          <p class="text-sm text-muted">{{ selectedTasks.length }} task{{ selectedTasks.length === 1 ? '' : 's' }}</p>
        </div>
        <button class="btn-primary !px-3.5 !py-2" @click="ui.openCreate(selected)">
          <Plus :size="16" /> Add task
        </button>
      </div>

      <ul v-if="selectedTasks.length" class="mt-4 divide-y divide-slate-100">
        <li v-for="t in selectedTasks" :key="t.id" class="flex items-start gap-3 py-3">
          <div class="min-w-0 flex-1">
            <p :class="['text-sm font-medium', t.status === 'Completed' ? 'text-muted line-through' : '']">{{ t.title }}</p>
            <p class="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: subjects.colorOf(t.subject) }"></span>
              {{ t.subject }}
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <PriorityBadge :priority="t.priority" />
              <StatusBadge :status="t.status" />
            </div>
          </div>
          <button class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Edit task" title="Edit task" @click="ui.openEdit(t)">
            <Pencil :size="16" />
          </button>
        </li>
      </ul>

      <div v-else class="py-10 text-center">
        <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><CalendarDays :size="24" /></span>
        <p class="mt-3 text-sm font-medium">No tasks on this day</p>
        <p class="text-xs text-muted">Use "Add task" to plan something for this date.</p>
      </div>
    </section>
  </div>
</template>
