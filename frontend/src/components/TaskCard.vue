<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2, CalendarDays } from '@lucide/vue'
import PriorityBadge from './PriorityBadge.vue'
import { useSubjectStore } from '../stores/subjects'
import { useTaskStore } from '../stores/tasks'
import { daysUntil, dueLabel } from '../utils/date'
import type { Status, Task } from '../types'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ edit: [task: Task]; remove: [task: Task] }>()

const subjects = useSubjectStore()
const tasks = useTaskStore()

const overdue = computed(() => props.task.status !== 'Completed' && daysUntil(props.task.dueDate) < 0)

function onDrag(e: DragEvent) {
  e.dataTransfer?.setData('text/plain', props.task.id)
}

function changeStatus(e: Event) {
  tasks.setStatus(props.task.id, (e.target as HTMLSelectElement).value as Status)
}
</script>

<template>
  <article
    draggable="true"
    class="cursor-grab rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md active:cursor-grabbing"
    @dragstart="onDrag"
  >
    <div class="flex items-start justify-between gap-2">
      <button class="text-left text-sm font-semibold hover:text-brand-700" @click="emit('edit', task)">
        {{ task.title }}
      </button>
      <PriorityBadge :priority="task.priority" />
    </div>

    <p class="mt-1 line-clamp-2 text-xs text-muted">{{ task.description }}</p>

    <p class="mt-3 flex items-center gap-1.5 text-xs text-muted">
      <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: subjects.colorOf(task.subject) }"></span>
      {{ task.subject }}
    </p>

    <div class="mt-3 flex items-center justify-between">
      <span :class="['flex items-center gap-1 text-xs font-medium', overdue ? 'text-rose-600' : 'text-muted']">
        <CalendarDays :size="14" />
        {{ task.status === 'Completed' ? task.dueDate : dueLabel(task.dueDate) }}
      </span>
      <div class="flex gap-1">
        <button class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Edit task" @click="emit('edit', task)">
          <Pencil :size="15" />
        </button>
        <button class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-600" aria-label="Delete task" @click="emit('remove', task)">
          <Trash2 :size="15" />
        </button>
      </div>
    </div>

    <label :for="`status-${task.id}`" class="sr-only">Change status</label>
    <select
      :id="`status-${task.id}`"
      :value="task.status"
      class="mt-3 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-500"
      @change="changeStatus"
    >
      <option>Pending</option>
      <option>In Progress</option>
      <option>Completed</option>
    </select>
  </article>
</template>
