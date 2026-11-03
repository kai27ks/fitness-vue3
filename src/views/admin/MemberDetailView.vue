<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../../api'
import { BOOKING_STATUS, parseBookingTime, toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const route = useRoute()
const data = ref<any>(null)
const loading = ref(true)
const coaches = ref<any[]>([])
const courses = ref<any[]>([])
const showAdd = ref(false)
const addForm = reactive({ courseId: '', totalSessions: 30, totalPrice: 9600 })

const member = computed(() => data.value?.member || {})
const packages = computed(() => data.value?.packages || [])
const bookings = computed(() => data.value?.bookings || [])
const coachName = computed(() => data.value?.coach?.name || '未绑定')

async function load() {
  loading.value = true
  try { data.value = await api.memberDetail(Number(route.params.id)) }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
}

async function rebind(e: any) {
  const coachId = Number(e.target.value)
  if (!coachId) return
  try { await api.rebindCoach(Number(route.params.id), coachId, '管理端改绑'); toast('已改绑'); load() }
  catch (err: any) { toast(err.message) }
}

async function adjust(p: any, delta: number) {
  try { await api.adjustPackage(p.id, delta, '管理端调整'); toast(delta > 0 ? '已增加 1 节' : '已扣减 1 节'); load() }
  catch (e: any) { toast(e.message) }
}

async function addPackage() {
  if (!addForm.courseId) return toast('请选择课程')
  try {
    await api.addPackage(Number(route.params.id), {
      courseId: Number(addForm.courseId),
      totalSessions: Number(addForm.totalSessions),
      totalPrice: Number(addForm.totalPrice)
    })
    toast('课包已添加'); showAdd.value = false; load()
  } catch (e: any) { toast(e.message) }
}

onMounted(async () => {
  load()
  try { coaches.value = await api.adminCoaches(); courses.value = await api.courses() } catch { /* ignore */ }
})
</script>

<template>
  <div class="page">
    <NavBar title="会员详情" :right="'编辑'" />
    <div v-if="loading" class="loading">加载中…</div>
    <template v-else-if="data">
      <div class="scroll-area" style="padding-top:6px">
        <div class="m-row" style="padding:16px">
          <div class="avatar" style="width:52px;height:52px;font-size:17px">{{ (member.name || '会')[0] }}</div>
          <div class="info">
            <div class="n"><b>{{ member.name }}</b><span class="pill info">{{ member.gender === 2 ? '女' : '男' }}</span></div>
            <small>{{ member.phone }} · 生日 {{ member.birthday || '未填' }}</small>
          </div>
        </div>

        <div class="search" style="margin-top:12px">
          <span style="white-space:nowrap">专属教练</span>
          <b style="color:var(--ink)">{{ coachName }}</b>
          <select style="margin-left:auto;border:none;background:transparent;color:var(--primary-deep);font-size:13px" @change="rebind">
            <option value="">改绑</option>
            <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="sec-title"><b>课包</b><a @click="showAdd = !showAdd">＋ 增购</a></div>
        <div v-if="showAdd" class="card" style="padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px">
          <select v-model="addForm.courseId" class="input" style="height:42px">
            <option value="">选择课程</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}（{{ c.durationMin }}分钟）</option>
          </select>
          <input v-model.number="addForm.totalSessions" class="input" style="height:42px" type="number" placeholder="总节数" />
          <input v-model.number="addForm.totalPrice" class="input" style="height:42px" type="number" placeholder="总价" />
          <button class="btn-ghost" style="justify-content:center" @click="addPackage">确认增购</button>
        </div>
        <div v-for="p in packages" :key="p.id" class="lesson">
          <div class="avatar" style="background:linear-gradient(135deg,#12C48B,#0B8F7E);color:#fff">{{ p.remainSessions }}</div>
          <div class="info"><b>剩余 {{ p.remainSessions }} / {{ p.totalSessions }} 节</b><small>有效期至 {{ p.expireDate }} · ¥{{ p.totalPrice }}</small></div>
          <div style="display:flex;gap:6px">
            <span class="btn-ghost" style="height:28px;padding:0 10px;font-size:12px;cursor:pointer" @click="adjust(p, 1)">+1</span>
            <span class="btn-ghost red" style="height:28px;padding:0 10px;font-size:12px;cursor:pointer" @click="adjust(p, -1)">-1</span>
          </div>
        </div>
        <div v-if="!packages.length" class="banner info">暂无课包，点击「增购」添加。</div>

        <div class="sec-title"><b>预约记录</b></div>
        <div v-for="b in bookings" :key="b.id" class="lesson">
          <div class="avatar">{{ (b.courseName || '课')[0] }}</div>
          <div class="info"><b>{{ b.courseName || '课程' }}</b><small>{{ parseBookingTime(b.startTime, b.endTime).date }} {{ parseBookingTime(b.startTime, b.endTime).time }} - {{ parseBookingTime(b.startTime, b.endTime).end }}</small></div>
          <span class="pill" :class="(BOOKING_STATUS[b.status] || { cls: 'wait' }).cls">{{ (BOOKING_STATUS[b.status] || { text: b.status }).text }}</span>
        </div>
        <div v-if="!bookings.length" class="banner info">暂无预约记录。</div>
      </div>
    </template>
  </div>
</template>
