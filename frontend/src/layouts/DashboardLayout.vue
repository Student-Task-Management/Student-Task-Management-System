<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import AppTopbar from '../components/AppTopbar.vue'

const collapsed = ref(false)
const mobileOpen = ref(false)
</script>

<template>
  <div class="min-h-screen">
    <AppSidebar
      :collapsed="collapsed"
      :mobile-open="mobileOpen"
      @toggle="collapsed = !collapsed"
      @close="mobileOpen = false"
    />
    <div v-if="mobileOpen" class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" @click="mobileOpen = false"></div>

    <div :class="['transition-all duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-64']">
      <AppTopbar @open-menu="mobileOpen = true" />
      <main class="px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
