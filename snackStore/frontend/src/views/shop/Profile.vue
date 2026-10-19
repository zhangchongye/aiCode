<template>
  <div class="profile">
    <el-card>
      <template #header><span>个人资料</span></template>
      <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="80px" class="form">
        <el-form-item label="用户名">
          <el-input :model-value="userStore.userInfo?.username" disabled />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="savingProfile" @click="saveProfile">保存资料</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="pwd-card">
      <template #header><span>修改密码</span></template>
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="80px" class="form">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="danger" :loading="savingPwd" @click="savePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getProfileApi, updateProfileApi, updatePasswordApi } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const profileFormRef = ref()
const pwdFormRef = ref()
const savingProfile = ref(false)
const savingPwd = ref(false)
const profileForm = reactive({ nickname: '', phone: '' })
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const profileRules = {
  phone: [
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

const pwdRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

onMounted(async () => {
  const me = await getProfileApi()
  profileForm.nickname = me.nickname
  profileForm.phone = me.phone
})

async function saveProfile() {
  const valid = await profileFormRef.value.validate().catch(() => false)
  if (!valid) return
  savingProfile.value = true
  try {
    await updateProfileApi({ nickname: profileForm.nickname, phone: profileForm.phone })
    ElMessage.success('资料已保存')
    userStore.userInfo = { ...userStore.userInfo, nickname: profileForm.nickname, phone: profileForm.phone }
    localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  savingPwd.value = true
  try {
    await updatePasswordApi({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
    ElMessage.success('密码已修改，请重新登录')
    userStore.logout()
    router.push('/login')
  } finally {
    savingPwd.value = false
  }
}
</script>

<style scoped>
.form {
  max-width: 420px;
}

.pwd-card {
  margin-top: 16px;
}
</style>
