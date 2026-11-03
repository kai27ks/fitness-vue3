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
const classes: Record<number, string> = { 1: '正常', 2: '即将到期', 0: '已停课' }
const clsColor: Record<number, string> = { 1: 'wait', 2: 'warn', 0: 'cancel' }

async function load() {
  loading.value = true
  try { list.value = await api.adminMembers(keyword.value || undefined) }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
}

function remainOf(m: any) {
  // 该会员所有 ACTIVE 课包剩余课时之和（需在详情取，这里用简单标记）
  return m.remain ?? null
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
      <router-link v-for="m in list" :key="m.id" class="m-row" :to="`/admin/members/${m.id}`">
        <div class="avatar" style="width:48px;height:48px;font-size:16px">{{ (m.name || '会')[0] }}</div>
        <div class="info">
          <div class="n"><b>{{ m.name }}</b><span class="pill" :class="clsColor[m.status ?? 1]">{{ classes[m.status ?? 1] }}</span></div>
          <small>{{ m.phone }} · 专属教练 {{ m.coachId ? '教练#' + m.coachId : '未绑定' }}</small>
        </div>
        <div class="ring" style="position:relative;background:conic-gradient(var(--primary) 0 60%,#E9EDF1 60% 100%)">
          <div>--<span style="font-size:8px">节</span></div>
        </div>
      </router-link>
    </div>
    <div class="fab" @click="router.push('/admin/members/add')">＋</div>
    <AdminTabBar active="schedule" />
  </div>
</template>
