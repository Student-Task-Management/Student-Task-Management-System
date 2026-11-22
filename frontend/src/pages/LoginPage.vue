<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LoaderCircle, TriangleAlert } from '@lucide/vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import PasswordInput from '../components/PasswordInput.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '', remember: false })
const errors = reactive<Record<string, string>>({})
const loading = ref(false)
const formError = ref(route.query.expired ? 'Your session expired. Please log in again.' : '')
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!emailPattern.test(form.email.trim())) errors.email = 'Please enter a valid email address.'
  if (!form.password) errors.password = 'Password is required.'
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'
  return Object.keys(errors).length === 0
}

async function submit() {
  formError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    await auth.login(form.email.trim(), form.password, form.remember)
    const redirect = route.query.redirect
    if (auth.isAdmin) router.push('/admin/overview')
    else router.push(typeof redirect === 'string' && redirect.startsWith('/app') ? redirect : '/app/overview')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout title="Welcome back" subtitle="Log in to continue to your StudyFlow dashboard.">
    <form class="space-y-5" novalidate @submit.prevent="submit">
      <div v-if="formError" class="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
        <TriangleAlert :size="18" class="mt-0.5 shrink-0" /> {{ formError }}
      </div>

      <div>
        <label for="login-email" class="field-label">Email</label>
        <input
          id="login-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="you@school.com"
          class="field"
          :aria-invalid="!!errors.email"
        />
        <p v-if="errors.email" class="mt-1 text-xs text-rose-600">{{ errors.email }}</p>
      </div>

      <PasswordInput id="login-password" v-model="form.password" label="Password" autocomplete="current-password" placeholder="Your password" :error="errors.password" />

      <div class="flex items-center justify-between text-sm">
        <label class="flex items-center gap-2">
          <input v-model="form.remember" type="checkbox" class="h-4 w-4 rounded accent-brand-600" />
          Remember me
        </label>
        <RouterLink to="/forgot-password" class="font-medium text-brand-600 hover:text-brand-700">Forgot password?</RouterLink>
      </div>

      <button type="submit" class="btn-primary w-full justify-center disabled:opacity-70" :disabled="loading">
        <LoaderCircle v-if="loading" :size="16" class="animate-spin" />
        {{ loading ? 'Logging in...' : 'Log in' }}
      </button>
    </form>

    <template #footer>
      Don't have an account?
      <RouterLink to="/register" class="font-medium text-brand-600 hover:text-brand-700">Create one</RouterLink>
    </template>
  </AuthLayout>
</template>
