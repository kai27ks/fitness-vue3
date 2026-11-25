<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, clearSession, getRole } from '../../api'
import { toast } from '../../utils'
import AdminTabBar from '../../components/AdminTabBar.vue'
import SupportContact from '../../components/SupportContact.vue'

const router = useRouter()
const role = getRole()
const coach = ref<any>(null)
const d = ref<any>(null)
const reviews = ref<any>(null)

const menus = [
  { label: role === 'COACH' ? '我的预约' : '预约管理', path: '/admin/schedule', cls: 'i-green', icon: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>' },
  { label: '提交请假', path: '/admin/leave', cls: 'i-orange', icon: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>' },
  { label: '会员管理', path: '/admin/members', cls: 'i-blue', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  { label: '会员课包', path: '/admin/packages', cls: 'i-orange', icon: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>' },
  { label: '课程模板', path: '/admin/courses', cls: 'i-purple', icon: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>' },
  { label: '教练管理', path: '/admin/coaches', cls: 'i-dark', icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>' },
  ...(role === 'ADMIN' ? [
    { label: '风采审核', path: '/admin/moments/review', cls: 'i-purple', icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>' }
  ] : [])
]

function logout() {
  clearSession()
  toast('已退出登录')
  router.replace('/login')
}

onMounted(async () => {
  try { d.value = await api.dashboard() } catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
  try { coach.value = await api.coachMe() } catch { /* 没有教练档案时保留通用称呼 */ }
  try { reviews.value = await api.coachMyReviews(10) } catch { reviews.value = null }
})
</script>

<template>
  <div class="page">
    <div class="me-hero">
      <div class="row">
        <div class="avatar">{{ (coach?.name || (role === 'ADMIN' ? '管' : '教'))[0] }}</div>
        <div><b>{{ coach?.name || (role === 'ADMIN' ? '管理员' : '教练') }}</b><small>{{ role === 'ADMIN' ? '管理员 · 拥有全部权限' : '教练' }}</small></div>
      </div>
      <span class="tag">{{ role === 'ADMIN' ? '管理员' : '教练' }}</span>
      <div v-if="reviews && reviews.summary" style="margin-top:10px;font-size:12px;color:#fff;opacity:.9">
        会员满意度 <b style="font-size:16px">{{ reviews.summary.count ? reviews.summary.average : '—' }}</b>
        <span v-if="reviews.summary.count">/ 5 · 共 {{ reviews.summary.count }} 条评价</span>
        <span v-else>· 暂无评价</span>
      </div>
      <div class="me-card">
        <div><b>{{ d?.monthClassCount ?? '-' }}</b><small>本月上课</small></div>
        <div><b>{{ d?.todayClassCount ?? '-' }}</b><small>今日课程</small></div>
        <div><b>{{ d?.todayMemberCount ?? '-' }}</b><small>今日会员</small></div>
        <div><b>{{ d?.monthMemberCount ?? '-' }}</b><small>本月会员</small></div>
      </div>
    </div>

    <div class="scroll-area" style="padding-top:0">
      <div class="menu" style="margin-top:52px">
        <div v-for="m in menus" :key="m.label" class="mi" @click="router.push(m.path)">
          <i :class="m.cls"><svg viewBox="0 0 24 24" v-html="m.icon"></svg></i>{{ m.label }}<span class="arr">›</span>
        </div>
      </div>
      <div class="menu" style="margin-top:12px">
        <div class="mi" @click="logout" style="justify-content:center;color:var(--warn)">退出登录</div>
      </div>
      <div style="text-align:center;color:#B7BFC8;font-size:11px;margin-top:20px">私教工作室 · {{ role === 'ADMIN' ? '管理端' : '教练端' }} V1.0</div>
      <SupportContact v-if="role === 'COACH'" />
    </div>

    <AdminTabBar active="mine" />
  </div>
</template>
