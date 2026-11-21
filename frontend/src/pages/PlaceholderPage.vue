<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="card grid place-items-center p-16 text-center">
    <div>
      <h2 class="text-lg font-semibold">{{ route.meta.title }}</h2>
      <p class="mt-1 text-sm text-muted">This page is coming in a later step.</p>
    </div>
  </div>
</template>
