<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, setToken } from '../api'
import { toast } from '../utils'
import TabBar from '../components/TabBar.vue'

const router = useRouter()
const me = ref<any>(null)

const menus = [
  { label: '我的预约', path: '/bookings', icon: 'booking', cls: 'i-green' },
  { label: '我的课包', path: '/packages', icon: 'pkg', cls: 'i-blue' },
  { label: '教练团队', path: '/', icon: 'coach', cls: 'i-purple' },
  { label: '联系教练', path: '/', icon: 'phone', cls: 'i-orange' }
]

const icons: Record<string, string> = {
  booking: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>',
  pkg: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>',
  coach: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  phone: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'
}

function logout() {
  setToken(null)
  toast('已退出登录')
  router.replace('/login')
}

onMounted(async () => {
  try {
    me.value = await api.me()
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  }
})
</script>

<template>
  <div class="page">
    <div class="me-hero">
      <div class="row">
        <div class="avatar">{{ (me?.name || '会')[0] }}</div>
        <div>
          <b>{{ me?.name || '…' }}</b>
          <small>{{ me?.phone || '' }}<template v-if="me?.coachName"> · 专属教练 {{ me.coachName }}</template></small>
        </div>
      </div>
      <span class="tag">会员</span>
      <div class="me-card">
        <div><b>{{ me?.remainSessions ?? '-' }}</b><small>剩余课时</small></div>
        <div><b>{{ me?.consumedSessions ?? '-' }}</b><small>累计消课</small></div>
        <div><b>{{ me?.upcoming ?? '-' }}</b><small>待上课</small></div>
        <div><b>{{ me?.packageCount ?? '-' }}</b><small>课包</small></div>
      </div>
    </div>

    <div class="scroll-area" style="padding-top: 0">
      <div class="menu" style="margin-top: 52px">
        <div v-for="m in menus" :key="m.label" class="mi" @click="m.path !== '/' ? router.push(m.path) : router.push('/#coaches')">
          <i :class="m.cls"><svg viewBox="0 0 24 24" v-html="icons[m.icon]"></svg></i>
          {{ m.label }}<span class="arr">›</span>
        </div>
      </div>

      <div class="menu" style="margin-top: 12px">
        <div class="mi" @click="logout" style="justify-content: center; color: var(--warn)">退出登录</div>
      </div>

      <div style="text-align: center; color: #B7BFC8; font-size: 11px; margin-top: 20px">私教工作室 · 会员端 V1.0</div>
    </div>

    <TabBar active="mine" />
  </div>
</template>
