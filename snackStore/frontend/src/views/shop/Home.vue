<template>
  <div class="home">
    <div class="search-bar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索零食"
        clearable
        class="search-input"
        @keyup.enter="onSearch"
      >
        <template #append>
          <el-button @click="onSearch">搜索</el-button>
        </template>
      </el-input>
    </div>
    <div class="filter-row">
      <el-radio-group v-model="activeCategory" @change="onCategory">
        <el-radio-button :value="null">全部</el-radio-button>
        <el-radio-button v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</el-radio-button>
      </el-radio-group>
      <el-select v-model="query.sort" style="width: 160px" @change="onSearch">
        <el-option label="综合排序" value="default" />
        <el-option label="销量优先" value="sales_desc" />
        <el-option label="价格从低到高" value="price_asc" />
        <el-option label="价格从高到低" value="price_desc" />
      </el-select>
    </div>
    <el-empty v-if="products.length === 0" description="暂无商品" />
    <el-row v-else :gutter="16">
      <el-col v-for="p in products" :key="p.id" :span="6" class="product-col">
        <ProductCard :product="p" />
      </el-col>
    </el-row>
    <div v-if="total > query.size" class="pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="query.size"
        :current-page="query.page"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getCategoriesApi, getProductsApi } from '@/api/product'
import ProductCard from '@/components/ProductCard.vue'

const categories = ref([])
const products = ref([])
const total = ref(0)
const activeCategory = ref(null)
const query = reactive({ page: 1, size: 12, categoryId: null, keyword: '', sort: 'default' })

async function load() {
  const data = await getProductsApi({
    page: query.page,
    size: query.size,
    categoryId: query.categoryId || undefined,
    keyword: query.keyword || undefined,
    sort: query.sort === 'default' ? undefined : query.sort,
  })
  products.value = data.records
  total.value = data.total
}

function onSearch() {
  query.page = 1
  load()
}

function onCategory(catId) {
  query.categoryId = catId
  query.page = 1
  load()
}

function onPageChange(page) {
  query.page = page
  load()
}

onMounted(async () => {
  categories.value = await getCategoriesApi()
  load()
})
</script>

<style scoped>
.search-bar {
  display: flex;
  justify-content: center;
  margin: 8px 0 16px;
}

.search-input {
  width: 480px;
  max-width: 100%;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.product-col {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin: 8px 0 24px;
}
</style>
