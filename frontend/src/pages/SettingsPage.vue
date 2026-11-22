<script setup lang="ts">
import { reactive, ref } from 'vue'
import { LoaderCircle, Sun, Moon, Monitor } from '@lucide/vue'
import PasswordInput from '../components/PasswordInput.vue'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore, type Theme } from '../stores/settings'
import { useUiStore } from '../stores/ui'

const auth = useAuthStore()
const settings = useSettingsStore()
const ui = useUiStore()
import { ref as vueRef } from 'vue'
import UserAvatar from '../components/UserAvatar.vue'

const avatarInput = vueRef<HTMLInputElement | null>(null)
const avatarBusy = vueRef(false)
const avatarError = vueRef('')

async function onAvatarPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  avatarError.value = ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    avatarError.value = 'Please choose a JPG, PNG or WebP image.'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = 'Image must be 2 MB or smaller.'
    return
  }
  avatarBusy.value = true
  try {
    await auth.uploadAvatar(file)
  } catch (err) {
    avatarError.value = err instanceof Error ? err.message : 'Upload failed.'
  } finally {
    avatarBusy.value = false
  }
}

async function onAvatarRemove() {
  avatarError.value = ''
  avatarBusy.value = true
  try {
    await auth.removeAvatar()
  } catch (err) {
    avatarError.value = err instanceof Error ? err.message : 'Could not remove the photo.'
  } finally {
    avatarBusy.value = false
  }
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------- Profile ----------
const profile = reactive({ name: auth.user.name, email: auth.user.email })
const profileErrors = reactive<Record<string, string>>({})
const savingProfile = ref(false)

async function saveProfile() {
  Object.keys(profileErrors).forEach((k) => delete profileErrors[k])
  if (profile.name.trim().length < 2) profileErrors.name = 'Name must be at least 2 characters.'
  if (!emailPattern.test(profile.email.trim())) profileErrors.email = 'Please enter a valid email address.'
  if (Object.keys(profileErrors).length) return

  savingProfile.value = true
  try {
    await auth.updateProfile(profile.name.trim(), profile.email.trim())
    ui.toast('Profile updated')
  } catch (e) {
    ui.toast(e instanceof Error ? e.message : 'Could not update your profile', 'error')
  } finally {
    savingProfile.value = false
  }
}

// ---------- Password ----------
const pw = reactive({ current: '', next: '', confirm: '' })
const pwErrors = reactive<Record<string, string>>({})
const savingPw = ref(false)

async function savePassword() {
  Object.keys(pwErrors).forEach((k) => delete pwErrors[k])
  if (!pw.current) pwErrors.current = 'Enter your current password.'
  if (pw.next.length < 8) pwErrors.next = 'New password must be at least 8 characters.'
  else if (!/[A-Za-z]/.test(pw.next) || !/\d/.test(pw.next))
    pwErrors.next = 'New password must contain at least one letter and one number.'
  else if (pw.next === pw.current) pwErrors.next = 'New password must be different from the current one.'
  if (!pw.confirm) pwErrors.confirm = 'Please confirm the new password.'
  else if (pw.confirm !== pw.next) pwErrors.confirm = 'Passwords do not match.'
  if (Object.keys(pwErrors).length) return

  savingPw.value = true
  try {
    await auth.changePassword(pw.current, pw.next)
    pw.current = pw.next = pw.confirm = ''
    ui.toast('Password changed')
  } catch (e) {
    ui.toast(e instanceof Error ? e.message : 'Could not change your password', 'error')
  } finally {
    savingPw.value = false
  }
}

// ---------- Theme and notifications ----------
const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const toggles = [
  { key: 'deadlineReminders', label: 'Deadline reminders', hint: 'Get reminded before a task is due.' },
  { key: 'weeklySummary', label: 'Weekly summary', hint: 'A recap of what you completed each week.' },
  { key: 'emailUpdates', label: 'Email updates', hint: 'News and tips about StudyFlow.' },
] as const
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <!-- Profile -->
    <section class="card p-6">
      <h2 class="font-semibold">Profile</h2>
      <p class="mb-5 text-sm text-muted">Update your name and email address.</p>

      <div class="mb-6 flex items-center gap-4">
        <div class="h-16 w-16 shrink-0"><UserAvatar size="h-16 w-16" /></div>
        <div>
          <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatarPicked" />
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-primary" :disabled="avatarBusy" @click="avatarInput?.click()">
              {{ avatarBusy ? 'Uploading...' : 'Change photo' }}
            </button>
            <button v-if="auth.user.avatar" type="button" class="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" :disabled="avatarBusy" @click="onAvatarRemove">
              Remove
            </button>
          </div>
          <p class="mt-1 text-xs text-muted">JPG, PNG or WebP, up to 2 MB.</p>
          <p v-if="avatarError" class="mt-1 text-xs text-rose-600">{{ avatarError }}</p>
        </div>
      </div>

      <form class="space-y-5" novalidate @submit.prevent="saveProfile">
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="set-name" class="field-label">Full name</label>
            <input id="set-name" v-model="profile.name" type="text" autocomplete="name" class="field" :aria-invalid="!!profileErrors.name" />
            <p v-if="profileErrors.name" class="mt-1 text-xs text-rose-600">{{ profileErrors.name }}</p>
          </div>
          <div>
            <label for="set-email" class="field-label">Email</label>
            <input id="set-email" v-model="profile.email" type="email" autocomplete="email" class="field" :aria-invalid="!!profileErrors.email" />
            <p v-if="profileErrors.email" class="mt-1 text-xs text-rose-600">{{ profileErrors.email }}</p>
          </div>
        </div>
        <div class="flex justify-end">
          <button type="submit" class="btn-primary disabled:opacity-70" :disabled="savingProfile">
            <LoaderCircle v-if="savingProfile" :size="16" class="animate-spin" />
            {{ savingProfile ? 'Saving...' : 'Save profile' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Password -->
    <section class="card p-6">
      <h2 class="font-semibold">Change password</h2>
      <p class="mb-5 text-sm text-muted">Use at least 8 characters with a letter and a number.</p>

      <form class="space-y-5" novalidate @submit.prevent="savePassword">
        <PasswordInput id="set-current" v-model="pw.current" label="Current password" autocomplete="current-password" :error="pwErrors.current" />
        <div class="grid gap-5 sm:grid-cols-2">
          <PasswordInput id="set-new" v-model="pw.next" label="New password" autocomplete="new-password" :error="pwErrors.next" />
          <PasswordInput id="set-confirm" v-model="pw.confirm" label="Confirm new password" autocomplete="new-password" :error="pwErrors.confirm" />
        </div>
        <div class="flex justify-end">
          <button type="submit" class="btn-primary disabled:opacity-70" :disabled="savingPw">
            <LoaderCircle v-if="savingPw" :size="16" class="animate-spin" />
            {{ savingPw ? 'Updating...' : 'Update password' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Theme -->
    <section class="card p-6">
      <h2 class="font-semibold">Appearance</h2>
      <p class="mb-5 text-sm text-muted">Choose how StudyFlow looks. Saved on this device.</p>

      <div class="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
        <button
          v-for="t in themes"
          :key="t.value"
          type="button"
          role="radio"
          :aria-checked="settings.theme === t.value"
          :class="[
            'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500',
            settings.theme === t.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-muted hover:border-slate-300',
          ]"
          @click="settings.theme = t.value"
        >
          <component :is="t.icon" :size="22" />
          {{ t.label }}
        </button>
      </div>
    </section>

    <!-- Notifications -->
    <section class="card p-6">
      <h2 class="font-semibold">Notifications</h2>
      <p class="mb-2 text-sm text-muted">Choose what you want to hear about. Saved on this device.</p>

      <ul class="divide-y divide-slate-100">
        <li v-for="n in toggles" :key="n.key" class="flex items-center justify-between gap-4 py-4">
          <div>
            <p id="n-label" class="text-sm font-medium">{{ n.label }}</p>
            <p class="text-xs text-muted">{{ n.hint }}</p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="settings.notifications[n.key]"
            :aria-label="n.label"
            :class="[
              'relative h-6 w-11 shrink-0 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
              settings.notifications[n.key] ? 'bg-brand-600' : 'bg-slate-300',
            ]"
            @click="settings.notifications[n.key] = !settings.notifications[n.key]"
          >
            <span
              :class="[
                'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                settings.notifications[n.key] ? 'translate-x-5' : '',
              ]"
            ></span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
