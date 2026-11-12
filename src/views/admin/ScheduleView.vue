<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, getRole } from '../../api'
import { BOOKING_STATUS, nextDays, parseBookingTime, toast } from '../../utils'
import AdminTabBar from '../../components/AdminTabBar.vue'
import NavBar from '../../components/NavBar.vue'
import StaffBookingTabs from '../../components/StaffBookingTabs.vue'

const route = useRoute()
const isCoach = getRole() === 'COACH'
const list = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const coaches = ref<any[]>([])
const coachId = ref<number | ''>('')
const statuses = ['BOOKED', 'CHECKED_IN', 'COMPLETED', 'CANCELED']
const status = ref(typeof route.query.status === 'string' && statuses.includes(route.query.status) ? route.query.status : isCoach ? 'BOOKED' : '')
const date = ref(typeof route.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(route.query.date) ? route.query.date : isCoach ? '' : nextDays(1)[0].date)
const canceling = ref<number | null>(null)
let requestId = 0

async function load() {
  const current = ++requestId
  loading.value = true; error.value = ''
  try {
    const result = await api.adminBookings({
      coachId: !isCoach ? coachId.value || undefined : undefined,
      status: status.value || undefined, date: date.value || undefined
    })
    if (current === requestId) list.value = result
  } catch (e: any) {
    if (current === requestId) { list.value = []; error.value = e.message || '预约加载失败' }
  } finally { if (current === requestId) loading.value = false }
}

function filterDate(value: string) { date.value = value; load() }

async function staffCancel(b: any) {
  if (canceling.value !== null || !confirm(`确认取消 ${b.memberName} 在 ${b.startTime.slice(0, 16)} 的预约？`)) return
  canceling.value = b.id
  try { await api.staffCancelBooking(b.id, isCoach ? '教练代取消' : '管理员取消'); toast('已取消'); await load() }
  catch (e: any) { toast(e.message); await load() }
  finally { canceling.value = null }
}

onMounted(() => {
  load()
  if (!isCoach) api.adminCoaches().then(value => { coaches.value = value }).catch((e: any) => toast(e.message))
})
</script>

<template>
  <div class="page">
    <NavBar :title="isCoach ? '预约' : '预约管理'" />
    <StaffBookingTabs active="list" />
    <div class="scroll-area">
      <div class="schedule-heading"><div><h2>{{ isCoach ? '我的预约' : '全部预约' }}</h2><p>{{ isCoach ? '本人授课的预约，含会员自约与代约记录' : '查看会员预约与各教练授课安排' }}</p></div><router-link to="/admin/schedule/new" class="btn-ghost">＋ 代约</router-link></div>
      <div class="schedule-filters">
        <label for="schedule-date">预约日期</label>
        <div class="schedule-date"><input id="schedule-date" type="date" v-model="date" @change="load" /><button type="button" @click="filterDate(nextDays(1)[0].date)">今天</button><button type="button" @click="filterDate('')" :class="{ selected: !date }">全部日期</button></div>
        <div class="schedule-selects">
          <label v-if="!isCoach">教练<select v-model="coachId" @change="load"><option value="">全部教练</option><option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }}</option></select></label>
          <label>预约状态<select v-model="status" @change="load"><option value="">全部状态</option><option value="BOOKED">待上课</option><option value="CHECKED_IN">已签到</option><option value="COMPLETED">已完成</option><option value="CANCELED">已取消</option></select></label>
        </div>
      </div>
      <div class="sec-title"><b>{{ date || '全部日期' }}</b><span class="schedule-count">{{ loading ? '加载中…' : `共 ${list.length} 条` }}</span></div>
      <div v-if="loading" class="loading" role="status">正在加载预约…</div>
      <div v-else-if="error" class="banner warn" role="alert">{{ error }}<button type="button" @click="load">重试</button></div>
      <div v-else-if="!list.length" class="empty"><div class="e-ico">📅</div><p>当前条件下暂无预约</p><router-link to="/admin/schedule/new" class="btn-ghost">替会员约一节课</router-link></div>
      <article v-for="b in list" v-else :key="b.id" class="lesson schedule-lesson">
        <div class="avatar">{{ (b.memberName || '会')[0] }}</div>
        <div class="info"><b>{{ b.memberName }} · {{ b.courseName }}</b><small>{{ parseBookingTime(b.startTime, b.endTime).date }} {{ parseBookingTime(b.startTime, b.endTime).time }}–{{ parseBookingTime(b.startTime, b.endTime).end }}</small><small>授课教练：{{ b.coachName }}</small><small v-if="b.cancelReason">取消原因：{{ b.cancelReason }}</small></div>
        <div class="schedule-actions"><span class="pill" :class="(BOOKING_STATUS[b.status] || { cls: 'wait' }).cls">{{ (BOOKING_STATUS[b.status] || { text: b.status }).text }}</span><button v-if="b.status === 'BOOKED'" type="button" class="btn-ghost red" :disabled="canceling !== null" @click="staffCancel(b)">{{ canceling === b.id ? '处理中…' : '取消预约' }}</button></div>
      </article>
    </div>
    <AdminTabBar active="schedule" />
  </div>
</template>

<style scoped>
.schedule-heading { display: flex; align-items: center; gap: 8px; justify-content: space-between; margin: 2px 0 16px; }
.schedule-heading h2 { font-size: 18px; }.schedule-heading p { font-size: 11px; color: #687582; line-height: 1.6; margin-top: 5px; }
.schedule-heading a { flex-shrink: 0; padding: 0 12px; font-size: 12px; text-decoration: none; }
.schedule-filters { background: #fff; padding: 14px; border-radius: 16px; }.schedule-filters label { font-size: 12px; font-weight: 600; }
.schedule-date { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 8px 0 14px; }
.schedule-date input { flex: 1; min-width: 130px; width: 130px; border: 1px solid #DCE3E9; border-radius: 10px; height: 40px; padding: 0 8px; background: #fff; color: var(--ink); font: inherit; font-size: 12px; }
.schedule-date button { padding: 8px; font-size: 11px; border: 0; border-radius: 8px; color: #687582; background: #F4F6F8; }.schedule-date button.selected { color: var(--primary-deep); background: #E7F9F1; }
.schedule-selects { display: flex; gap: 12px; }.schedule-selects label { flex: 1; min-width: 0; }.schedule-selects select { display: block; width: 100%; height: 40px; margin-top: 8px; padding: 0 8px; background: #fff; border: 1px solid #DCE3E9; border-radius: 10px; color: var(--ink); }
.schedule-count { color: #687582; font-size: 12px; }.schedule-lesson { padding: 14px 12px; align-items: flex-start; gap: 10px; }.schedule-lesson .info b { font-size: 13px; }.schedule-lesson .info small { font-size: 11px; line-height: 1.6; overflow-wrap: anywhere; }
.schedule-actions { display: flex; align-items: flex-end; flex-direction: column; gap: 10px; flex-shrink: 0; }.schedule-actions button { height: 32px; padding: 0 8px; font-size: 11px; }
.empty a { margin-top: 16px; text-decoration: none; }button { cursor: pointer; }button:disabled { opacity: .6; }.banner button { border: 0; background: transparent; color: inherit; text-decoration: underline; }
</style>
