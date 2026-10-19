<template>
  <div>
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待付款" name="0" />
        <el-tab-pane label="待发货" name="1" />
        <el-tab-pane label="已发货" name="2" />
        <el-tab-pane label="已完成" name="3" />
        <el-tab-pane label="已取消" name="4" />
      </el-tabs>

      <el-table :data="orders" v-loading="loading">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-box">
              <p>收货地址：{{ row.address }}</p>
              <p>支付时间：{{ row.paymentTime || '-' }}</p>
              <p>下单时间：{{ row.createdAt }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="190" />
        <el-table-column prop="receiver" label="收货人" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="totalAmount" label="金额" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status].type">{{ statusMap[row.status].text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="170" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" size="small" type="primary" @click="ship(row)">发货</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="total"
          :page-size="query.size"
          :current-page="query.page"
          @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { adminGetOrdersApi, shipOrderApi } from '@/api/admin'
import { ElMessage } from 'element-plus'

const statusMap = {
  0: { text: '待付款', type: 'warning' },
  1: { text: '待发货', type: 'primary' },
  2: { text: '已发货', type: 'info' },
  3: { text: '已完成', type: 'success' },
  4: { text: '已取消', type: 'info' },
}

const orders = ref([])
const total = ref(0)
const loading = ref(false)
const activeTab = ref('all')
const query = reactive({ page: 1, size: 10 })

async function load() {
  loading.value = true
  try {
    const data = await adminGetOrdersApi({
      page: query.page,
      size: query.size,
      status: activeTab.value === 'all' ? undefined : activeTab.value,
    })
    orders.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  query.page = 1
  load()
}

function onPageChange(page) {
  query.page = page
  load()
}

async function ship(row) {
  await shipOrderApi(row.id)
  ElMessage.success('已发货')
  load()
}

onMounted(load)
</script>

<style scoped>
.expand-box {
  padding: 0 48px;
  color: #666;
  font-size: 13px;
}

.expand-box p {
  margin: 6px 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
