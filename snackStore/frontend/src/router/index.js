import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/login', component: () => import('@/views/shop/Login.vue') },
  { path: '/register', component: () => import('@/views/shop/Register.vue') },
  {
    path: '/',
    component: () => import('@/layouts/ShopLayout.vue'),
    children: [
      { path: '', component: () => import('@/views/shop/Home.vue') },
      { path: 'product/:id', component: () => import('@/views/shop/ProductDetail.vue') },
      { path: 'cart', component: () => import('@/views/shop/Cart.vue') },
      { path: 'checkout', component: () => import('@/views/shop/Checkout.vue') },
      { path: 'orders', component: () => import('@/views/shop/OrderList.vue') },
      { path: 'orders/:id', component: () => import('@/views/shop/OrderDetail.vue') },
      { path: 'profile', component: () => import('@/views/shop/Profile.vue') },
      { path: 'addresses', component: () => import('@/views/shop/AddressList.vue') },
    ],
  },
  { path: '/admin/login', component: () => import('@/views/admin/AdminLogin.vue') },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'products', component: () => import('@/views/admin/ProductManage.vue') },
      { path: 'categories', component: () => import('@/views/admin/CategoryManage.vue') },
      { path: 'orders', component: () => import('@/views/admin/OrderManage.vue') },
      { path: 'users', component: () => import('@/views/admin/UserManage.vue') },
    ],
  },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return '/admin/login'
  }
  if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    return '/'
  }
  return true
})

export default router
