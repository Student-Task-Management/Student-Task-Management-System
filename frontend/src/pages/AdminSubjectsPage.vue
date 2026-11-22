<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { Plus, Pencil, Trash2, BookOpen, X, Check, LoaderCircle, TriangleAlert, Info } from '@lucide/vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { api, getErrorMessage } from '../services/api'
import { useUiStore } from '../stores/ui'
import type { CatalogSubject } from '../types/admin'

const ui = useUiStore()
const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6']

const subjects = ref<CatalogSubject[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/admin/subjects')
    subjects.value = data.data.subjects
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ---------- Add / edit ----------
const modalOpen = ref(false)
const editing = ref<CatalogSubject | null>(null)
const form = reactive({ name: '', color: palette[0], description: '' })
const errors = reactive<Record<string, string>>({})
const formError = ref('')
const saving = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

async function openModal(subject?: CatalogSubject) {
  Object.keys(errors).forEach((k) => delete errors[k])
  formError.value = ''
  editing.value = subject ?? null
  form.name = subject?.name ?? ''
  form.color = subject?.color ?? palette[subjects.value.length % palette.length]
  form.description = subject?.description ?? ''
  modalOpen.value = true
  await nextTick()
  nameInput.value?.focus()
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  const name = form.name.trim()
  const duplicate = subjects.value.some(
    (s) => s.name.toLowerCase() === name.toLowerCase() && s.id !== editing.value?.id,
  )
  if (name.length < 2) errors.name = 'Name must be at least 2 characters.'
  else if (name.length > 30) errors.name = 'Name must be 30 characters or less.'
  else if (duplicate) errors.name = 'A subject with this name already exists.'
  if (form.description.length > 200) errors.description = 'Description must be 200 characters or less.'
  return Object.keys(errors).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  formError.value = ''
  const body = { name: form.name.trim(), color: form.color, description: form.description.trim() }
  try {
    if (editing.value) {
      await api.put(`/admin/subjects/${editing.value.id}`, body)
      ui.toast('Subject updated')
    } else {
      await api.post('/admin/subjects', body)
      ui.toast('Subject added')
    }
    modalOpen.value = false
    void load()
  } catch (e) {
    formError.value = getErrorMessage(e)
  } finally {
    saving.value = false
  }
}

// ---------- Remove ----------
const deleting = ref<CatalogSubject | null>(null)

async function confirmDelete() {
  const s = deleting.value
  if (!s) return
  deleting.value = null
  try {
    await api.delete(`/admin/subjects/${s.id}`)
    subjects.value = subjects.value.filter((x) => x.id !== s.id)
    ui.toast('Subject removed from the catalog')
  } catch (e) {
    ui.toast(getErrorMessage(e), 'error')
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight">Subjects</h1>
        <p class="text-sm text-muted">The subject catalog given to every new student.</p>
      </div>
      <button class="btn-primary justify-center" @click="openModal()"><Plus :size="16" /> Add subject</button>
    </div>

    <div class="flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-700">
      <Info :size="18" class="mt-0.5 shrink-0" />
      <p>
        New students receive a copy of every subject listed here. Students who already have a subject keep it,
        so editing or removing a catalog subject never changes their data.
      </p>
    </div>

    <div v-if="error" class="card p-8 text-center" role="alert">
      <p class="font-medium">Could not load the subjects</p>
      <p class="mt-1 text-sm text-muted">{{ error }}</p>
      <button class="btn-primary mt-4" @click="load">Try again</button>
    </div>

    <div v-else-if="loading && subjects.length === 0" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      <div v-for="n in 3" :key="n" class="skeleton h-40"></div>
    </div>

    <div v-else-if="subjects.length === 0" class="card py-16 text-center">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><BookOpen :size="28" /></span>
      <h2 class="mt-4 text-lg font-semibold">The catalog is empty</h2>
      <p class="mt-1 text-sm text-muted">New students will start without subjects until you add some.</p>
      <button class="btn-primary mt-5" @click="openModal()"><Plus :size="16" /> Add subject</button>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article v-for="s in subjects" :key="s.id" class="card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" :style="{ backgroundColor: s.color }">
              <BookOpen :size="20" />
            </span>
            <div class="min-w-0">
              <h3 class="truncate font-semibold">{{ s.name }}</h3>
              <p class="text-xs text-muted">{{ s.studentCount }} student{{ s.studentCount === 1 ? '' : 's' }} use this subject</p>
            </div>
          </div>
          <div class="flex shrink-0 gap-1">
            <button class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" :aria-label="`Edit ${s.name}`" title="Edit subject" @click="openModal(s)">
              <Pencil :size="16" />
            </button>
            <button class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-600" :aria-label="`Remove ${s.name}`" title="Remove from catalog" @click="deleting = s">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
        <p class="mt-3 line-clamp-2 min-h-10 text-sm text-muted">{{ s.description || 'No description' }}</p>
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
        <div class="card max-h-full w-full max-w-md overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="catalog-modal-title">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 id="catalog-modal-title" class="text-lg font-semibold">{{ editing ? 'Edit subject' : 'Add subject' }}</h2>
            <button class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Close" @click="modalOpen = false">
              <X :size="18" />
            </button>
          </div>

          <form class="space-y-5 px-6 py-5" novalidate @submit.prevent="save">
            <div v-if="formError" class="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
              <TriangleAlert :size="18" class="mt-0.5 shrink-0" /> {{ formError }}
            </div>

            <div>
              <label for="catalog-name" class="field-label">Name</label>
              <input id="catalog-name" ref="nameInput" v-model="form.name" type="text" class="field" placeholder="e.g. Physics" :aria-invalid="!!errors.name" />
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
              <label for="catalog-desc" class="field-label">Description</label>
              <textarea id="catalog-desc" v-model="form.description" rows="3" class="field resize-none" placeholder="What is this subject about? (optional)"></textarea>
              <p v-if="errors.description" class="mt-1 text-xs text-rose-600">{{ errors.description }}</p>
            </div>

            <div class="flex justify-end gap-2 pt-1">
              <button type="button" class="btn-ghost border border-slate-200 bg-white" @click="modalOpen = false">Cancel</button>
              <button type="submit" class="btn-primary disabled:opacity-70" :disabled="saving">
                <LoaderCircle v-if="saving" :size="16" class="animate-spin" />
                {{ saving ? 'Saving...' : editing ? 'Save changes' : 'Add subject' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <ConfirmDialog
      :open="!!deleting"
      title="Remove this subject?"
      :message="deleting ? `&quot;${deleting.name}&quot; will no longer be given to new students. Students who already have it keep their copy and their tasks.` : ''"
      confirm-text="Remove subject"
      @confirm="confirmDelete"
      @cancel="deleting = null"
    />
  </div>
</template>
