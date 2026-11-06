<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const list = ref<any[]>([])
const keyword = ref('')
const loading = ref(true)

const totalRemain = computed(() => list.value.reduce((s, p) => s + (p.remainSessions || 0), 0))

function isExpiring(p: any) {
  if (!p.expireDate) return false
  const diff = (new Date(p.expireDate).getTime() - Date.now()) / 86400000
  return diff >= 0 && diff <= 30
}

function statusOf(p: any) {
  if (p.remainSessions <= 0) return { text: '已用完', cls: 'cancel' }
  if (isExpiring(p)) return { text: '即将到期', cls: 'warn' }
  return { text: '正常', cls: 'wait' }
}

async function load() {
  loading.value = true
  try { list.value = await api.adminPackages(keyword.value || undefined) }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
}

async function adjust(p: any, delta: number) {
  try {
    await api.adjustPackage(p.id, delta, '课包页调整')
    toast(delta > 0 ? '已增加 1 节' : '已扣减 1 节')
    load()
  } catch (e: any) { toast(e.message) }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar title="会员课包" :right="'会员'" @right="router.push('/admin/members')" />
    <div class="scroll-area" style="padding-top:6px">
      <div class="search">
        <svg width="15" height="15" viewBox="0 0 24 24" stroke="#8A93A0" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input v-model="keyword" placeholder="搜索会员姓名 / 手机号" @input="load" />
      </div>

      <div class="pkg-hero" style="margin:0 0 14px;padding:18px 20px">
        <small>全部课包 · 共 {{ list.length }} 张</small>
        <div class="nums" style="margin-top:8px"><b>{{ totalRemain }}</b><span>节剩余</span></div>
      </div>

      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!list.length" class="empty"><div class="e-ico">💳</div><p>暂无课包<br /><small style="font-size:11px">在会员详情里「增购」即可创建</small></p></div>

      <div v-for="p in list" v-else :key="p.id" class="m-row" style="align-items:flex-start">
        <div class="avatar" style="width:46px;height:46px;font-size:15px;background:linear-gradient(135deg,#12C48B,#0B8F7E);color:#fff">
          {{ p.remainSessions }}
        </div>
        <div class="info">
          <div class="n">
            <b>{{ p.memberName }}</b>
            <span class="pill" :class="statusOf(p).cls">{{ statusOf(p).text }}</span>
          </div>
          <small>{{ p.courseName }} · 剩余 {{ p.remainSessions }} / {{ p.totalSessions }} 节 · ¥{{ p.totalPrice }}</small>
          <small style="margin-top:2px">有效期至 {{ p.expireDate || '—' }}</small>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div style="display:flex;gap:6px">
            <span class="btn-ghost" style="height:28px;padding:0 10px;font-size:12px;cursor:pointer" @click="adjust(p, 1)">+1</span>
            <span class="btn-ghost red" style="height:28px;padding:0 10px;font-size:12px;cursor:pointer" @click="adjust(p, -1)">-1</span>
          </div>
          <span style="font-size:11px;color:var(--primary-deep);cursor:pointer" @click="router.push(`/admin/members/${p.memberId}`)">会员详情 ›</span>
        </div>
      </div>
    </div>
  </div>
</template>
