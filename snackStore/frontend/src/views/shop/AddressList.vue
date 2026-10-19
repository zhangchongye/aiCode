<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>收货地址</span>
          <el-button type="primary" @click="openCreate">新增地址</el-button>
        </div>
      </template>

      <el-empty v-if="addresses.length === 0" description="还没有收货地址" />
      <div v-else class="addr-list">
        <div v-for="addr in addresses" :key="addr.id" class="addr-card">
          <div class="addr-line">
            <b>{{ addr.receiver }}</b>
            <span>{{ addr.phone }}</span>
            <el-tag v-if="addr.isDefault === 1" size="small" type="danger">默认</el-tag>
          </div>
          <div class="addr-detail">{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}</div>
          <div class="addr-actions">
            <el-button v-if="addr.isDefault !== 1" size="small" @click="setDefault(addr)">设为默认</el-button>
            <el-button size="small" @click="openEdit(addr)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(addr)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑地址' : '新增地址'" width="480px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="收货人" prop="receiver">
          <el-input v-model="form.receiver" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="省市区" prop="province">
          <div class="region-row">
            <el-input v-model="form.province" placeholder="省" />
            <el-input v-model="form.city" placeholder="市" />
            <el-input v-model="form.district" placeholder="区" />
          </div>
        </el-form-item>
        <el-form-item label="详细地址" prop="detail">
          <el-input v-model="form.detail" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
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
  getAddressesApi,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
} from '@/api/address'
import { ElMessage, ElMessageBox } from 'element-plus'

const addresses = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formRef = ref()
const form = reactive({ receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: 0 })

const rules = {
  receiver: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
}

async function load() {
  addresses.value = await getAddressesApi()
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: 0 })
  dialogVisible.value = true
}

function openEdit(addr) {
  editingId.value = addr.id
  Object.assign(form, {
    receiver: addr.receiver,
    phone: addr.phone,
    province: addr.province,
    city: addr.city,
    district: addr.district,
    detail: addr.detail,
    isDefault: addr.isDefault,
  })
  dialogVisible.value = true
}

async function save() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) await updateAddressApi(editingId.value, form)
    else await createAddressApi(form)
    ElMessage.success('已保存')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function remove(addr) {
  await ElMessageBox.confirm('确认删除该地址？', '提示', { type: 'warning' })
  await deleteAddressApi(addr.id)
  ElMessage.success('已删除')
  load()
}

async function setDefault(addr) {
  await setDefaultAddressApi(addr.id)
  ElMessage.success('已设为默认')
  load()
}

onMounted(load)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.addr-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.addr-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 14px;
}

.addr-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.addr-detail {
  color: #666;
  font-size: 13px;
  margin: 8px 0;
}

.addr-actions {
  display: flex;
  justify-content: flex-end;
}

.region-row {
  display: flex;
  gap: 8px;
}
</style>
