<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: { label: string; completed: number; pending: number }[]
}>()

const max = computed(() => Math.max(1, ...props.data.flatMap((d) => [d.completed, d.pending])))
const height = (v: number) => (v === 0 ? '0%' : `${Math.max((v / max.value) * 100, 8)}%`)
</script>

<template>
  <div>
    <div class="mb-5 flex gap-4 text-xs text-muted">
      <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-brand-600"></span>Completed</span>
      <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-brand-100"></span>Pending</span>
    </div>
    <div class="flex items-end gap-2 sm:gap-4">
      <div
        v-for="d in data"
        :key="d.label"
        tabindex="0"
        class="group relative flex flex-1 flex-col items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        :aria-label="`${d.label}: ${d.completed} completed, ${d.pending} pending`"
      >
        <div class="pointer-events-none absolute -top-9 z-10 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs text-white shadow-lg group-hover:block group-focus:block">
          {{ d.completed }} done, {{ d.pending }} pending
        </div>
        <div class="flex h-44 w-full items-end justify-center gap-1">
          <div class="w-full max-w-5 rounded-t-md bg-brand-600 transition-all duration-500" :style="{ height: height(d.completed) }"></div>
          <div class="w-full max-w-5 rounded-t-md bg-brand-100 transition-all duration-500" :style="{ height: height(d.pending) }"></div>
        </div>
        <span class="text-xs text-muted">{{ d.label }}</span>
      </div>
    </div>
  </div>
</template>
