<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { getRole } from '../../api'
import { BOOKING_STATUS } from '../../utils'
import AdminTabBar from '../../components/AdminTabBar.vue'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const role = getRole()
const d = ref<any>(null)
const entries = [
  { label: '添加会员', path: '/admin/members/add', cls: 'i-green', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>' },
  { label: '会员管理', path: '/admin/members', cls: 'i-orange', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  { label: '会员课包', path: '/admin/packages', cls: 'i-blue', icon: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>' },
  { label: '课程模板', path: '/admin/courses', cls: 'i-purple', icon: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>' },
  { label: '请假', path: '/admin/leave', cls: 'i-dark', icon: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>' },
  { label: '报表中心', path: '/admin/reports', cls: 'i-green', icon: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>' }
]

onMounted(async () => {
  try { d.value = await api.dashboard() } catch (e: any) { if (e.message !== '登录已过期') alert(e.message) }
})
</script>

<template>
  <div class="page">
    <div class="dash-hero">
      <div class="row">
        <div class="studio">体</div>
        <div><b>{{ d?.studioName || '工作室' }}</b><small>{{ role === 'ADMIN' ? '管理员' : '教练' }} · 陈筱鹭</small></div>
      </div>
      <div class="stat-card" v-if="d">
        <div class="stat"><div class="num">{{ d.todayMemberCount }}</div><small>今日会员</small><div class="month">月 {{ d.monthMemberCount }}</div></div>
        <div class="stat"><div class="num" :class="{ money: d.showRevenue }">{{ d.showRevenue ? '¥' + d.todayRevenue.toLocaleString() : '—' }}</div><small>今日营收</small><div class="month">月 {{ d.showRevenue ? '¥' + d.monthRevenue.toLocaleString() : '—' }}</div></div>
        <div class="stat"><div class="num">{{ d.todayClassCount }}</div><small>今日上课</small><div class="month">月 {{ d.monthClassCount }}</div></div>
      </div>
    </div>

    <div class="scroll-area" v-if="d">
      <div class="grid-entry">
        <router-link v-for="e in entries" :key="e.label" class="entry" :to="e.path">
          <i :class="e.cls"><svg viewBox="0 0 24 24" v-html="e.icon"></svg></i>{{ e.label }}
        </router-link>
      </div>
      <div class="sec-title"><b>今日课程</b><a @click="router.push('/admin/schedule')">全部 ›</a></div>
      <div class="timeline" v-if="d.upcoming.length">
        <div class="tl" v-for="(b, i) in d.upcoming" :key="i">
          <div class="bar" :class="{ gray: b.status !== 'BOOKED' }"></div>
          <div class="lesson" style="flex:1">
            <div class="avatar">{{ (b.coachName || '教')[0] }}</div>
            <div class="info"><b>{{ b.coachName }} · {{ b.courseName }}</b><small>{{ b.time }} · {{ b.memberName }}</small></div>
            <span class="pill" :class="(BOOKING_STATUS[b.status] || { cls: 'wait' }).cls">{{ (BOOKING_STATUS[b.status] || { text: b.status }).text }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty"><p>今日暂无课程</p></div>
    </div>

    <AdminTabBar active="workbench" />
  </div>
</template>
