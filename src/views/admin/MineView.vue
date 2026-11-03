<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, clearSession, getRole } from '../../api'
import { toast } from '../../utils'
import AdminTabBar from '../../components/AdminTabBar.vue'

const router = useRouter()
const role = getRole()
const coach = ref<any>(null)
const d = ref<any>(null)

const menus = [
  { label: '我的课表', path: '/admin/schedule', cls: 'i-green', icon: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>' },
  { label: '提交请假', path: '/admin/leave', cls: 'i-orange', icon: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>' },
  { label: '会员管理', path: '/admin/members', cls: 'i-blue', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  { label: '课程模板', path: '/admin/courses', cls: 'i-purple', icon: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>' },
  { label: '教练管理', path: '/admin/coaches', cls: 'i-dark', icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>' }
]

function logout() {
  clearSession()
  toast('已退出登录')
  router.replace('/login')
}

onMounted(async () => {
  try {
    d.value = await api.dashboard()
    if (role === 'COACH') coach.value = await api.coachMe()
  } catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
})
</script>

<template>
  <div class="page">
    <div class="me-hero">
      <div class="row">
        <div class="avatar">{{ (coach?.name || '陈')[0] }}</div>
        <div><b>{{ coach?.name || '陈筱鹭' }}</b><small>{{ role === 'ADMIN' ? '管理员 · 拥有全部权限' : '教练' }}</small></div>
      </div>
      <span class="tag">{{ role === 'ADMIN' ? '管理员' : '教练' }}</span>
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
      <div style="text-align:center;color:#B7BFC8;font-size:11px;margin-top:20px">私教工作室 · 管理端 V1.0</div>
    </div>

    <AdminTabBar active="mine" />
  </div>
</template>
