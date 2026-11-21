<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'

defineProps<{
  id: string
  label: string
  error?: string
  autocomplete?: string
  placeholder?: string
}>()

const model = defineModel<string>({ required: true })
const visible = ref(false)
</script>

<template>
  <div>
    <label :for="id" class="field-label">{{ label }}</label>
    <div class="relative">
      <input
        :id="id"
        v-model="model"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :aria-invalid="!!error"
        :aria-describedby="error ? id + '-error' : undefined"
        class="field pr-11"
      />
      <button
        type="button"
        class="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:text-ink"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" :size="18" />
        <Eye v-else :size="18" />
      </button>
    </div>
    <p v-if="error" :id="id + '-error'" class="mt-1 text-xs text-rose-600">{{ error }}</p>
  </div>
</template>
