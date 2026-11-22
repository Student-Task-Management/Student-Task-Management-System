<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

defineProps<{ size?: string }>()
const auth = useAuthStore()
</script>

<template>
  <img v-if="auth.user.avatar" :src="auth.user.avatar" alt="" class="rounded-full object-cover" :class="size ?? 'h-9 w-9'" />
  <span v-else class="grid place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700" :class="size ?? 'h-9 w-9'">{{ auth.initials }}</span>
</template>