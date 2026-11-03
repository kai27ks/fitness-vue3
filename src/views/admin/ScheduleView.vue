<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { BOOKING_STATUS, parseBookingTime, timeUntil, toast } from '../../utils'
import AdminTabBar from '../../components/AdminTabBar.vue'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const list = ref<any[]>([])
const loading = ref(true)
const coaches = ref<any[]>([])
const coachId = ref<number | ''>('')
const status = ref('')
const date = ref(new Date().toISOString().slice(0, 10))

async function load() {
  loading.value = true
  try {
    list.value = await api.adminBookings({
      coachId: coachId.value || undefined,
      status: status.value || undefined,
      date: date.value || undefined
    })
  } catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
}

async function staffCancel(b: any) {
  if (!confirm(`确认取消 ${b.memberName} 的预约？`)) return
  try { await api.staffCancelBooking(b.id, '管理员取消'); toast('已取消'); load() }
  catch (e: any) { toast(e.message); load() }
}

onMounted(async () => {
  try { coaches.value = await api.adminCoaches(); load() } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message); loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <NavBar title="预约管理" />
    <div style="padding: 10px 16px 0">
      <div class="search">
        <svg width="15" height="15" viewBox="0 0 24 24" stroke="#8A93A0" fill="none" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
        <input type="date" v-model="date" @change="load" style="border:none;outline:none;font-size:13px;color:var(--ink);background:transparent" />
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <select v-model="coachId" @change="load" class="input" style="flex:1;height:40px;font-size:12px">
          <option value="">全部教练</option>
          <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="status" @change="load" class="input" style="flex:1;height:40px;font-size:12px">
          <option value="">全部状态</option>
          <option value="BOOKED">待上课</option>
          <option value="CHECKED_IN">已签到</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELED">已取消</option>
        </select>
      </div>
      <button class="btn-ghost" style="width:100%;justify-content:center;height:42px" @click="router.push('/admin/members')">＋ 新增预约（选择会员后约课）</button>
    </div>

    <div class="scroll-area" style="padding-top:14px">
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!list.length" class="empty"><div class="e-ico">📅</div><p>该条件下暂无预约</p></div>
      <div v-for="b in list" :key="b.id" class="lesson">
        <div class="avatar">{{ (b.coachName || '教')[0] }}</div>
        <div class="info">
          <b>{{ b.memberName }} · {{ b.courseName }}</b>
          <small>{{ b.coachName }} · {{ parseBookingTime(b.startTime, b.endTime).date }} {{ parseBookingTime(b.startTime, b.endTime).time }}-{{ parseBookingTime(b.startTime, b.endTime).end }}</small>
        </div>
        <div style="text-align:right">
          <span class="pill" :class="(BOOKING_STATUS[b.status] || { cls: 'wait' }).cls">{{ (BOOKING_STATUS[b.status] || { text: b.status }).text }}</span>
          <div v-if="b.status === 'BOOKED'" style="margin-top:6px">
            <span class="btn-ghost red" style="height:30px;padding:0 12px;font-size:12px;cursor:pointer" @click="staffCancel(b)">取消</span>
          </div>
        </div>
      </div>
    </div>

    <AdminTabBar active="schedule" />
  </div>
</template>
