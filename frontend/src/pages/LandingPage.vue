<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import AppLogo from '../components/AppLogo.vue'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-brand-50/60 to-canvas">
    <header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <AppLogo />
      <nav class="hidden gap-8 text-sm font-medium text-muted md:flex" aria-label="Main">
        <a href="#features" class="hover:text-ink">Features</a>
        <a href="#how" class="hover:text-ink">How it works</a>
      </nav>
      <div class="flex items-center gap-2">
        <RouterLink to="/login" class="btn-ghost">Log in</RouterLink>
        <RouterLink to="/register" class="btn-primary">Get Started</RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-6 pb-24 pt-20 text-center">
      <span class="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
        Built for students
      </span>
      <h1 class="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
        Study Smarter. Stay Organized. <span class="text-brand-600">Achieve More.</span>
      </h1>
      <p class="mx-auto mt-5 max-w-2xl text-lg text-muted">
        Your academic life, organized in one place. Manage assignments, track deadlines,
        and make every study session count.
      </p>
      <div class="mt-9 flex justify-center gap-3">
        <RouterLink to="/register" class="btn-primary">Get Started <ArrowRight :size="16" /></RouterLink>
        <a href="#how" class="btn-ghost border border-slate-200 bg-white">See how it works</a>
      </div>
    </main>
  </div>
</template>
