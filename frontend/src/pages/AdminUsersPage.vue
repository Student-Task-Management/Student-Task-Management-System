<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { Search, Ban, UserCheck, Trash2, Users, Plus, Pencil, Eye, X, LoaderCircle, TriangleAlert } from '@lucide/vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import PasswordInput from '../components/PasswordInput.vue'
import { api, getErrorMessage } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import type { AdminUser, Role } from '../types/admin'

const auth = useAuthStore()
const ui = useUiStore()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const users = ref<AdminUser[]>([])
const search = ref('')
const roleFilter = ref<'' | Role>('')
const statusFilter = ref<'' | 'active' | 'disabled'>('')
const loading = ref(true)
const error = ref('')
const busyId = ref<string | null>(null)
const deleting = ref<AdminUser | null>(null)

const isSelf = (u: AdminUser) => u.id === auth.user.id
// Students can be fully managed. Admin accounts only allow a role change, except your own profile.
const canEdit = (u: AdminUser) => isSelf(u) || u.role !== 'admin'
const canManage = (u: AdminUser) => u.role !== 'admin'

let requestId = 0
async function load() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/admin/users', {
      params: { q: search.value.trim(), role: roleFilter.value, status: statusFilter.value },
    })
    if (id !== requestId) return
    users.value = data.data.users
  } catch (e) {
    if (id === requestId) error.value = getErrorMessage(e)
  } finally {
    if (id === requestId) loading.value = false
  }
}

onMounted(load)

// Reload 300 ms after the admin stops typing or changes a filter
let timer: ReturnType<typeof setTimeout>
watch([search, roleFilter, statusFilter], () => {
  clearTimeout(timer)
  timer = setTimeout(load, 300)
})

// ---------- Add / edit ----------
const modalOpen = ref(false)
const editing = ref<AdminUser | null>(null)
const form = reactive({ name: '', email: '', password: '', role: 'user' as Role })
const errors = reactive<Record<string, string>>({})
const formError = ref('')
const saving = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

async function openModal(user?: AdminUser) {
  Object.keys(errors).forEach((k) => delete errors[k])
  formError.value = ''
  editing.value = user ?? null
  form.name = user?.name ?? ''
  form.email = user?.email ?? ''
  form.password = ''
  form.role = 'user'
  modalOpen.value = true
  await nextTick()
  nameInput.value?.focus()
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.'
  if (!emailPattern.test(form.email.trim())) errors.email = 'Please enter a valid email address.'

  // The password is required for a new user and optional when editing
  const pw = form.password
  if (!editing.value || pw) {
    if (pw.length < 8) errors.password = 'Password must be at least 8 characters.'
    else if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) errors.password = 'Password must contain at least one letter and one number.'
  }
  return Object.keys(errors).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  formError.value = ''

  const body: Record<string, string> = { name: form.name.trim(), email: form.email.trim() }
  if (form.password) body.password = form.password
  if (!editing.value) body.role = form.role

  try {
    if (editing.value) {
      await api.put(`/admin/users/${editing.value.id}`, body)
      if (isSelf(editing.value)) void auth.refresh() // keep the name in the header up to date
      ui.toast('User updated')
    } else {
      await api.post('/admin/users', body)
      ui.toast(form.role === 'admin' ? 'Administrator created' : 'User created')
    }
    modalOpen.value = false
    void load()
  } catch (e) {
    formError.value = getErrorMessage(e)
  } finally {
    saving.value = false
  }
}

// ---------- Enable / disable ----------
async function toggleDisabled(u: AdminUser) {
  busyId.value = u.id
  try {
    await api.patch(`/admin/users/${u.id}/status`, { disabled: !u.disabled })
    u.disabled = !u.disabled
    ui.toast(u.disabled ? 'Account disabled' : 'Account enabled')
  } catch (e) {
    ui.toast(getErrorMessage(e), 'error')
  } finally {
    busyId.value = null
  }
}

// ---------- Change role (with confirmation) ----------
const pendingRole = ref<{ user: AdminUser; role: Role } | null>(null)

function askRole(u: AdminUser, e: Event) {
  const select = e.target as HTMLSelectElement
  const role = select.value as Role
  select.value = u.role // the list only changes after the admin confirms
  if (role !== u.role) pendingRole.value = { user: u, role }
}

const roleTitle = computed(() => {
  const p = pendingRole.value
  if (!p) return ''
  return p.role === 'admin' ? `Make ${p.user.name} an administrator?` : `Change ${p.user.name} to Student?`
})
const roleMessage = computed(() => {
  const p = pendingRole.value
  if (!p) return ''
  return p.role === 'admin'
    ? 'They will get full access to the admin dashboard, including every student account and task.'
    : 'They will lose access to the admin dashboard and become a regular student.'
})

