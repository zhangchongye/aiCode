<template>
  <div>
    <el-card>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索商品名" clearable class="kw-input" @keyup.enter="onSearch" />
        <el-select v-model="query.status" placeholder="状态" clearable class="status-select" @change="onSearch">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <el-button type="success" @click="openCreate">新增商品</el-button>
      </div>

      <el-table :data="products" v-loading="loading">
        <el-table-column label="图片" width="90">
          <template #default="{ row }">
            <el-image :src="row.image" fit="cover" class="thumb">
              <template #error><div class="thumb-placeholder">🍿</div></template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100" />
        <el-table-column prop="stock" label="库存" width="90" />
        <el-table-column prop="sales" label="销量" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => toggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑商品' : '新增商品'" width="560px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" class="full">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          <span class="status-hint">{{ form.status === 1 ? '上架' : '下架' }}</span>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onFileChange">
            <img v-if="form.image" :src="form.image" class="upload-preview" />
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  adminGetProductsApi,
  adminCreateProductApi,
  adminUpdateProductApi,
  adminUpdateProductStatusApi,
  adminDeleteProductApi,
  adminGetCategoriesApi,
  uploadImageApi,
} from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const products = ref([])
const categories = ref([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formRef = ref()
const query = reactive({ page: 1, size: 10, keyword: '', status: null })
const form = reactive({
  name: '',
  categoryId: null,
  price: 1,
  stock: 0,
  status: 1,
  description: '',
  image: '',
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
}

function categoryName(id) {
  return categories.value.find((c) => c.id === id)?.name || '-'
}

async function load() {
  loading.value = true
  try {
    const data = await adminGetProductsApi({
      page: query.page,
      size: query.size,
      keyword: query.keyword || undefined,
      status: query.status ?? undefined,
    })
    products.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  query.page = 1
  load()
}

function onPageChange(page) {
  query.page = page
  load()
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    name: '',
    categoryId: null,
    price: 1,
    stock: 0,
    status: 1,
    description: '',
    image: '',
  })
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    categoryId: row.categoryId,
    price: Number(row.price),
    stock: row.stock,
    status: row.status,
    description: row.description,
    image: row.image,
  })
  dialogVisible.value = true
}

async function save() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = { ...form }
    if (editingId.value) await adminUpdateProductApi(editingId.value, payload)
    else await adminCreateProductApi(payload)
    ElMessage.success('已保存')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row, val) {
  await adminUpdateProductStatusApi(row.id, { status: val })
  ElMessage.success(val === 1 ? '已上架' : '已下架')
  load()
}

async function remove(row) {
  await ElMessageBox.confirm(`确认删除商品「${row.name}」？`, '提示', { type: 'warning' })
  await adminDeleteProductApi(row.id)
  ElMessage.success('已删除')
  load()
}

async function onFileChange(file) {
  const url = await uploadImageApi(file.raw)
  form.image = url
  ElMessage.success('图片上传成功')
}

onMounted(async () => {
  categories.value = await adminGetCategoriesApi()
  load()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.kw-input {
  width: 220px;
}

.status-select {
  width: 120px;
}

.thumb {
  width: 56px;
  height: 56px;
  border-radius: 6px;
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.full {
  width: 100%;
}

.status-hint {
  margin-left: 8px;
  color: #999;
}

.upload-preview {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  object-fit: cover;
}

.upload-icon {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #ccc;
  border-radius: 6px;
  font-size: 24px;
  color: #999;
}
</style>
