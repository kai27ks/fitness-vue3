<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import AdminTabBar from '../../components/AdminTabBar.vue'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const list = ref<any[]>([])
const keyword = ref('')
const loading = ref(true)

const STATUS: Record<string, { text: string; cls: string }> = {
  NORMAL: { text: '正常', cls: 'wait' },
  EXPIRING: { text: '即将到期', cls: 'warn' },
  EXPIRED: { text: '已过期', cls: 'cancel' },
  USED: { text: '已用完', cls: 'cancel' },
  EMPTY: { text: '未购课', cls: 'info' }
}

function statusOf(m: any) {
  return STATUS[m.status] || { text: '正常', cls: 'wait' }
}

function ringStyle(m: any) {
  const total = m.totalSessions || 0
  if (!total) return { background: 'conic-gradient(#E9EDF1 0 100%)' }
  const percent = Math.round(((m.remainSessions || 0) / total) * 100)
  return { background: `conic-gradient(var(--primary) 0 ${percent}%, #E9EDF1 ${percent}% 100%)` }
}

async function load() {
  loading.value = true
  try { list.value = await api.adminMembers(keyword.value || undefined) }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar title="会员管理" :right="'＋'" @right="router.push('/admin/members/add')" />
    <div class="scroll-area" style="padding-top:6px">
      <div class="search">
        <svg width="15" height="15" viewBox="0 0 24 24" stroke="#8A93A0" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input v-model="keyword" placeholder="搜索姓名 / 手机号" @input="load" />
      </div>

      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!list.length" class="empty"><div class="e-ico">👥</div><p>暂无会员</p></div>

      <router-link v-for="m in list" v-else :key="m.id" class="m-row" :to="`/admin/members/${m.id}`">
        <div class="avatar" style="width:48px;height:48px;font-size:16px">{{ (m.name || '会')[0] }}</div>
        <div class="info">
          <div class="n">
            <b>{{ m.name }}</b>
            <span class="pill" :class="statusOf(m).cls">{{ statusOf(m).text }}</span>
          </div>
          <small>{{ m.phone }} · 专属教练 {{ m.coachName || '未绑定' }}</small>
          <div class="course-tags" v-if="m.courses && m.courses.length">
            <span v-for="c in m.courses" :key="c.packageId" class="course-tag" :class="{ used: c.remainSessions <= 0 }">
              {{ c.courseName }} {{ c.remainSessions }}/{{ c.totalSessions }}
            </span>
          </div>
          <small v-else class="no-course">未购课</small>
        </div>
        <div class="ring" :style="ringStyle(m)">
          <div>{{ m.totalSessions > 0 ? m.remainSessions : '--' }}<span style="font-size:8px">节</span></div>
        </div>
      </router-link>
    </div>
    <div class="fab" @click="router.push('/admin/members/add')">＋</div>
    <AdminTabBar active="schedule" />
  </div>
</template>

<style scoped>
.course-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.course-tag { font-size: 10.5px; padding: 2px 8px; border-radius: 6px; background: #EAF1FF; color: #3C6FD1; white-space: nowrap; }
.course-tag.used { background: #F1F3F5; color: #B0B8C1; }
.no-course { color: var(--sub); font-size: 11.5px; margin-top: 5px; display: block; }
</style>
