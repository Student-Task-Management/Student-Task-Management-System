import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('../pages/LandingPage.vue') },
    {
      path: '/app',
      component: () => import('../layouts/DashboardLayout.vue'),
      redirect: '/app/overview',
      children: [
        { path: 'overview', name: 'overview', component: () => import('../pages/OverviewPage.vue'), meta: { title: 'Overview' } },
        { path: 'tasks', name: 'tasks', component: () => import('../pages/PlaceholderPage.vue'), meta: { title: 'My Tasks' } },
        { path: 'calendar', name: 'calendar', component: () => import('../pages/PlaceholderPage.vue'), meta: { title: 'Calendar' } },
        { path: 'subjects', name: 'subjects', component: () => import('../pages/PlaceholderPage.vue'), meta: { title: 'Subjects' } },
        { path: 'analytics', name: 'analytics', component: () => import('../pages/PlaceholderPage.vue'), meta: { title: 'Analytics' } },
        { path: 'settings', name: 'settings', component: () => import('../pages/PlaceholderPage.vue'), meta: { title: 'Settings' } },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
