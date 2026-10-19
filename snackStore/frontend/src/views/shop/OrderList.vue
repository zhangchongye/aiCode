<template>
  <div class="order-list">
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待付款" name="0" />
      <el-tab-pane label="待发货" name="1" />
      <el-tab-pane label="已发货" name="2" />
      <el-tab-pane label="已完成" name="3" />
      <el-tab-pane label="已取消" name="4" />
    </el-tabs>

    <el-empty v-if="orders.length === 0" description="暂无订单" />
    <template v-else>
      <el-card v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-head">
          <div class="order-meta">
            <span class="order-no">订单号：{{ order.orderNo }}</span>
            <span class="order-time">{{ order.createdAt }}</span>
          </div>
          <el-tag :type="statusMap[order.status].type">{{ statusMap[order.status].text }}</el-tag>
        </div>
        <div class="order-body">
          <div class="order-amount">
            实付金额 <span class="total-price">¥{{ order.totalAmount }}</span>
          </div>
          <div class="order-actions">
            <el-button size="small" @click="router.push(`/orders/${order.id}`)">查看详情</el-button>
            <el-button v-if="order.status === 0" size="small" type="primary" @click="pay(order)">支付</el-button>
            <el-button v-if="order.status === 0" size="small" @click="cancel(order)">取消订单</el-button>
          </div>
        </div>
      </el-card>
      <div v-if="total > query.size" class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="total"
          :page-size="query.size"
          :current-page="query.page"
          @current-change="onPageChange"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getOrdersApi, payOrderApi, cancelOrderApi } from '@/api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

const statusMap = {
  0: { text: '待付款', type: 'warning' },
  1: { text: '待发货', type: 'primary' },
  2: { text: '已发货', type: 'info' },
  3: { text: '已完成', type: 'success' },
  4: { text: '已取消', type: 'info' },
}

const orders = ref([])
const total = ref(0)
const activeTab = ref('all')
const router = useRouter()
const query = reactive({ page: 1, size: 10 })

async function load() {
  const data = await getOrdersApi({
    page: query.page,
    size: query.size,
    status: activeTab.value === 'all' ? undefined : activeTab.value,
  })
  orders.value = data.records
  total.value = data.total
}

function onTabChange() {
  query.page = 1
  load()
}

function onPageChange(page) {
  query.page = page
  load()
}

async function pay(order) {
  await payOrderApi(order.id)
  ElMessage.success('支付成功')
  load()
}

async function cancel(order) {
  await ElMessageBox.confirm('确认取消该订单？', '提示', { type: 'warning' })
  await cancelOrderApi(order.id)
  ElMessage.success('已取消')
  load()
}

onMounted(load)
</script>

<style scoped>
.order-card {
  margin-bottom: 16px;
}

.order-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.order-meta {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 13px;
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.total-price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: 700;
}

.pagination {
  display: flex;
  justify-content: center;
  margin: 8px 0 16px;
}
</style>
