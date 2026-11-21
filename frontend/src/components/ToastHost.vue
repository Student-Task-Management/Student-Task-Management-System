<script setup lang="ts">
import { CircleCheck, TriangleAlert } from '@lucide/vue'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg"
      >
        <CircleCheck v-if="t.type === 'success'" :size="18" class="text-emerald-400" />
        <TriangleAlert v-else :size="18" class="text-amber-400" />
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>
