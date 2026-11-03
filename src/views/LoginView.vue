<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, setSession } from '../api'
import { toast } from '../utils'

const router = useRouter()
const mode = ref<'login' | 'register' | 'reset'>('login')
const loginType = ref<'password' | 'code'>('password')
const form = reactive({ phone: '', password: '', code: '', name: '' })
const codeHint = ref('')
const countdown = ref(0)
const loading = ref(false)

function switchMode(m: 'login' | 'register' | 'reset') {
  mode.value = m
  form.code = ''
  form.password = ''
  codeHint.value = ''
}

async function sendCode() {
  if (!/^1\d{10}$/.test(form.phone)) return toast('请输入正确的手机号')
  if (countdown.value > 0) return
  try {
    const res = await api.smsCode(form.phone)
    countdown.value = 60
    const timer = setInterval(() => {
      if (--countdown.value <= 0) clearInterval(timer)
    }, 1000)
    if (res.mockCode) {
      codeHint.value = `验证码：${res.mockCode}（开发环境模拟短信）`
      form.code = res.mockCode
    } else {
      toast('验证码已发送')
    }
  } catch (e: any) {
    toast(e.message)
  }
}

async function submit() {
  if (loading.value) return
  if (!/^1\d{10}$/.test(form.phone)) return toast('请输入正确的手机号')
  try {
    loading.value = true
    if (mode.value === 'login') {
      const res = loginType.value === 'password'
        ? await api.loginPassword(form.phone, form.password)
        : await api.loginCode(form.phone, form.code)
      if (!res.token) return
      setSession(res.token, res.role)
      toast('登录成功')
      router.replace(res.role === 'MEMBER' ? '/' : '/admin/workbench')
    } else if (mode.value === 'register') {
      if (form.password.length < 6) return toast('密码至少 6 位')
      const res = await api.register({ phone: form.phone, code: form.code, password: form.password, name: form.name })
      setSession(res.token, res.role)
      toast('注册成功')
      router.replace(res.role === 'MEMBER' ? '/' : '/admin/workbench')
    } else {
      if (form.password.length < 6) return toast('密码至少 6 位')
      await api.resetPassword({ phone: form.phone, code: form.code, password: form.password })
      toast('密码已重置，请登录')
      switchMode('login')
    }
  } catch (e: any) {
    toast(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page" style="padding-bottom: 40px">
    <div class="login-hero">
      <div class="logo-badge">🏋</div>
      <h1>私教工作室 · 会员端</h1>
      <p>一对一私教 · 上课时间由你决定</p>
    </div>

    <div class="login-body">
      <div v-if="mode === 'login'" class="seg">
        <span :class="{ on: loginType === 'password' }" @click="loginType = 'password'">密码登录</span>
        <span :class="{ on: loginType === 'code' }" @click="loginType = 'code'">验证码登录</span>
      </div>
      <div v-else class="seg">
        <span :class="{ on: mode === 'register' }" @click="switchMode('register')">注册新账号</span>
        <span :class="{ on: mode === 'reset' }" @click="switchMode('reset')">重置密码</span>
      </div>

      <div class="input">📱 <input v-model="form.phone" maxlength="11" placeholder="手机号" inputmode="numeric" /></div>

      <div v-if="loginType === 'password' && mode === 'login'" class="input">🔒
        <input v-model="form.password" type="password" placeholder="密码" @keyup.enter="submit" />
      </div>

      <div v-if="(mode === 'login' && loginType === 'code') || mode !== 'login'" class="input">💬
        <input v-model="form.code" maxlength="6" placeholder="验证码" inputmode="numeric" @keyup.enter="submit" />
        <button class="code" :disabled="countdown > 0" @click="sendCode">
          {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
        </button>
      </div>

      <div v-if="codeHint" style="font-size: 11.5px; color: var(--primary-deep); padding: 0 4px">{{ codeHint }}</div>

      <div v-if="mode === 'register'" class="input">👤
        <input v-model="form.name" maxlength="20" placeholder="姓名（选填）" />
      </div>

      <button class="btn" :disabled="loading" @click="submit">
        {{ loading ? '请稍候…' : mode === 'login' ? '登 录' : mode === 'register' ? '注 册' : '重置密码' }}
      </button>

      <div class="login-links">
        <span class="link" v-if="mode === 'login'" @click="switchMode('register')">新用户注册</span>
        <span v-else style="cursor: pointer" @click="switchMode('login')">已有账号？去登录</span>
        <span class="link" v-if="mode === 'login'" @click="switchMode('reset')">忘记密码？</span>
      </div>
    </div>

    <div class="login-foot" style="margin-top: 28px">登录即代表同意《用户协议》与《隐私政策》</div>
  </div>
</template>
