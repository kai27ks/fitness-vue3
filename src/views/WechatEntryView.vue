<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, setSession } from '../api'

const route = useRoute()
const router = useRouter()
const error = ref('')
const loading = ref(true)

function retry() {
  window.location.href = '/wechat/oauth/entry?redirect=/'
}

onMounted(async () => {
  const err = route.query.error as string | undefined
  if (err) {
    error.value = err
    loading.value = false
    return
  }
  const ticket = route.query.ticket as string | undefined
  if (!ticket) {
    error.value = '缺少登录凭证，请从公众号菜单重新进入'
    loading.value = false
    return
  }
  try {
    const res = await api.wechatTicket(ticket)
    // 清掉地址栏里的一次性票据，避免刷新重放
    window.history.replaceState({}, '', '/wechat/entry')
    const redirect = res.redirect || '/'
    if (res.needClaim) {
      router.replace({ path: '/wechat/bind', query: { ticket: res.claimTicket, redirect } })
    } else {
      setSession(res.token, res.role, 'WECHAT')
      if (res.needFollow) {
        router.replace({ path: '/wechat/follow', query: { redirect, qrcodeUrl: res.qrcodeUrl || '' } })
      } else {
        router.replace(res.role === 'MEMBER' ? redirect : '/admin/workbench')
      }
    }
  } catch (e: any) {
    error.value = e.message || '登录失败，请重新进入'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <div class="login-hero">
      <div class="logo-badge">🏋</div>
      <h1>私教工作室 · 会员端</h1>
      <p>一对一私教 · 上课时间由你决定</p>
    </div>
    <div class="login-body">
      <div v-if="loading" class="card" style="padding: 26px; text-align: center; font-size: 14px; color: var(--sub)">
        正在验证微信身份，请稍候…
      </div>
      <template v-else-if="error">
        <div class="banner warn">{{ error }}</div>
        <button class="btn" @click="retry">重新进入</button>
        <div class="login-links"><span class="link" @click="router.replace('/login')">使用账号密码登录</span></div>
      </template>
    </div>
  </div>
</template>
