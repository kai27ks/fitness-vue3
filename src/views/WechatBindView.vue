<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, setSession } from '../api'
import { toast } from '../utils'

const route = useRoute()
const router = useRouter()
const claimTicket = (route.query.ticket as string) || ''
const redirect = (route.query.redirect as string) || '/'
const form = reactive({ phone: '', claimCode: '' })
const loading = ref(false)
const notice = ref('')

async function submit() {
  if (!/^1\d{10}$/.test(form.phone)) return toast('请输入正确的手机号')
  if (!/^\d{6}$/.test(form.claimCode)) return toast('认领码为 6 位数字')
  if (loading.value) return
  if (!claimTicket) {
    notice.value = '登录凭证已失效，请从公众号重新进入'
    return
  }
  loading.value = true
  notice.value = ''
  try {
    const res = await api.wechatClaim({
      claimTicket,
      phone: form.phone,
      claimCode: form.claimCode
    })
    setSession(res.token, res.role, 'WECHAT')
    toast('认领成功')
    if (res.needFollow) {
      router.replace({ path: '/wechat/follow', query: { redirect, qrcodeUrl: res.qrcodeUrl || '' } })
    } else {
      router.replace(res.role === 'MEMBER' ? redirect : '/admin/workbench')
    }
  } catch (e: any) {
    notice.value = e.message || '认领失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

function reenter() {
  window.location.href = '/wechat/oauth/entry?redirect=' + encodeURIComponent(redirect)
}
</script>

<template>
  <div class="page">
    <div class="login-hero">
      <div class="logo-badge">🏋</div>
      <h1>首次进入 · 绑定会员档案</h1>
      <p>输入建档时的手机号与教练交付的认领码</p>
    </div>
    <div class="login-body">
      <div class="banner info">
        认领成功后即可看到你的课包、预约与会员资料；此步骤只需做一次，之后从公众号进入会自动登录。
      </div>

      <div class="input">📱
        <input v-model="form.phone" maxlength="11" placeholder="建档手机号" inputmode="numeric" />
      </div>
      <div class="input">🎟
        <input v-model="form.claimCode" maxlength="6" placeholder="6 位认领码" inputmode="numeric" @keyup.enter="submit" />
      </div>

      <div v-if="notice" class="banner warn" style="white-space: pre-wrap">{{ notice }}</div>

      <button class="btn" :disabled="loading" @click="submit">
        {{ loading ? '请稍候…' : '绑定会员档案' }}
      </button>

      <div class="login-links">
        <span class="link" @click="reenter">重新从公众号进入</span>
        <span class="link" @click="router.replace('/login')">使用账号密码登录</span>
      </div>
      <div class="login-foot">
        不记得认领码或手机号与档案不一致？请联系前台核实，工作人员可在管理端修改手机号或代为绑定。
      </div>
    </div>
  </div>
</template>
