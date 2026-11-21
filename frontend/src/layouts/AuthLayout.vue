<script setup lang="ts">
import { CircleCheck } from '@lucide/vue'
import AppLogo from '../components/AppLogo.vue'

defineProps<{ title: string; subtitle: string }>()

const points = [
  'Track every assignment and deadline',
  'See your progress with clear analytics',
  'Organize tasks by subject and priority',
]
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <aside class="hidden flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-700 p-12 text-white lg:flex">
      <RouterLink to="/" class="w-fit" aria-label="StudyFlow home"><AppLogo /></RouterLink>
      <div>
        <h2 class="text-3xl font-bold leading-tight tracking-tight">Your academic life, organized in one place.</h2>
        <ul class="mt-8 space-y-3">
          <li v-for="p in points" :key="p" class="flex items-center gap-3 text-brand-100">
            <CircleCheck :size="20" class="shrink-0" /> {{ p }}
          </li>
        </ul>
      </div>
      <p class="text-sm text-brand-100">Study Smarter. Stay Organized. Achieve More.</p>
    </aside>

    <main class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-md">
        <RouterLink to="/" class="mb-8 inline-block lg:hidden" aria-label="StudyFlow home"><AppLogo /></RouterLink>
        <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p class="mt-1.5 text-sm text-muted">{{ subtitle }}</p>
        <div class="mt-8"><slot /></div>
        <div class="mt-6 text-center text-sm text-muted"><slot name="footer" /></div>
      </div>
    </main>
  </div>
</template>
