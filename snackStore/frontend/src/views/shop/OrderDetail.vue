<template>
  <div v-if="order">
    <el-alert
      v-if="order.status === 4"
      title="该订单已取消"
      type="info"
      :closable="false"
      show-icon
      class="cancel-alert"
    />
    <el-card class="steps-card">
      <el-steps :active="order.status" align-center v-if="order.status !== 4">
        <el-step title="提交订单" />
        <el-step title="付款" />
        <el-step title="发货" />
        <el-step title="完成" />
      </el-steps>
    </el-card>

    <el-card>
      <template #header><span>订单信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[order.status].type">{{ statusMap[order.status].text }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ order.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ order.paymentTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ order.receiver }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ order.phone }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ order.address }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="items-card">
      <template #header><span>商品清单</span></template>
      <el-table :data="order.items">
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
          <template #default="{ row }">¥{{ row.subtotal }}</template>
        </el-table-column>
      </el-table>
      <div class="detail-footer">
        <span class="total-info">
          实付金额：<span class="total-price">¥{{ order.totalAmount }}</span>
        </span>
        <div class="actions">
          <el-button @click="router.back()">返回</el-button>
          <el-button v-if="order.status === 0" @click="cancel">取消订单</el-button>
          <el-button v-if="order.status === 0" type="primary" @click="pay">立即支付</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderApi, payOrderApi, cancelOrderApi } from '@/api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

const statusMap = {
  0: { text: '待付款', type: 'warning' },
  1: { text: '待发货', type: 'primary' },
  2: { text: '已发货', type: 'info' },
  3: { text: '已完成', type: 'success' },
  4: { text: '已取消', type: 'info' },
}

const order = ref(null)
const route = useRoute()
const router = useRouter()

async function load() {
  order.value = await getOrderApi(route.params.id)
}

async function pay() {
  await payOrderApi(order.value.id)
  ElMessage.success('支付成功')
  load()
}

async function cancel() {
  await ElMessageBox.confirm('确认取消该订单？', '提示', { type: 'warning' })
  await cancelOrderApi(order.value.id)
  ElMessage.success('已取消')
  load()
}

onMounted(load)
</script>

<style scoped>
.cancel-alert {
  margin-bottom: 16px;
}

.steps-card {
  margin-bottom: 16px;
}

.items-card {
  margin-top: 16px;
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

.detail-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.total-price {
  color: #f56c6c;
  font-size: 22px;
  font-weight: 700;
}
</style>
