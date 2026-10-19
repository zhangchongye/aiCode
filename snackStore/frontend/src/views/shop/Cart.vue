<template>
  <el-card>
    <h2 class="title">购物车</h2>
    <el-empty v-if="items.length === 0" description="购物车还是空的，去逛逛吧">
      <el-button type="primary" @click="router.push('/')">去逛逛</el-button>
    </el-empty>
    <template v-else>
      <el-table :data="items">
        <el-table-column width="50">
          <template #default="{ row }">
            <el-checkbox v-model="row.checked" @change="onCheckChange(row)" />
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="280">
          <template #default="{ row }">
            <div class="cart-product">
              <el-image :src="row.productImage" fit="cover" class="thumb">
                <template #error><div class="thumb-placeholder">🍿</div></template>
              </el-image>
              <span>{{ row.productName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="120">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="数量" width="180">
          <template #default="{ row }">
            <el-input-number
              v-model="row.quantity"
              :min="1"
              :max="row.stock"
              size="small"
              @change="onQuantityChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="120">
          <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="danger" @click="removeItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="cart-footer">
        <span class="total-info">
          已选 <b class="count">{{ checkedItems.length }}</b> 件，合计：
          <span class="total-price">¥{{ totalPrice }}</span>
        </span>
        <el-button type="danger" size="large" @click="checkout">去结算</el-button>
      </div>
    </template>
  </el-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCartApi, updateCartApi, deleteCartApi } from '@/api/cart'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const items = ref([])
const cartStore = useCartStore()
const router = useRouter()

async function load() {
  const data = await getCartApi()
  // 后端 checked 是 0/1，归一化为 boolean 供 el-checkbox 使用
  items.value = data.map((i) => ({ ...i, checked: i.checked === 1 }))
}

const checkedItems = computed(() => items.value.filter((i) => i.checked))
const totalPrice = computed(() =>
  checkedItems.value.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0).toFixed(2),
)

async function onQuantityChange(item) {
  await updateCartApi(item.id, { quantity: item.quantity })
  cartStore.refresh()
}

async function onCheckChange(item) {
  await updateCartApi(item.id, { checked: item.checked ? 1 : 0 })
  cartStore.refresh()
}

async function removeItem(item) {
  await deleteCartApi(item.id)
  ElMessage.success('已删除')
  load()
  cartStore.refresh()
}

function checkout() {
  if (checkedItems.value.length === 0) return ElMessage.warning('请先选择商品')
  router.push('/checkout')
}

onMounted(load)
</script>

<style scoped>
.title {
  margin: 0 0 16px;
}

.cart-product {
  display: flex;
  align-items: center;
  gap: 12px;
}

.thumb {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  flex-shrink: 0;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: #f5f5f5;
}

.cart-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.count {
  color: #f56c6c;
}

.total-price {
  color: #f56c6c;
  font-size: 22px;
  font-weight: 700;
}
</style>