async function confirmRole() {
  const p = pendingRole.value
  if (!p) return
  pendingRole.value = null
  busyId.value = p.user.id
  try {
    await api.patch(`/admin/users/${p.user.id}/role`, { role: p.role })
    ui.toast(p.role === 'admin' ? 'Now an administrator' : 'Changed to Student')
    await load()
  } catch (e) {
    ui.toast(getErrorMessage(e), 'error')
  } finally {
    busyId.value = null
  }
}

// ---------- Delete ----------
const deleteMessage = computed(() => {
  const u = deleting.value
  if (!u) return ''
  return `${u.name} and all of their data (${u.taskCount} task${u.taskCount === 1 ? '' : 's'} and their subjects) will be permanently deleted. This cannot be undone.`
})

async function confirmDelete() {
  const u = deleting.value
  if (!u) return
  deleting.value = null
  busyId.value = u.id
  try {
    await api.delete(`/admin/users/${u.id}`)
    users.value = users.value.filter((x) => x.id !== u.id)
    ui.toast('User deleted')
  } catch (e) {
    ui.toast(getErrorMessage(e), 'error')
  } finally {
    busyId.value = null
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight">Users</h1>
        <p class="text-sm text-muted">Add, edit, disable or delete accounts, and assign roles.</p>
      </div>
      <button class="btn-primary justify-center" @click="openModal()"><Plus :size="16" /> Add user</button>
    </div>

    <section class="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filters">
      <div class="relative sm:col-span-2">
        <label for="user-search" class="sr-only">Search users by name or email</label>
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input id="user-search" v-model="search" type="search" placeholder="Search by name or email..." class="field pl-9" />
      </div>
      <div>
        <label for="f-role" class="sr-only">Filter by role</label>
        <select id="f-role" v-model="roleFilter" class="field">
          <option value="">All roles</option>
          <option value="user">Students</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <div>
        <label for="f-status" class="sr-only">Filter by status</label>
        <select id="f-status" v-model="statusFilter" class="field">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
    </section>

    <div v-if="error" class="card p-8 text-center" role="alert">
      <p class="font-medium">Could not load users</p>
      <p class="mt-1 text-sm text-muted">{{ error }}</p>
      <button class="btn-primary mt-4" @click="load">Try again</button>
    </div>

    <div v-else-if="loading && users.length === 0" class="card space-y-3 p-5" aria-busy="true">
      <div v-for="n in 5" :key="n" class="skeleton h-12"></div>
    </div>

    <div v-else-if="users.length === 0" class="card py-16 text-center">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-muted"><Users :size="28" /></span>
      <h2 class="mt-4 text-lg font-semibold">{{ search || roleFilter || statusFilter ? 'No matching users' : 'No users yet' }}</h2>
      <p class="mt-1 text-sm text-muted">{{ search || roleFilter || statusFilter ? 'Try different filters.' : 'Add a student here, or wait for students to sign up.' }}</p>
    </div>

    <div v-else class="card overflow-x-auto">
      <table class="w-full min-w-[620px] text-left text-sm">
        <thead class="border-b border-slate-100 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" class="px-5 py-3 font-medium">User</th>
            <th scope="col" class="px-5 py-3 font-medium">Role</th>
            <th scope="col" class="hidden px-5 py-3 font-medium md:table-cell">Tasks</th>
            <th scope="col" class="hidden px-5 py-3 font-medium lg:table-cell">Joined</th>
            <th scope="col" class="px-5 py-3 font-medium">Status</th>
            <th scope="col" class="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="u in users" :key="u.id" class="transition hover:bg-slate-50">
            <td class="px-5 py-3">
              <RouterLink :to="`/admin/users/${u.id}`" class="font-medium hover:text-brand-700">{{ u.name }}</RouterLink>
              <span v-if="isSelf(u)" class="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">You</span>
              <p class="text-xs text-muted">{{ u.email }}</p>
            </td>
            <td class="px-5 py-3">
              <label :for="`role-${u.id}`" class="sr-only">Role of {{ u.name }}</label>
              <select
                :id="`role-${u.id}`"
                :value="u.role"
                :disabled="isSelf(u) || busyId === u.id"
                class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-500 disabled:opacity-60"
                @change="askRole(u, $event)"
              >
                <option value="user">Student</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td class="hidden px-5 py-3 text-muted md:table-cell">{{ u.completedCount }} / {{ u.taskCount }} done</td>
            <td class="hidden px-5 py-3 text-muted lg:table-cell">{{ formatDate(u.createdAt) }}</td>
            <td class="px-5 py-3">
              <span :class="['rounded-full px-2.5 py-0.5 text-xs font-medium', u.disabled ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700']">
                {{ u.disabled ? 'Disabled' : 'Active' }}
              </span>
            </td>
            <td class="px-5 py-3">
              <div class="flex justify-end gap-1">
                <RouterLink
                  :to="`/admin/users/${u.id}`"
                  class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink"
                  :aria-label="`View ${u.name}`"
                  title="View details"
                >
                  <Eye :size="16" />
                </RouterLink>
                <button
                  v-if="canEdit(u)"
                  class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                  :aria-label="`Edit ${u.name}`"
                  title="Edit user"
                  :disabled="busyId === u.id"
                  @click="openModal(u)"
                >
                  <Pencil :size="16" />
                </button>
                <template v-if="canManage(u)">
                  <button
                    class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                    :aria-label="u.disabled ? `Enable ${u.name}` : `Disable ${u.name}`"
                    :title="u.disabled ? 'Enable account' : 'Disable account'"
                    :disabled="busyId === u.id"
                    @click="toggleDisabled(u)"
                  >
                    <UserCheck v-if="u.disabled" :size="16" />
                    <Ban v-else :size="16" />
                  </button>
                  <button
                    class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    :aria-label="`Delete ${u.name}`"
                    title="Delete user"
                    :disabled="busyId === u.id"
                    @click="deleting = u"
                  >
                    <Trash2 :size="16" />
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="users.length" class="px-1 text-xs text-muted">
      Administrator accounts can only have their role changed. Change an admin to Student first to disable or delete them.
    </p>

    <!-- Add / edit modal -->
    <Transition name="overlay">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
        @click.self="modalOpen = false"
        @keydown.esc="modalOpen = false"
      >
        <div class="card max-h-full w-full max-w-md overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 id="user-modal-title" class="text-lg font-semibold">{{ editing ? 'Edit user' : 'Add user' }}</h2>
            <button class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Close" @click="modalOpen = false">
              <X :size="18" />
            </button>
          </div>

          <form class="space-y-5 px-6 py-5" novalidate @submit.prevent="save">
            <div v-if="formError" class="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
              <TriangleAlert :size="18" class="mt-0.5 shrink-0" /> {{ formError }}
            </div>

            <div>
              <label for="user-name" class="field-label">Full name</label>
              <input id="user-name" ref="nameInput" v-model="form.name" type="text" autocomplete="off" class="field" placeholder="Alex Student" :aria-invalid="!!errors.name" />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-600">{{ errors.name }}</p>
            </div>

            <div>
              <label for="user-email" class="field-label">Email</label>
              <input id="user-email" v-model="form.email" type="email" autocomplete="off" class="field" placeholder="student@school.com" :aria-invalid="!!errors.email" />
              <p v-if="errors.email" class="mt-1 text-xs text-rose-600">{{ errors.email }}</p>
            </div>

            <div v-if="!editing">
              <label for="user-role" class="field-label">Role</label>
              <select id="user-role" v-model="form.role" class="field">
                <option value="user">Student</option>
                <option value="admin">Admin</option>
              </select>
              <p v-if="form.role === 'admin'" class="mt-1 text-xs text-muted">Administrators can manage every student, task and subject.</p>
            </div>

            <PasswordInput
              id="user-password"
              v-model="form.password"
              :label="editing ? 'New password (leave empty to keep the current one)' : 'Password'"
              autocomplete="new-password"
              placeholder="At least 8 characters, letter and number"
              :error="errors.password"
            />

            <div class="flex justify-end gap-2 pt-1">
              <button type="button" class="btn-ghost border border-slate-200 bg-white" @click="modalOpen = false">Cancel</button>
              <button type="submit" class="btn-primary disabled:opacity-70" :disabled="saving">
                <LoaderCircle v-if="saving" :size="16" class="animate-spin" />
                {{ saving ? 'Saving...' : editing ? 'Save changes' : 'Create user' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <ConfirmDialog
      :open="!!pendingRole"
      :title="roleTitle"
      :message="roleMessage"
      confirm-text="Change role"
      @confirm="confirmRole"
      @cancel="pendingRole = null"
    />

    <ConfirmDialog
      :open="!!deleting"
      title="Delete this user?"
      :message="deleteMessage"
      confirm-text="Delete user"
      @confirm="confirmDelete"
      @cancel="deleting = null"
    />
  </div>
</template>
