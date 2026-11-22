<script setup lang="ts">
import { ClipboardList, Clock, LoaderCircle, CircleCheck, Check, Pencil, Plus } from '@lucide/vue'
import StatCard from '../components/StatCard.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import StatusBadge from '../components/StatusBadge.vue'
import WeeklyChart from '../components/WeeklyChart.vue'
import { useAuthStore } from '../stores/auth'
import { useTaskStore } from '../stores/tasks'
import { useUiStore } from '../stores/ui'
import { useSubjectStore } from '../stores/subjects'
import { daysUntil, dueLabel, timeAgo } from '../utils/date'

const auth = useAuthStore()
const store = useTaskStore()
const ui = useUiStore()
const subjects = useSubjectStore()

const hour = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
const todayText = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
})
const firstName = auth.user.name.split(' ')[0]
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome -->
    <section class="card flex flex-col gap-4 bg-gradient-to-r from-brand-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-muted">{{ todayText }}</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight">{{ greeting }}, {{ firstName }}!</h2>
        <p class="mt-1 text-sm text-muted">Small steps every day add up. Let's make today count.</p>
      </div>
      <button class="btn-primary self-start sm:self-auto" @click="ui.openCreate()"><Plus :size="16" /> Create Task</button>
    </section>

    <!-- Stats -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistics">
      <StatCard label="Total Tasks" :value="store.total" hint="All your assignments" :icon="ClipboardList" tone="indigo" />
      <StatCard label="Pending" :value="store.pending" hint="Waiting to be started" :icon="Clock" tone="amber" />
      <StatCard label="In Progress" :value="store.inProgress" hint="Currently working on" :icon="LoaderCircle" tone="sky" />
      <StatCard label="Completed" :value="store.completed" :hint="`${store.completionRate}% completion rate`" :icon="CircleCheck" tone="emerald" />
    </section>

    <!-- Chart + Upcoming -->
    <div class="grid gap-6 lg:grid-cols-3">
      <section class="card p-6 lg:col-span-2">
        <h3 class="font-semibold">Weekly productivity</h3>
        <p class="mb-4 text-sm text-muted">Completed vs pending tasks by due date, last 7 days</p>
        <WeeklyChart :data="store.weekly" />
      </section>

      <section class="card p-6">
        <h3 class="font-semibold">Upcoming deadlines</h3>
        <p class="mb-2 text-sm text-muted">Next tasks that need attention</p>
        <ul v-if="store.upcoming.length" class="divide-y divide-slate-100">
          <li v-for="t in store.upcoming" :key="t.id" class="flex items-center justify-between gap-3 py-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ t.title }}</p>
              <p class="text-xs text-muted">{{ subjects.nameOf(t.subjectId) }}</p>
            </div>
            <span
              :class="[
                'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                daysUntil(t.dueDate) <= 1 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600',
              ]"
            >
              {{ dueLabel(t.dueDate) }}
            </span>
          </li>
        </ul>
        <p v-else class="py-8 text-center text-sm text-muted">No upcoming deadlines.</p>
      </section>
    </div>

    <!-- Today + Activity -->
    <div class="grid gap-6 lg:grid-cols-3">
      <section class="card p-6 lg:col-span-2">
        <h3 class="font-semibold">Today's tasks</h3>
        <p class="mb-2 text-sm text-muted">Tasks due today</p>

        <ul v-if="store.todayTasks.length" class="divide-y divide-slate-100">
          <li v-for="t in store.todayTasks" :key="t.id" class="flex items-center gap-3 py-3">
            <button
              v-if="t.status !== 'Completed'"
              class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-400 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
              aria-label="Mark as completed"
              title="Mark as completed"
              @click="store.completeTask(t.id)"
            >
              <Check :size="16" />
            </button>
            <span v-else class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
              <Check :size="16" />
            </span>

            <div class="min-w-0 flex-1">
              <p :class="['truncate text-sm font-medium', t.status === 'Completed' ? 'text-muted line-through' : '']">{{ t.title }}</p>
              <p class="text-xs text-muted">{{ subjects.nameOf(t.subjectId) }}</p>
            </div>

            <div class="hidden items-center gap-2 sm:flex">
              <PriorityBadge :priority="t.priority" />
              <StatusBadge :status="t.status" />
            </div>

            <button class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Edit task" title="Edit task" @click="ui.openEdit(t)"><Pencil :size="16" /></button>
          </li>
        </ul>

        <div v-else class="py-10 text-center">
          <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><CircleCheck :size="24" /></span>
          <p class="mt-3 text-sm font-medium">Nothing due today</p>
          <p class="text-xs text-muted">Enjoy the free time or plan ahead.</p>
          <button class="btn-primary mt-4" @click="ui.openCreate()"><Plus :size="16" /> Create Task</button>
        </div>
      </section>

      <section class="card p-6">
        <h3 class="font-semibold">Recent activity</h3>
        <p class="mb-2 text-sm text-muted">Latest updates</p>
        <ul class="divide-y divide-slate-100">
          <li v-for="t in store.recentActivity" :key="t.id" class="flex items-start gap-3 py-3">
            <span :class="['mt-1.5 h-2 w-2 shrink-0 rounded-full', t.status === 'Completed' ? 'bg-emerald-500' : 'bg-brand-500']"></span>
            <div class="min-w-0">
              <p class="truncate text-sm">
                <span class="font-medium">{{ t.status === 'Completed' ? 'Completed' : 'Updated' }}</span> {{ t.title }}
              </p>
              <p class="text-xs text-muted">{{ timeAgo(t.updatedAt) }}</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
