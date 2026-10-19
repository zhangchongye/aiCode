<template>
  <div v-if="product" class="detail">
    <el-card>
      <el-row :gutter="32">
        <el-col :span="10">
          <el-image :src="product.image" fit="cover" class="detail-img">
            <template #error>
              <div class="img-placeholder">🍿</div>
            </template>
          </el-image>
        </el-col>
        <el-col :span="14">
          <h2 class="name">{{ product.name }}</h2>
          <div class="price">¥{{ product.price }}</div>
          <div class="meta">
            <span>销量 {{ product.sales }}</span>
            <span>库存 {{ product.stock }}</span>
          </div>
          <p class="desc">{{ product.description }}</p>
          <div class="buy-row">
            <el-input-number
              v-model="quantity"
              :min="1"
              :max="Math.max(product.stock, 1)"
              :disabled="product.stock === 0"
            />
            <el-button type="danger" size="large" :disabled="product.stock === 0" @click="addToCart">
              {{ product.stock === 0 ? '已售罄' : '加入购物车' }}
            </el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductApi } from '@/api/product'
import { addToCartApi } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const product = ref(null)
const quantity = ref(1)

onMounted(async () => {
  product.value = await getProductApi(route.params.id)
})

async function addToCart() {
  if (!userStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  await addToCartApi({ productId: product.value.id, quantity: quantity.value })
  ElMessage.success('已加入购物车')
  cartStore.refresh()
}
</script>

<style scoped>
.detail-img {
  width: 100%;
  height: 360px;
  border-radius: 8px;
}

.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  background: #f5f5f5;
}

.name {
  margin: 0 0 12px;
}

.price {
  color: #f56c6c;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
}

.meta {
  display: flex;
  gap: 24px;
  color: #999;
  font-size: 13px;
  margin-bottom: 16px;
}

.desc {
  color: #666;
  line-height: 1.6;
  margin-bottom: 24px;
}

.buy-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
