<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'

defineProps<{ open: boolean; title: string; message: string; confirmText?: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Transition name="overlay">
    <div
      v-if="open"
      class="fixed inset-0 z-[55] grid place-items-center bg-slate-900/40 p-4"
      @click.self="emit('cancel')"
      @keydown.esc="emit('cancel')"
    >
      <div class="card w-full max-w-sm p-6" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <span class="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
          <TriangleAlert :size="22" />
        </span>
        <h2 id="confirm-title" class="mt-4 text-lg font-semibold">{{ title }}</h2>
        <p class="mt-1 text-sm text-muted">{{ message }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button class="btn-ghost border border-slate-200 bg-white" @click="emit('cancel')">Cancel</button>
          <button
            class="inline-flex items-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            @click="emit('confirm')"
          >
            {{ confirmText ?? 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
