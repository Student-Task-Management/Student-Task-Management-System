import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('../pages/LandingPage.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
