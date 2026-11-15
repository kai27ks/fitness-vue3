<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, setSession } from '../api'
import { toast } from '../utils'

const route = useRoute()
const router = useRouter()
const claimTicket = (route.query.ticket as string) || ''
const redirect = (route.query.redirect as string) || '/admin/workbench'
const form = reactive({ phone: '', password: '' })
const loading = ref(false)
const notice = ref('')

async function submit() {
  if (!/^1\d{10}$/.test(form.phone)) return toast('请输入正确的手机号')
  if (!form.password) return toast('请输入密码')
  if (loading.value) return
  if (!claimTicket) {
    notice.value = '登录凭证已失效，请从公众号「教练工作台」重新进入'
    return
  }
  loading.value = true
  notice.value = ''
  try {
    const res = await api.wechatCoachClaim({
      claimTicket,
      phone: form.phone,
      password: form.password
    })
    setSession(res.token, res.role, 'WECHAT')
    toast('绑定成功')
    if (res.needFollow) {
      router.replace({ path: '/wechat/follow', query: { redirect, qrcodeUrl: res.qrcodeUrl || '' } })
    } else {
      router.replace(res.role === 'MEMBER' ? redirect : '/admin/workbench')
    }
  } catch (e: any) {
    notice.value = e.message || '绑定失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

function reenter() {
  window.location.href = '/wechat/oauth/entry?role=COACH&redirect=' + encodeURIComponent('/admin/workbench')
}
</script>

<template>
  <div class="page">
    <div class="login-hero">
      <div class="logo-badge">🏋</div>
      <h1>首次进入 · 绑定教练账号</h1>
      <p>输入后台开通的教练账号与密码</p>
    </div>
    <div class="login-body">
      <div class="banner info">
        绑定后从公众号「教练工作台」进入会自动登录；手机号或密码错误请先联系店长确认。
      </div>

      <div class="input">📱
        <input v-model="form.phone" maxlength="11" placeholder="教练手机号" inputmode="numeric" />
      </div>
      <div class="input">🔒
        <input v-model="form.password" type="password" placeholder="登录密码" @keyup.enter="submit" />
      </div>

      <div v-if="notice" class="banner warn" style="white-space: pre-wrap">{{ notice }}</div>

      <button class="btn" :disabled="loading" @click="submit">
        {{ loading ? '请稍候…' : '绑定并进入工作台' }}
      </button>

      <div class="login-links">
        <span class="link" @click="reenter">重新从公众号进入</span>
        <span class="link" @click="router.replace('/login')">改用账号密码登录</span>
      </div>
      <div class="login-foot">
        连续输错 5 次密码会锁定 15 分钟；离职或换人时，店长可在教练详情页解绑微信。
      </div>
    </div>
  </div>
</template>
