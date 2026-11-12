<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, getRole, type StaffBookingMember, type StaffBookingOptions, type BookingPackageOption, type BookingSlot, type BookingSlotsResponse } from '../../api'
import { nextDays, toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'
import AdminTabBar from '../../components/AdminTabBar.vue'
import StaffBookingTabs from '../../components/StaffBookingTabs.vue'

const route = useRoute()
const router = useRouter()
const isCoach = getRole() === 'COACH'
const members = ref<StaffBookingMember[]>([])
const keyword = ref('')
const memberId = ref<number | ''>('')
const packageId = ref<number | ''>('')
const options = ref<StaffBookingOptions | null>(null)
const dates = nextDays(7)
const date = ref(dates[0].date)
const slots = ref<BookingSlotsResponse | null>(null)
const selectedSlot = ref<BookingSlot | null>(null)
const loadingMembers = ref(true)
const loadingOptions = ref(false)
const loadingSlots = ref(false)
const memberError = ref('')
const optionsError = ref('')
const slotsError = ref('')
const showConfirmation = ref(false)
const submitting = ref(false)
const confirmation = ref<HTMLElement | null>(null)
let optionsRequest = 0
let slotsRequest = 0

const filteredMembers = computed(() => members.value.filter(m => m.name.includes(keyword.value.trim()) || m.phone.includes(keyword.value.trim()) || m.id === memberId.value))
const selectedPackage = computed(() => options.value?.packages.find(p => p.id === packageId.value))
const packageProblem = computed(() => selectedPackage.value ? reason(selectedPackage.value) : '')

function reason(pkg: BookingPackageOption) {
  if (!pkg.courseActive) return '课程已下架'
  if (pkg.status !== 'ACTIVE') return '课包不可用'
  if (pkg.remainSessions <= 0) return '剩余课时不足'
  if (pkg.startDate && date.value < pkg.startDate) return '所选日期尚未生效'
  if (pkg.expireDate && date.value > pkg.expireDate) return '所选日期课包已过期'
  return ''
}

async function loadMembers() {
  loadingMembers.value = true; memberError.value = ''
  try {
    members.value = await api.staffBookingMembers()
    const requested = Number(route.query.memberId)
    if (requested && !memberId.value) {
      if (members.value.some(m => m.id === requested)) { memberId.value = requested; await loadOptions() }
      else optionsError.value = '该会员不在当前可代约名单中，请重新选择会员。'
    }
  } catch (e: any) { memberError.value = e.message || '会员加载失败' }
  finally { loadingMembers.value = false }
}

async function loadOptions() {
  const current = ++optionsRequest
  ++slotsRequest; options.value = null; packageId.value = ''; slots.value = null; selectedSlot.value = null
  showConfirmation.value = false; optionsError.value = ''; slotsError.value = ''; loadingSlots.value = false
  loadingOptions.value = !!memberId.value
  if (!memberId.value) return
  try {
    const result = await api.staffBookingOptions(memberId.value)
    if (current !== optionsRequest) return
    options.value = result
    packageId.value = result.packages.find(p => !reason(p))?.id || ''
  } catch (e: any) { if (current === optionsRequest) optionsError.value = e.message || '课包加载失败' }
  finally { if (current === optionsRequest) loadingOptions.value = false }
}

async function loadSlots() {
  const current = ++slotsRequest
  selectedSlot.value = null; showConfirmation.value = false; slots.value = null; slotsError.value = ''
  loadingSlots.value = false
  if (!memberId.value || !packageId.value || !options.value?.member.coachId || packageProblem.value) return
  if (!date.value || date.value < dates[0].date) { slotsError.value = '请选择今天或之后的日期'; return }
  loadingSlots.value = true
  try {
    const result = await api.staffBookingSlots(memberId.value, packageId.value, date.value)
    if (current === slotsRequest) slots.value = result
  } catch (e: any) { if (current === slotsRequest) slotsError.value = e.message || '时段加载失败' }
  finally { if (current === slotsRequest) loadingSlots.value = false }
}

function pickSlot(slot: BookingSlot) {
  if (slot.status !== 'FREE' || submitting.value) return
  selectedSlot.value = slot; showConfirmation.value = false
}

function slotText(slot: BookingSlot) {
  return ({ MINE: '该会员已约', BOOKED: '已占用', LEAVE: '教练请假', PAST: '已过时间' } as Record<string, string>)[slot.status] || (selectedSlot.value?.start === slot.start ? '已选中' : '可约')
}

async function reviewBooking() {
  if (!selectedSlot.value || packageProblem.value || loadingSlots.value) return
  showConfirmation.value = true
  await nextTick(); confirmation.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

async function submit() {
  if (submitting.value || !showConfirmation.value || !selectedSlot.value || !memberId.value || !packageId.value || packageProblem.value) return
  submitting.value = true
  try {
    await api.staffCreateBooking({ memberId: memberId.value, packageId: packageId.value, date: date.value, startTime: selectedSlot.value.start })
    toast('代约成功，会员可在“我的预约”查看')
    await router.replace({ path: '/admin/schedule', query: { date: date.value, status: 'BOOKED' } })
  } catch (e: any) { toast(e.message); await loadSlots() }
  finally { submitting.value = false }
}

watch([packageId, date], loadSlots)
onMounted(loadMembers)
</script>

<template>
  <div class="page">
    <NavBar title="预约" />
    <StaffBookingTabs active="create" />
    <div class="scroll-area staff-booking">
      <div class="staff-intro"><h2>替会员约课</h2><p>{{ isCoach ? '仅可为本人名下会员预约本人的课程' : '按会员已绑定的教练安排课程' }}</p></div>
      <section class="card staff-section">
        <h3>1 · 选择会员</h3>
        <div v-if="memberError" class="banner warn" role="alert">{{ memberError }}<button type="button" @click="loadMembers">重试</button></div>
        <p v-if="loadingMembers" class="staff-note" role="status">正在加载会员…</p>
        <template v-else-if="!memberError">
          <label for="staff-member-search">搜索姓名或手机号</label><input id="staff-member-search" v-model="keyword" class="staff-input" type="search" :disabled="submitting" placeholder="输入姓名或手机号" />
          <label for="staff-member">{{ isCoach ? '我的会员' : '选择会员' }}</label><select id="staff-member" v-model="memberId" class="staff-input" :disabled="submitting" @change="loadOptions"><option value="">请选择会员</option><option v-for="m in filteredMembers" :key="m.id" :value="m.id">{{ m.name }} · {{ m.phone }}</option></select>
          <p v-if="!members.length" class="staff-note">{{ isCoach ? '暂无名下会员，请先联系管理员绑定会员与教练。' : '暂无会员，请先创建会员档案。' }}</p><p v-else-if="!filteredMembers.length" class="staff-note">未找到匹配会员，请修改搜索内容。</p>
        </template>
      </section>
      <div v-if="loadingOptions" class="loading" role="status">正在读取会员课包…</div>
      <div v-if="optionsError" class="banner warn" role="alert">{{ optionsError }}<button v-if="memberId" type="button" @click="loadOptions">重试</button></div>
      <template v-if="options && !loadingOptions">
        <div class="banner info staff-coach">授课教练：<b>{{ options.member.coachName || '尚未绑定' }}</b><span>会员：{{ options.member.name }}</span></div>
        <div v-if="!options.member.coachId" class="banner warn">该会员未绑定教练，请先联系管理员设置后再约课。</div>
        <section class="card staff-section">
          <h3>2 · 选择课包与日期</h3>
          <label for="staff-date">预约日期</label><input id="staff-date" v-model="date" class="staff-input" type="date" :min="dates[0].date" :disabled="submitting" />
          <div class="staff-days"><button v-for="d in dates" :key="d.date" type="button" :class="{ active: date === d.date }" :disabled="submitting" @click="date = d.date">{{ d.label }}<b>{{ d.day }}</b></button></div>
          <label for="staff-package">使用课包</label><select id="staff-package" v-model="packageId" class="staff-input" :disabled="submitting"><option value="">请选择可用课包</option><option v-for="p in options.packages" :key="p.id" :value="p.id" :disabled="!!reason(p)">{{ p.courseName }} · 剩余 {{ p.remainSessions }} 节{{ reason(p) ? `（${reason(p)}）` : '' }}</option></select>
          <p v-if="!options.packages.length" class="staff-note">该会员尚无课包，请联系管理员添加课包。</p><p v-else-if="!packageId" class="staff-note">若课包当前不可用，可调整日期查看；剩余不足或停用的课包需联系管理员处理。</p>
          <p v-if="selectedPackage" class="staff-note">{{ selectedPackage.durationMin }} 分钟 / 节 · 有效期 {{ selectedPackage.startDate || '不限' }} 至 {{ selectedPackage.expireDate || '不限' }}</p>
          <p v-if="packageProblem" class="staff-warning" role="alert">{{ packageProblem }}，请调整日期或选择其他课包。</p>
        </section>
        <section v-if="packageId && !packageProblem && options.member.coachId" class="card staff-section">
          <h3>3 · 选择时段</h3>
          <p v-if="loadingSlots" class="staff-note" role="status">正在加载可约时段…</p><div v-else-if="slotsError" class="banner warn" role="alert">{{ slotsError }}<button type="button" @click="loadSlots">重试</button></div>
          <template v-else-if="slots"><div class="staff-slots"><button v-for="s in slots.slots" :key="s.start" type="button" :disabled="s.status !== 'FREE' || submitting" :class="{ active: selectedSlot?.start === s.start, mine: s.status === 'MINE' }" :aria-pressed="selectedSlot?.start === s.start" @click="pickSlot(s)"><b>{{ s.start }}–{{ s.end }}</b><small>{{ slotText(s) }}</small></button></div><p v-if="!slots.slots.some(s => s.status === 'FREE')" class="staff-note">当天暂无可约时段，请选择其他日期。</p><p class="staff-note">已占用、会员已约、请假和已过时段不可选择。</p></template>
        </section>
        <button v-if="!showConfirmation" class="btn staff-next" type="button" :disabled="!selectedSlot || submitting || loadingSlots || !!packageProblem" @click="reviewBooking">下一步：确认预约</button>
        <section v-if="showConfirmation && selectedSlot && selectedPackage" ref="confirmation" class="card staff-section staff-confirm" aria-label="确认代约信息">
          <h3>确认代约信息</h3><dl><div><dt>会员</dt><dd>{{ options.member.name }}</dd></div><div><dt>授课教练</dt><dd>{{ options.member.coachName }}</dd></div><div><dt>课程</dt><dd>{{ selectedPackage.courseName }} · {{ selectedPackage.durationMin }} 分钟</dd></div><div><dt>时间</dt><dd>{{ date }} {{ selectedSlot.start }}–{{ selectedSlot.end }}</dd></div></dl><p class="staff-note">预约成功时暂不扣课，开课时自动签到并扣减 1 节课时。</p><button class="btn" type="button" :disabled="submitting" @click="submit">{{ submitting ? '提交中…' : '确认替会员预约' }}</button><button class="staff-back" type="button" :disabled="submitting" @click="showConfirmation = false">返回修改</button>
        </section>
      </template>
    </div>
    <AdminTabBar active="schedule" />
  </div>
</template>

<style scoped>
.staff-intro { margin: 4px 0 16px; }.staff-intro h2 { font-size: 18px; }.staff-intro p { color: #687582; font-size: 12px; line-height: 1.8; margin-top: 6px; }
.staff-section { padding: 16px; margin-bottom: 14px; }.staff-section h3 { font-size: 14px; margin-bottom: 14px; }.staff-section label { display: block; font-size: 12px; font-weight: 600; margin: 12px 0 8px; }
.staff-input { width: 100%; min-width: 0; height: 44px; border: 1px solid #DCE3E9; border-radius: 11px; padding: 0 10px; font: inherit; font-size: 13px; color: var(--ink); background: #fff; }
.staff-note { font-size: 12px; color: #687582; line-height: 1.8; margin-top: 10px; }.staff-warning { font-size: 12px; color: #A75628; line-height: 1.8; margin-top: 10px; }.staff-coach { flex-wrap: wrap; }.staff-coach span { margin-left: auto; font-size: 11px; }
.staff-days { display: flex; gap: 6px; overflow-x: auto; padding: 10px 0 2px; }.staff-days button { flex: 1; min-width: 34px; border: 0; border-radius: 9px; padding: 7px 3px; font-size: 10px; background: #F4F6F8; color: #687582; }.staff-days b { display: block; font-size: 14px; margin-top: 2px; }.staff-days button.active { background: var(--grad); color: #fff; }
.staff-slots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.staff-slots button { display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center; min-height: 60px; border: 1px solid #DCE3E9; border-radius: 12px; background: #fff; color: var(--ink); }.staff-slots b { font-size: 13px; }.staff-slots small { font-size: 11px; color: #687582; }.staff-slots button:disabled { background: #F0F3F5; color: #8A93A0; opacity: 1; cursor: default; }.staff-slots button.mine { border-color: #AFE8D2; background: #E7F9F1; color: #07704F; }.staff-slots button.active { border-color: var(--primary-deep); background: #E7F9F1; color: #07704F; }
.staff-next, .staff-confirm .btn { width: 100%; font-size: 14px; letter-spacing: 0; }.staff-confirm { border: 1px solid #AFE8D2; }.staff-confirm dl div { display: flex; gap: 10px; justify-content: space-between; margin: 10px 0; font-size: 12px; line-height: 1.8; }.staff-confirm dt { color: #687582; flex-shrink: 0; }.staff-confirm dd { text-align: right; overflow-wrap: anywhere; }.staff-confirm .btn { margin-top: 14px; }.staff-back { display: block; margin: 12px auto 0; padding: 8px; border: 0; background: none; color: #687582; font-size: 12px; }
button { cursor: pointer; }button:disabled { opacity: .55; cursor: default; }input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid var(--primary-deep); outline-offset: 2px; }.banner button { border: 0; background: none; text-decoration: underline; color: inherit; }
</style>
