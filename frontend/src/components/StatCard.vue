<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: number | string
  hint: string
  icon: Component
  tone: 'indigo' | 'amber' | 'sky' | 'emerald'
}>()

const tones = {
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
  sky: 'bg-sky-50 text-sky-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}
</script>

<template>
  <div class="card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium text-muted">{{ label }}</p>
      <span :class="['grid h-10 w-10 place-items-center rounded-xl', tones[tone]]">
        <component :is="icon" :size="20" />
      </span>
    </div>
    <p class="mt-3 text-3xl font-bold tracking-tight">{{ value }}</p>
    <p class="mt-1 text-xs text-muted">{{ hint }}</p>
  </div>
</template>
