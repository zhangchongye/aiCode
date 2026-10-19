<template>
  <div>
    <header class="shop-header">
      <div class="container header-inner">
        <router-link to="/" class="logo">零食铺子</router-link>
        <div class="header-actions">
          <router-link to="/cart" class="cart-link">
            <el-badge :value="cartCount" :hidden="cartCount === 0">
              <el-icon :size="22"><ShoppingCart /></el-icon>
            </el-badge>
          </router-link>
          <template v-if="userStore.isLoggedIn">
            <el-dropdown>
              <span class="nickname">{{ userStore.userInfo?.nickname }}</span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/orders')">我的订单</el-dropdown-item>
                  <el-dropdown-item @click="router.push('/addresses')">收货地址</el-dropdown-item>
                  <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" @click="router.push('/admin')">管理后台</el-dropdown-item>
                  <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <router-link v-else to="/login">登录 / 注册</router-link>
        </div>
      </div>
    </header>
    <main class="container">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const cartCount = computed(() => cartStore.count)

onMounted(() => {
  if (userStore.isLoggedIn) cartStore.refresh()
})

function logout() {
  userStore.logout()
  cartStore.reset()
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>

<style scoped>
.shop-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.header-inner {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  color: #e6531f;
  text-decoration: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.cart-link {
  color: #333;
  display: flex;
  align-items: center;
}

.nickname {
  cursor: pointer;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}
</style>
