import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录 - TaskHub', requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    // 路由元信息 meta：用来存放自定义数据
    meta: {
      title: '我的工作台',
      requiresAuth: true,
      breadcrumb: '首页'
    }
  }
]
const router = createRouter({
  history: import.meta.env.VITE_PAGES === 'true'
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes
})
router.beforeEach((to) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true'
  if (to.meta.requiresAuth && !isAuthenticated) return '/login'
  if (to.path === '/login' && isAuthenticated) return '/'
})
export default router
