<script setup lang="ts">
import type { Priority } from '../types'

defineProps<{ priority: Priority }>()

const styles: Record<Priority, string> = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-emerald-50 text-emerald-700',
}
</script>

<template>
  <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles[priority]]">
    {{ priority }}
  </span>
</template>
