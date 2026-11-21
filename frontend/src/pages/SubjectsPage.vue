<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { Plus, Pencil, Trash2, BookOpen, X, Check } from '@lucide/vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useSubjectStore } from '../stores/subjects'
import { useTaskStore } from '../stores/tasks'
import { useUiStore } from '../stores/ui'
import type { Subject } from '../types'

const subjectStore = useSubjectStore()
const taskStore = useTaskStore()
const ui = useUiStore()

const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6']

// One card per subject, with live numbers from the tasks
const cards = computed(() =>
  subjectStore.subjects.map((s) => {
    const list = taskStore.tasks.filter((t) => t.subject === s.name)
    const done = list.filter((t) => t.status === 'Completed').length
    return {
      subject: s,
      total: list.length,
      done,
      percent: list.length === 0 ? 0 : Math.round((done / list.length) * 100),
    }
  }),
)

// ---------- Add / edit modal ----------
const modalOpen = ref(false)
const editing = ref<Subject | null>(null)
const form = reactive({ name: '', color: palette[0], description: '' })
const errors = reactive<Record<string, string>>({})
const nameInput = ref<HTMLInputElement | null>(null)

async function openModal(subject?: Subject) {
  Object.keys(errors).forEach((k) => delete errors[k])
  editing.value = subject ?? null
  form.name = subject?.name ?? ''
  form.color = subject?.color ?? palette[subjectStore.subjects.length % palette.length]
  form.description = subject?.description ?? ''
  modalOpen.value = true
  await nextTick()
  nameInput.value?.focus()
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  const name = form.name.trim()
  const duplicate = subjectStore.subjects.some(
    (s) => s.name.toLowerCase() === name.toLowerCase() && s.id !== editing.value?.id,
  )
  if (name.length < 2) errors.name = 'Name must be at least 2 characters.'
  else if (name.length > 30) errors.name = 'Name must be 30 characters or less.'
  else if (duplicate) errors.name = 'You already have a subject with this name.'
  if (form.description.length > 200) errors.description = 'Description must be 200 characters or less.'
  return Object.keys(errors).length === 0
}

function save() {
  if (!validate()) return
  const data = { name: form.name.trim(), color: form.color, description: form.description.trim() }
  if (editing.value) {
    const oldName = editing.value.name
    subjectStore.updateSubject(editing.value.id, data)
    if (oldName !== data.name) taskStore.renameSubject(oldName, data.name)
    ui.toast('Subject updated')
  } else {
    subjectStore.addSubject(data)
    ui.toast('Subject added')
  }
  modalOpen.value = false
}

// ---------- Delete ----------
const deleting = ref<Subject | null>(null)

const deleteMessage = computed(() => {
  if (!deleting.value) return ''
  const count = taskStore.tasks.filter((t) => t.subject === deleting.value!.name).length
  return count > 0
    ? `"${deleting.value.name}" and its ${count} task${count === 1 ? '' : 's'} will be permanently deleted. This cannot be undone.`
    : `"${deleting.value.name}" will be permanently deleted. This cannot be undone.`
})

function confirmDelete() {
  if (!deleting.value) return
  taskStore.deleteBySubject(deleting.value.name)
  subjectStore.deleteSubject(deleting.value.id)
  ui.toast('Subject deleted')
  deleting.value = null
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-muted">{{ subjectStore.subjects.length }} subjects</p>
      <button class="btn-primary" @click="openModal()"><Plus :size="16" /> Add Subject</button>
    </div>

    <!-- Empty state -->
    <div v-if="subjectStore.subjects.length === 0" class="card py-16 text-center">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><BookOpen :size="28" /></span>
      <h2 class="mt-4 text-lg font-semibold">No subjects yet</h2>
      <p class="mt-1 text-sm text-muted">Add a subject like Programming or Mathematics to organize your tasks.</p>
      <button class="btn-primary mt-5" @click="openModal()"><Plus :size="16" /> Add Subject</button>
    </div>

    <!-- Subject cards -->
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="c in cards"
        :key="c.subject.id"
        class="card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" :style="{ backgroundColor: c.subject.color }">
              <BookOpen :size="20" />
            </span>
            <div class="min-w-0">
              <h3 class="truncate font-semibold">{{ c.subject.name }}</h3>
              <p class="text-xs text-muted">{{ c.total }} task{{ c.total === 1 ? '' : 's' }}</p>
            </div>
          </div>
          <div class="flex shrink-0 gap-1">
            <button class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Edit subject" title="Edit subject" @click="openModal(c.subject)">
              <Pencil :size="16" />
            </button>
            <button class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-600" aria-label="Delete subject" title="Delete subject" @click="deleting = c.subject">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <p class="mt-3 line-clamp-2 min-h-8 text-sm text-muted">{{ c.subject.description || 'No description' }}</p>

        <div class="mt-4">
          <div class="mb-1.5 flex justify-between text-xs">
            <span class="text-muted">{{ c.done }} of {{ c.total }} completed</span>
            <span class="font-semibold">{{ c.percent }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" :aria-valuenow="c.percent" aria-valuemin="0" aria-valuemax="100" :aria-label="`${c.subject.name} completion`">
            <div class="h-full rounded-full transition-all duration-500" :style="{ width: c.percent + '%', backgroundColor: c.subject.color }"></div>
          </div>
        </div>
      </article>
    </div>

    <!-- Add / edit modal -->
    <Transition name="overlay">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
        @click.self="modalOpen = false"
        @keydown.esc="modalOpen = false"
      >
        <div class="card w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="subject-modal-title">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 id="subject-modal-title" class="text-lg font-semibold">{{ editing ? 'Edit subject' : 'Add subject' }}</h2>
            <button class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Close" @click="modalOpen = false">
              <X :size="18" />
            </button>
          </div>

          <form class="space-y-5 px-6 py-5" novalidate @submit.prevent="save">
            <div>
              <label for="subject-name" class="field-label">Name</label>
              <input id="subject-name" ref="nameInput" v-model="form.name" type="text" class="field" placeholder="e.g. Physics" />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-600">{{ errors.name }}</p>
            </div>

            <div>
              <span class="field-label">Color</span>
              <div class="flex flex-wrap gap-2.5">
                <button
                  v-for="c in palette"
                  :key="c"
                  type="button"
                  class="grid h-8 w-8 place-items-center rounded-full text-white outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  :style="{ backgroundColor: c }"
                  :aria-label="`Choose color ${c}`"
                  :aria-pressed="form.color === c"
                  @click="form.color = c"
                >
                  <Check v-if="form.color === c" :size="16" />
                </button>
              </div>
            </div>

            <div>
              <label for="subject-desc" class="field-label">Description</label>
              <textarea id="subject-desc" v-model="form.description" rows="3" class="field resize-none" placeholder="What is this subject about? (optional)"></textarea>
              <p v-if="errors.description" class="mt-1 text-xs text-rose-600">{{ errors.description }}</p>
            </div>

            <div class="flex justify-end gap-2 pt-1">
              <button type="button" class="btn-ghost border border-slate-200 bg-white" @click="modalOpen = false">Cancel</button>
              <button type="submit" class="btn-primary">{{ editing ? 'Save changes' : 'Add subject' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <ConfirmDialog
      :open="!!deleting"
      title="Delete this subject?"
      :message="deleteMessage"
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="deleting = null"
    />
  </div>
</template>
