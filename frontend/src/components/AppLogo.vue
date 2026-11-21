<script setup lang="ts">
import { GraduationCap } from '@lucide/vue'
</script>

<template>
  <div class="flex items-center gap-2.5">
    <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
      <GraduationCap :size="20" />
    </span>
    <span class="text-lg font-bold tracking-tight">StudyFlow</span>
  </div>
</template>
