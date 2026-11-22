<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  labels: string[]
  series: { name: string; color: string; values: number[] }[]
}>()

const max = computed(() => Math.max(1, ...props.series.flatMap((s) => s.values)))
const hasData = computed(() => props.series.some((s) => s.values.some((v) => v > 0)))
const barHeight = (v: number) => (v === 0 ? '0%' : `${Math.max((v / max.value) * 100, 6)}%`)
const describe = (label: string, i: number) =>
  `${label}: ` + props.series.map((s) => `${s.values[i] ?? 0} ${s.name}`).join(', ')
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap gap-4 text-xs text-muted">
      <span v-for="s in series" :key="s.name" class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: s.color }"></span>{{ s.name }}
      </span>
    </div>

    <div class="relative">
      <p v-if="!hasData" class="pointer-events-none absolute inset-x-0 top-1/3 text-center text-sm text-muted">
        No activity in this period
      </p>
      <div class="flex items-end gap-1 sm:gap-2">
        <div
          v-for="(label, i) in labels"
          :key="label + i"
          tabindex="0"
          class="group relative flex min-w-0 flex-1 flex-col items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          :aria-label="describe(label, i)"
        >
          <div class="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-canvas shadow-lg group-hover:block group-focus:block">
            <p class="font-medium">{{ label }}</p>
            <p v-for="s in series" :key="s.name">{{ s.name }}: {{ s.values[i] ?? 0 }}</p>
          </div>
          <div class="flex h-40 w-full items-end justify-center gap-0.5">
            <div
              v-for="s in series"
              :key="s.name"
              class="w-full max-w-4 rounded-t-md transition-all duration-500"
              :style="{ height: barHeight(s.values[i] ?? 0), backgroundColor: s.color }"
            ></div>
          </div>
          <span :class="['whitespace-nowrap text-[10px] text-muted sm:text-[11px]', i % 2 === 1 ? 'hidden sm:block' : '']">{{ label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
