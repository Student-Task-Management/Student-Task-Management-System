<script setup lang="ts">
import { computed } from 'vue'
import { Target, CalendarCheck, CalendarDays, Timer, ChartPie } from '@lucide/vue'
import StatCard from '../components/StatCard.vue'
import { useTaskStore } from '../stores/tasks'
import { useSubjectStore } from '../stores/subjects'
import { dateKeyFromOffset, toDateKey } from '../utils/date'
import type { Priority } from '../types'

const store = useTaskStore()
const subjectStore = useSubjectStore()

const DAY = 86400000
const completedTasks = computed(() => store.tasks.filter((t) => t.status === 'Completed'))

function completedWithin(days: number): number {
  const since = Date.now() - days * DAY
  return completedTasks.value.filter((t) => new Date(t.completedAt ?? t.updatedAt).getTime() >= since).length
}

const completedWeek = computed(() => completedWithin(7))
const completedMonth = computed(() => completedWithin(30))

// Average time between creating a task and completing it
const avgDays = computed(() => {
  if (completedTasks.value.length === 0) return '-'
  const total = completedTasks.value.reduce(
    (sum, t) => sum + (new Date(t.completedAt ?? t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / DAY,
    0,
  )
  return (total / completedTasks.value.length).toFixed(1) + ' days'
})

// ---------- Productivity chart: completed tasks per day, last 14 days ----------
const daily = computed(() =>
  Array.from({ length: 14 }, (_, i) => {
    const offset = i - 13
    const key = dateKeyFromOffset(offset)
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return {
      day: d.getDate(),
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      count: completedTasks.value.filter((t) => toDateKey(new Date(t.completedAt ?? t.updatedAt)) === key).length,
    }
  }),
)
const dailyMax = computed(() => Math.max(1, ...daily.value.map((d) => d.count)))
const barHeight = (v: number) => (v === 0 ? '0%' : `${Math.max((v / dailyMax.value) * 100, 8)}%`)

// ---------- Tasks by subject ----------
const subjectStats = computed(() =>
  subjectStore.subjects
    .map((s) => ({ name: s.name, color: s.color, count: store.tasks.filter((t) => t.subjectId === s.id).length }))
    .filter((s) => s.count > 0),
)
const subjectTotal = computed(() => subjectStats.value.reduce((sum, s) => sum + s.count, 0))

const donut = computed(() => {
  if (subjectTotal.value === 0) return 'conic-gradient(#e2e8f0 0 100%)'
  let acc = 0
  const stops = subjectStats.value.map((s) => {
    const start = acc
    acc += (s.count / subjectTotal.value) * 100
    return `${s.color} ${start}% ${acc}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})

// ---------- Priority distribution ----------
const priorityBars: { name: Priority; bar: string }[] = [
  { name: 'High', bar: 'bg-rose-500' },
  { name: 'Medium', bar: 'bg-amber-500' },
  { name: 'Low', bar: 'bg-emerald-500' },
]
const priorityStats = computed(() =>
  priorityBars.map((p) => {
    const count = store.tasks.filter((t) => t.priority === p.name).length
    return {
      ...p,
      count,
      percent: store.total === 0 ? 0 : Math.round((count / store.total) * 100),
    }
  }),
)
</script>

<template>
  <div class="space-y-6">
    <!-- Key numbers -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key statistics">
      <StatCard label="Completion rate" :value="store.completionRate + '%'" :hint="`${store.completed} of ${store.total} tasks done`" :icon="Target" tone="indigo" />
      <StatCard label="Completed this week" :value="completedWeek" hint="Last 7 days" :icon="CalendarCheck" tone="emerald" />
      <StatCard label="Completed this month" :value="completedMonth" hint="Last 30 days" :icon="CalendarDays" tone="sky" />
      <StatCard label="Average completion" :value="avgDays" hint="From creation to done" :icon="Timer" tone="amber" />
    </section>

    <!-- Productivity chart -->
    <section class="card p-6">
      <h3 class="font-semibold">Productivity</h3>
      <p class="mb-5 text-sm text-muted">Tasks completed per day, last 14 days</p>
      <div class="flex items-end gap-1.5 sm:gap-3">
        <div
          v-for="d in daily"
          :key="d.label"
          tabindex="0"
          class="group relative flex flex-1 flex-col items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          :aria-label="`${d.label}: ${d.count} completed`"
        >
          <div class="pointer-events-none absolute -top-9 z-10 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs text-white shadow-lg group-hover:block group-focus:block">
            {{ d.label }}: {{ d.count }}
          </div>
          <div class="flex h-44 w-full items-end justify-center">
            <div class="w-full max-w-6 rounded-t-md bg-brand-600 transition-all duration-500" :style="{ height: barHeight(d.count) }"></div>
          </div>
          <span class="text-[11px] text-muted">{{ d.day }}</span>
        </div>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Subject distribution -->
      <section class="card p-6">
        <h3 class="font-semibold">Tasks by subject</h3>
        <p class="mb-5 text-sm text-muted">How your workload is spread</p>

        <div v-if="subjectTotal > 0" class="flex flex-col items-center gap-6 sm:flex-row">
          <div class="relative h-40 w-40 shrink-0 rounded-full" :style="{ background: donut }" role="img" :aria-label="`Tasks by subject, ${subjectTotal} tasks in total`">
            <div class="absolute inset-5 grid place-items-center rounded-full bg-white">
              <div class="text-center">
                <p class="text-2xl font-bold">{{ subjectTotal }}</p>
                <p class="text-xs text-muted">tasks</p>
              </div>
            </div>
          </div>
          <ul class="w-full space-y-2.5">
            <li v-for="s in subjectStats" :key="s.name" class="flex items-center justify-between gap-3 text-sm">
              <span class="flex min-w-0 items-center gap-2">
                <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: s.color }"></span>
                <span class="truncate">{{ s.name }}</span>
              </span>
              <span class="shrink-0 text-muted">{{ s.count }} ({{ Math.round((s.count / subjectTotal) * 100) }}%)</span>
            </li>
          </ul>
        </div>

        <div v-else class="py-10 text-center">
          <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ChartPie :size="24" /></span>
          <p class="mt-3 text-sm font-medium">No data yet</p>
          <p class="text-xs text-muted">Create tasks to see how they are spread across subjects.</p>
        </div>
      </section>

      <!-- Priority distribution -->
      <section class="card p-6">
        <h3 class="font-semibold">Priority distribution</h3>
        <p class="mb-5 text-sm text-muted">How urgent your tasks are</p>
        <ul class="space-y-5">
          <li v-for="p in priorityStats" :key="p.name">
            <div class="mb-1.5 flex justify-between text-sm">
              <span class="font-medium">{{ p.name }}</span>
              <span class="text-muted">{{ p.count }} task{{ p.count === 1 ? '' : 's' }} ({{ p.percent }}%)</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" :aria-valuenow="p.percent" aria-valuemin="0" aria-valuemax="100" :aria-label="`${p.name} priority`">
              <div :class="['h-full rounded-full transition-all duration-500', p.bar]" :style="{ width: p.percent + '%' }"></div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
