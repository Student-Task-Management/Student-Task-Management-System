<script setup lang="ts">
import { ref } from 'vue'
import { LoaderCircle, MailCheck, ArrowLeft } from '@lucide/vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const email = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function submit() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = 'Email is required.'
    return
  }
  if (!emailPattern.test(email.value.trim())) {
    error.value = 'Please enter a valid email address.'
    return
  }
  loading.value = true
  try {
    await auth.requestPasswordReset(email.value.trim())
    sent.value = true
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout title="Forgot your password?" subtitle="Enter your email and we will send you a reset link.">
    <div v-if="sent" class="rounded-2xl bg-emerald-50 p-6 text-center">
      <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-600"><MailCheck :size="24" /></span>
      <h2 class="mt-3 font-semibold">Check your email</h2>
      <p class="mt-1 text-sm text-muted">If an account exists for {{ email }}, a reset link is on its way.</p>
    </div>

    <form v-else class="space-y-5" novalidate @submit.prevent="submit">
      <div>
        <label for="forgot-email" class="field-label">Email</label>
        <input id="forgot-email" v-model="email" type="email" autocomplete="email" placeholder="you@school.com" class="field" :aria-invalid="!!error" />
        <p v-if="error" class="mt-1 text-xs text-rose-600">{{ error }}</p>
      </div>

      <button type="submit" class="btn-primary w-full justify-center disabled:opacity-70" :disabled="loading">
        <LoaderCircle v-if="loading" :size="16" class="animate-spin" />
        {{ loading ? 'Sending...' : 'Send reset link' }}
      </button>
    </form>

    <template #footer>
      <RouterLink to="/login" class="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-700">
        <ArrowLeft :size="16" /> Back to log in
      </RouterLink>
    </template>
  </AuthLayout>
</template>
