<template>
  <div class="checkout">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>收货地址</span>
          <router-link to="/addresses">管理地址</router-link>
        </div>
      </template>
      <el-empty v-if="addresses.length === 0" description="还没有收货地址">
        <el-button type="primary" @click="router.push('/addresses')">去添加地址</el-button>
      </el-empty>
      <el-radio-group v-else v-model="addressId" class="addr-group">
        <el-radio v-for="a in addresses" :key="a.id" :value="a.id" class="addr-item">
          <div class="addr-line">
            <b>{{ a.receiver }}</b>
            <span>{{ a.phone }}</span>
            <el-tag v-if="a.isDefault === 1" size="small" type="danger">默认</el-tag>
          </div>
          <div class="addr-detail">{{ a.province }} {{ a.city }} {{ a.district }} {{ a.detail }}</div>
        </el-radio>
      </el-radio-group>
    </el-card>

    <el-card class="items-card">
      <template #header><span>商品清单</span></template>
      <el-table :data="items">
        <el-table-column label="商品" min-width="260">
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
        <el-table-column label="数量" width="100">
          <template #default="{ row }">× {{ row.quantity }}</template>
        </el-table-column>
        <el-table-column label="小计" width="120">
          <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
      <div class="checkout-footer">
        <span class="total-info">
          共 <b class="count">{{ items.length }}</b> 件，合计：
          <span class="total-price">¥{{ totalPrice }}</span>
        </span>
        <el-button type="danger" size="large" :loading="submitting" @click="submit">提交订单</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAddressesApi } from '@/api/address'
import { getCartApi } from '@/api/cart'
import { createOrderApi } from '@/api/order'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const addresses = ref([])
const items = ref([])
const addressId = ref(null)
const submitting = ref(false)
const router = useRouter()
const cartStore = useCartStore()

const totalPrice = computed(() =>
  items.value.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0).toFixed(2),
)

onMounted(async () => {
  const [addrList, cartItems] = await Promise.all([getAddressesApi(), getCartApi()])
  addresses.value = addrList
  items.value = cartItems.filter((i) => i.checked === 1)
  addressId.value = addrList.find((a) => a.isDefault === 1)?.id || addrList[0]?.id || null
})

async function submit() {
  if (!addressId.value) return ElMessage.warning('请先添加收货地址')
  submitting.value = true
  try {
    await createOrderApi({ addressId: addressId.value })
    ElMessage.success('下单成功')
    cartStore.refresh()
    router.push('/orders')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
}

.items-card {
  margin-top: 16px;
}

.addr-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.addr-item {
  height: auto;
  padding: 8px 0;
  margin-right: 0;
}

.addr-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.addr-detail {
  color: #999;
  font-size: 13px;
  margin-top: 4px;
}

.cart-product {
  display: flex;
  align-items: center;
  gap: 12px;
}

.thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  flex-shrink: 0;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #f5f5f5;
}

.checkout-footer {
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
