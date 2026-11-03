<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '../api'
import TabBar from '../components/TabBar.vue'

const home = ref<any>(null)
const loading = ref(true)

const ringStyle = computed(() => {
  const p = home.value?.packageInfo
  if (!p || !p.total) return { background: 'conic-gradient(#fff 0 0, rgba(255,255,255,.2) 0 100%)' }
  const percent = Math.round((p.remain / p.total) * 100)
  return { background: `conic-gradient(#fff 0 ${percent}%, rgba(255,255,255,.2) ${percent}% 100%)` }
})

onMounted(async () => {
  try {
    home.value = await api.home()
  } catch (e: any) {
    if (e.message !== '登录已过期') alert(e.message)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <div class="home-hero">
      <div class="greet">
        <div class="avatar">{{ (home?.memberName || '会')[0] }}</div>
        <div>
          <b>你好，{{ home?.memberName || '…' }}</b>
          <small>今天也要动起来 💪</small>
        </div>
      </div>
      <div class="home-pkg" v-if="home?.packageInfo" @click="$router.push('/booking')">
        <div class="ring" :style="ringStyle"><i>{{ home.packageInfo.remain }}节</i></div>
        <div class="t">
          <b>{{ home.packageInfo.courseName }} · 课包</b>
          <small>剩余 {{ home.packageInfo.remain }} / {{ home.packageInfo.total }} 节 · 有效期至 {{ home.packageInfo.expireDate }}</small>
        </div>
        <span class="pill" style="background: rgba(255,255,255,.18); color: #fff">去约课 ›</span>
      </div>
      <div class="home-pkg" v-else @click="$router.push('/packages')">
        <div class="t"><b>暂无可用课包</b><small>请联系前台购买课时</small></div>
        <span class="pill" style="background: rgba(255,255,255,.18); color: #fff">查看 ›</span>
      </div>
    </div>

    <div class="quick">
      <router-link class="qi" to="/booking"><i class="i-green"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg></i>立即约课</router-link>
      <router-link class="qi" to="/bookings"><i class="i-blue"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18M3 15h18"/></svg></i>我的预约</router-link>
      <router-link class="qi" to="/packages"><i class="i-orange"><svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg></i>我的课包</router-link>
    </div>

    <div class="scroll-area" v-if="!loading">
      <div class="banner warn" v-if="home?.coach && home.coachOnLeaveToday">
        ⚠️ 你的专属教练 {{ home.coach.name }} 今日请假，如需约课请联系前台改绑教练。
      </div>

      <div class="sec-title"><b>教练团队</b><span style="font-size: 12px; color: var(--sub)">共 {{ home?.coaches?.length || 0 }} 位</span></div>
      <div class="coach-row">
        <router-link v-for="c in home?.coaches || []" :key="c.id" class="coach-c" :to="`/coach/${c.id}`">
          <div class="avatar">{{ c.name[0] }}<em>✓</em></div>
          <span>{{ c.name }}</span>
          <small>{{ c.tag }}</small>
        </router-link>
      </div>

      <div class="sec-title"><b>联系我们</b></div>
      <div class="contact">
        <div class="info">
          <b>{{ home?.studio?.name }}</b>
          <small>📍 {{ home?.studio?.address }} · 营业 {{ home?.studio?.hours }}</small>
        </div>
        <a class="call" href="tel:">
          <svg width="18" height="18" viewBox="0 0 24 24" stroke="#FF7A45" fill="none" stroke-width="2" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2z"/></svg>
        </a>
      </div>
    </div>

    <TabBar active="home" />
  </div>
</template>
