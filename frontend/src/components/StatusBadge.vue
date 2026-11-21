<script setup lang="ts">
import type { Status } from '../types'

defineProps<{ status: Status }>()

const styles: Record<Status, string> = {
  Pending: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-sky-50 text-sky-700',
  Completed: 'bg-emerald-50 text-emerald-700',
}
</script>

<template>
  <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles[status]]">
    {{ status }}
  </span>
</template>
