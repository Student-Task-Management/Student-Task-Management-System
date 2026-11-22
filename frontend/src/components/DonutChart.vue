<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  items: { label: string; value: number; color: string }[]
  centerLabel?: string
}>()

const total = computed(() => props.items.reduce((sum, i) => sum + i.value, 0))
const percent = (v: number) => (total.value === 0 ? 0 : Math.round((v / total.value) * 100))

const gradient = computed(() => {
  if (total.value === 0) return 'conic-gradient(#e2e8f0 0 100%)'
  let acc = 0
  const stops = props.items
    .filter((i) => i.value > 0)
    .map((i) => {
      const start = acc
      acc += (i.value / total.value) * 100
      return `${i.color} ${start}% ${acc}%`
    })
  return `conic-gradient(${stops.join(', ')})`
})
</script>

<template>
  <div class="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
    <div
      class="relative h-36 w-36 shrink-0 rounded-full"
      :style="{ background: gradient }"
      role="img"
      :aria-label="`${centerLabel ?? 'Total'}: ${total}`"
    >
      <div class="absolute inset-5 grid place-items-center rounded-full bg-white">
        <div class="text-center">
          <p class="text-2xl font-bold">{{ total }}</p>
          <p class="text-xs text-muted">{{ centerLabel ?? 'total' }}</p>
        </div>
      </div>
    </div>
    <ul class="w-full space-y-2.5">
      <li v-for="i in items" :key="i.label" class="flex items-center justify-between gap-3 text-sm">
        <span class="flex min-w-0 items-center gap-2">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: i.color }"></span>
          <span class="truncate">{{ i.label }}</span>
        </span>
        <span class="shrink-0 text-muted">{{ i.value }} ({{ percent(i.value) }}%)</span>
      </li>
    </ul>
  </div>
</template>
