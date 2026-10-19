<template>
  <router-link :to="`/product/${product.id}`" class="product-card">
    <el-image :src="product.image" fit="cover" class="product-img">
      <template #error>
        <div class="img-placeholder">🍿</div>
      </template>
    </el-image>
    <div class="product-info">
      <div class="product-name">{{ product.name }}</div>
      <div class="product-bottom">
        <span class="product-price">¥{{ product.price }}</span>
        <span class="product-sales">已售 {{ product.sales }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
defineProps({ product: { type: Object, required: true } })
</script>

<style scoped>
.product-card { display: block; border: 1px solid #eee; border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; background: #fff; transition: box-shadow 0.2s; }
.product-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.product-img { width: 100%; height: 180px; }
.img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; background: #f5f5f5; }
.product-info { padding: 10px; }
.product-name { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-bottom { display: flex; justify-content: space-between; margin-top: 8px; }
.product-price { color: #f56c6c; font-weight: bold; }
.product-sales { color: #999; font-size: 12px; }
</style>
