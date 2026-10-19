<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value">{{ stats.todayOrderCount ?? '-' }}</div>
            <div class="stat-label">今日订单数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value">¥{{ stats.todaySales ?? '-' }}</div>
            <div class="stat-label">今日销售额</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value">{{ stats.pendingShipCount ?? '-' }}</div>
            <div class="stat-label">待发货订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalProducts ?? '-' }}</div>
            <div class="stat-label">商品总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card">
      <template #header><span>库存告警 TOP10</span></template>
      <el-empty v-if="!lowStock.length" description="暂无库存告警商品" />
      <div v-else ref="chartRef" class="chart"></div>
    </el-card>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, onMounted, ref } from 'vue'
import { getStatsApi } from '@/api/admin'

const stats = ref({})
const chartRef = ref()
const lowStock = computed(() => stats.value.lowStockProducts || [])

onMounted(async () => {
  stats.value = await getStatsApi()
  if (lowStock.value.length) {
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      title: { text: '库存告警 TOP10', left: 'center' },
      xAxis: { type: 'category', data: lowStock.value.map((p) => p.name) },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: lowStock.value.map((p) => p.stock),
          itemStyle: { color: '#f56c6c' },
        },
      ],
    })
  }
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 8px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #e6531f;
}

.stat-label {
  margin-top: 6px;
  color: #999;
  font-size: 13px;
}

.chart-card {
  margin-top: 16px;
}

.chart {
  height: 360px;
}
</style>
