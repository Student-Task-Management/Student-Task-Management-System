<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { X, LoaderCircle } from '@lucide/vue'
import { useUiStore } from '../stores/ui'
import { useTaskStore } from '../stores/tasks'
import { useSubjectStore } from '../stores/subjects'
import type { Priority, Status } from '../types'
import { dateKeyFromOffset } from '../utils/date'

const ui = useUiStore()
const tasks = useTaskStore()
const subjectStore = useSubjectStore()

const form = reactive({
  title: '',
  description: '',
  subject: '',
  priority: 'Medium' as Priority,
  status: 'Pending' as Status,
  dueDate: '',
})
const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)

function clearErrors() {
  Object.keys(errors).forEach((k) => delete errors[k])
}

// Every time the panel opens, fill the form (empty for create, task data for edit)
watch(
  () => ui.taskPanelOpen,
  async (open) => {
    if (!open) return
    clearErrors()
    const t = ui.editingTask
    form.title = t?.title ?? ''
    form.description = t?.description ?? ''
    form.subject = t?.subject ?? subjectStore.subjects[0]?.name ?? ''
    form.priority = t?.priority ?? 'Medium'
    form.status = t?.status ?? 'Pending'
    form.dueDate = t?.dueDate ?? ui.defaultDueDate ?? dateKeyFromOffset(0)
    await nextTick()
    titleInput.value?.focus()
  },
)

function validate(): boolean {
  clearErrors()
  if (form.title.trim().length < 3) errors.title = 'Title must be at least 3 characters.'
  else if (form.title.length > 100) errors.title = 'Title must be 100 characters or less.'
  if (form.description.length > 500) errors.description = 'Description must be 500 characters or less.'
  if (!form.subject) errors.subject = 'Please choose a subject.'
  if (!form.dueDate) errors.dueDate = 'Please choose a due date.'
  return Object.keys(errors).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  await new Promise((resolve) => setTimeout(resolve, 400)) // fake network delay, removed in Phase 5
  const data = {
    title: form.title.trim(),
    description: form.description.trim(),
    subject: form.subject,
    priority: form.priority,
    status: form.status,
    dueDate: form.dueDate,
  }
  if (ui.editingTask) {
    tasks.updateTask(ui.editingTask.id, data)
    ui.toast('Task updated')
  } else {
    tasks.addTask(data)
    ui.toast('Task created')
  }
  saving.value = false
  ui.closeTaskPanel()
}
</script>

<template>
  <Transition name="overlay">
    <div v-if="ui.taskPanelOpen" class="fixed inset-0 z-50 bg-slate-900/40" @click="ui.closeTaskPanel()"></div>
  </Transition>

  <Transition name="slide">
    <aside
      v-if="ui.taskPanelOpen"
      class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-title"
      @keydown.esc="ui.closeTaskPanel()"
    >
      <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 id="panel-title" class="text-lg font-semibold">
          {{ ui.editingTask ? 'Edit task' : 'Create task' }}
        </h2>
        <button class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Close panel" @click="ui.closeTaskPanel()">
          <X :size="18" />
        </button>
      </div>

      <form class="flex flex-1 flex-col overflow-hidden" novalidate @submit.prevent="save">
        <div class="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label for="task-title" class="field-label">Title</label>
            <input id="task-title" ref="titleInput" v-model="form.title" type="text" class="field" placeholder="e.g. Finish database assignment" />
            <p v-if="errors.title" class="mt-1 text-xs text-rose-600">{{ errors.title }}</p>
          </div>

          <div>
            <label for="task-desc" class="field-label">Description</label>
            <textarea id="task-desc" v-model="form.description" rows="3" class="field resize-none" placeholder="Add some details (optional)"></textarea>
            <p v-if="errors.description" class="mt-1 text-xs text-rose-600">{{ errors.description }}</p>
          </div>

          <div>
            <label for="task-subject" class="field-label">Subject</label>
            <select id="task-subject" v-model="form.subject" class="field">
              <option v-for="s in subjectStore.subjects" :key="s.id" :value="s.name">{{ s.name }}</option>
            </select>
            <p v-if="errors.subject" class="mt-1 text-xs text-rose-600">{{ errors.subject }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="task-priority" class="field-label">Priority</label>
              <select id="task-priority" v-model="form.priority" class="field">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label for="task-status" class="field-label">Status</label>
              <select id="task-status" v-model="form.status" class="field">
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label for="task-due" class="field-label">Due date</label>
            <input id="task-due" v-model="form.dueDate" type="date" class="field" />
            <p v-if="errors.dueDate" class="mt-1 text-xs text-rose-600">{{ errors.dueDate }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" class="btn-ghost border border-slate-200 bg-white" @click="ui.closeTaskPanel()">Cancel</button>
          <button type="submit" class="btn-primary disabled:opacity-70" :disabled="saving">
            <LoaderCircle v-if="saving" :size="16" class="animate-spin" />
            {{ saving ? 'Saving...' : ui.editingTask ? 'Save changes' : 'Create task' }}
          </button>
        </div>
      </form>
    </aside>
  </Transition>
</template>
