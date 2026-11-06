<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const redirect = computed(() => (route.query.redirect as string) || '/')
const qrcodeUrl = computed(() => (route.query.qrcodeUrl as string) || '')

function finish() {
  router.replace(redirect.value)
}
</script>

<template>
  <div class="page">
    <div class="login-hero">
      <div class="logo-badge">🔔</div>
      <h1>关注公众号 · 接收上课提醒</h1>
      <p>预约成功、改约取消与上课前提醒会通过公众号发送</p>
    </div>
    <div class="login-body">
      <div class="card" style="padding: 20px; text-align: center">
        <img v-if="qrcodeUrl" :src="qrcodeUrl" alt="公众号二维码"
             style="width: 190px; height: 190px; object-fit: contain; margin-bottom: 14px" />
        <div v-else style="font-size: 14px; line-height: 1.9; color: var(--ink); text-align: left">
          请在微信内搜索并关注本工作室公众号，即可接收：<br />
          · 预约成功通知<br />
          · 改约 / 取消通知<br />
          · 上课前 24 小时提醒
        </div>
      </div>

      <div class="banner info" style="margin-top: 14px">
        通知仅作提醒，<b>请以「我的预约」里的信息为准</b>；未关注不影响正常使用与约课。
      </div>

      <button class="btn" style="margin-top: 14px" @click="finish">我已关注，继续</button>
      <button class="btn-ghost" style="justify-content: center; height: 42px; margin-top: 10px" @click="finish">
        暂时跳过
      </button>
    </div>
  </div>
</template>
