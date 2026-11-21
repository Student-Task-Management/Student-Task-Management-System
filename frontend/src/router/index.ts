import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('../pages/LandingPage.vue') },
    { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue') },
    { path: '/register', name: 'register', component: () => import('../pages/RegisterPage.vue') },
    { path: '/forgot-password', name: 'forgot-password', component: () => import('../pages/ForgotPasswordPage.vue') },
    {
      path: '/app',
      component: () => import('../layouts/DashboardLayout.vue'),
      redirect: '/app/overview',
      children: [
        { path: 'overview', name: 'overview', component: () => import('../pages/OverviewPage.vue'), meta: { title: 'Overview' } },
        { path: 'tasks', name: 'tasks', component: () => import('../pages/TasksPage.vue'), meta: { title: 'My Tasks' } },
        { path: 'calendar', name: 'calendar', component: () => import('../pages/CalendarPage.vue'), meta: { title: 'Calendar' } },
        { path: 'subjects', name: 'subjects', component: () => import('../pages/SubjectsPage.vue'), meta: { title: 'Subjects' } },
        { path: 'analytics', name: 'analytics', component: () => import('../pages/AnalyticsPage.vue'), meta: { title: 'Analytics' } },
        { path: 'settings', name: 'settings', component: () => import('../pages/SettingsPage.vue'), meta: { title: 'Settings' } },
      ],
    },
  ],
  scrollBehavior: (to) => (to.hash ? { el: to.hash, top: 80 } : { top: 0 }),
})

// Route guard: dashboard pages need a login, login/register skip if already logged in
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path.startsWith('/app') && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if ((to.path === '/login' || to.path === '/register') && auth.isLoggedIn) {
    return '/app/overview'
  }
})

export default router
