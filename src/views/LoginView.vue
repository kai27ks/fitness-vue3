<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, setSession } from '../api'
import { toast } from '../utils'

const router = useRouter()
const form = reactive({ phone: '', password: '' })
const loading = ref(false)
// 开发/内网穿透调试时提供模拟公众号入口；生产构建后自动隐藏（真实入口是公众号菜单/二维码）
const showMockEntry = import.meta.env.DEV

async function submit() {
  if (loading.value) return
  if (!/^1\d{10}$/.test(form.phone)) return toast('请输入正确的手机号')
  if (!form.password) return toast('请输入密码')
  loading.value = true
  try {
    const res = await api.loginPassword(form.phone, form.password)
    if (!res.token) return
    setSession(res.token, res.role, 'PASSWORD')
    toast('登录成功')
    router.replace(res.role === 'MEMBER' ? '/' : '/admin/workbench')
  } catch (e: any) {
    toast(e.message)
  } finally {
    loading.value = false
  }
}

function wechatEntry() {
  window.location.href = '/wechat/oauth/entry?redirect=/'
}
</script>

<template>
  <div class="page" style="padding-bottom: 40px">
    <div class="login-hero">
      <div class="logo-badge">🏋</div>
      <h1>私教工作室</h1>
      <p>会员 · 教练 · 管理员统一登录</p>
    </div>

    <div class="login-body">
      <div class="banner info">
        会员：优先从公众号菜单进入，首次用「建档手机号 + 认领码」绑定档案，之后自动登录；也可用手机号 + 密码登录。<br>
        教练 / 管理员：使用后台开通的账号密码登录。
      </div>

      <div class="input">📱 <input v-model="form.phone" maxlength="11" placeholder="手机号" inputmode="numeric" /></div>
      <div class="input">🔒
        <input v-model="form.password" type="password" placeholder="密码" @keyup.enter="submit" />
      </div>

      <button class="btn" :disabled="loading" @click="submit">{{ loading ? '请稍候…' : '登 录' }}</button>

      <button v-if="showMockEntry" class="btn-ghost" style="justify-content:center;height:44px" @click="wechatEntry">
        模拟公众号入口（调试）
      </button>

      <div class="login-links">
        <span>忘记密码？请联系前台重置</span>
        <span>新会员由教练建档</span>
      </div>
    </div>

    <div class="login-foot" style="margin-top: 28px">登录即代表同意《用户协议》与《隐私政策》</div>
  </div>
</template>
