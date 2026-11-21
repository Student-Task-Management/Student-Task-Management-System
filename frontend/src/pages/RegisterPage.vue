<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LoaderCircle, TriangleAlert } from '@lucide/vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import PasswordInput from '../components/PasswordInput.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '', confirm: '' })
const errors = reactive<Record<string, string>>({})
const loading = ref(false)
const formError = ref('')
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (form.name.trim().length < 2) errors.name = 'Please enter your full name (at least 2 characters).'
  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!emailPattern.test(form.email.trim())) errors.email = 'Please enter a valid email address.'
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
    errors.password = 'Password must contain at least one letter and one number.'
  if (!form.confirm) errors.confirm = 'Please confirm your password.'
  else if (form.confirm !== form.password) errors.confirm = 'Passwords do not match.'
  return Object.keys(errors).length === 0
}

async function submit() {
  formError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    await auth.register(form.name.trim(), form.email.trim(), form.password)
    router.push('/app/overview')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout title="Create your account" subtitle="Start organizing your studies in a minute.">
    <form class="space-y-5" novalidate @submit.prevent="submit">
      <div v-if="formError" class="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
        <TriangleAlert :size="18" class="mt-0.5 shrink-0" /> {{ formError }}
      </div>

      <div>
        <label for="reg-name" class="field-label">Full name</label>
        <input id="reg-name" v-model="form.name" type="text" autocomplete="name" placeholder="Alex Student" class="field" :aria-invalid="!!errors.name" />
        <p v-if="errors.name" class="mt-1 text-xs text-rose-600">{{ errors.name }}</p>
      </div>

      <div>
        <label for="reg-email" class="field-label">Email</label>
        <input id="reg-email" v-model="form.email" type="email" autocomplete="email" placeholder="you@school.com" class="field" :aria-invalid="!!errors.email" />
        <p v-if="errors.email" class="mt-1 text-xs text-rose-600">{{ errors.email }}</p>
      </div>

      <PasswordInput id="reg-password" v-model="form.password" label="Password" autocomplete="new-password" placeholder="At least 8 characters" :error="errors.password" />
      <PasswordInput id="reg-confirm" v-model="form.confirm" label="Confirm password" autocomplete="new-password" placeholder="Repeat your password" :error="errors.confirm" />

      <button type="submit" class="btn-primary w-full justify-center disabled:opacity-70" :disabled="loading">
        <LoaderCircle v-if="loading" :size="16" class="animate-spin" />
        {{ loading ? 'Creating account...' : 'Create account' }}
      </button>
    </form>

    <template #footer>
      Already have an account?
      <RouterLink to="/login" class="font-medium text-brand-600 hover:text-brand-700">Log in</RouterLink>
    </template>
  </AuthLayout>
</template>
