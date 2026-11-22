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
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      redirect: '/admin/overview',
      children: [
        { path: 'overview', name: 'admin-overview', component: () => import('../pages/AdminOverviewPage.vue') },
        { path: 'users', name: 'admin-users', component: () => import('../pages/AdminUsersPage.vue') },
        { path: 'users/:id', name: 'admin-user-detail', component: () => import('../pages/AdminUserDetailPage.vue') },
        { path: 'tasks', name: 'admin-tasks', component: () => import('../pages/AdminTasksPage.vue') },
        { path: 'subjects', name: 'admin-subjects', component: () => import('../pages/AdminSubjectsPage.vue') },
      ],
    },
  ],
  scrollBehavior: (to) => (to.hash ? { el: to.hash, top: 80 } : { top: 0 }),
})

// Route guard: who may open which area
router.beforeEach((to) => {
  const auth = useAuthStore()
  const inStudentArea = to.path.startsWith('/app')
  const inAdminArea = to.path.startsWith('/admin')

  if ((inStudentArea || inAdminArea) && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (inAdminArea && !auth.isAdmin) return '/app/overview'
  if (inStudentArea && auth.isAdmin) return '/admin/overview'
  if ((to.path === '/login' || to.path === '/register') && auth.isLoggedIn) {
    return auth.isAdmin ? '/admin/overview' : '/app/overview'
  }
})

export default router
