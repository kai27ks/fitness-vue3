<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../api'
import { nextDays, slotLabel, toast } from '../utils'
import TabBar from '../components/TabBar.vue'
import NavBar from '../components/NavBar.vue'

const dates = nextDays(7)
const selectedDate = ref(dates[0].date)
const home = ref<any>(null)
const packages = ref<any[]>([])
const selectedPkg = ref<any>(null)
const slots = ref<any>(null)
const selectedSlot = ref<any>(null)
const sheetShow = ref(false)
const submitting = ref(false)
const loadingSlots = ref(false)

const coach = computed(() => home.value?.coach)

const selectablePkgs = computed(() => (packages.value || []).map(p => ({
  ...p,
  disabled: p.remain <= 0 || p.status !== 'ACTIVE' || p.expireDate < new Date().toISOString().slice(0, 10)
})))

function pickDate(d: any) {
  selectedDate.value = d.date
  selectedSlot.value = null
}

function pickPkg(p: any) {
  if (p.disabled) return
  selectedPkg.value = p
  selectedSlot.value = null
}

async function loadSlots() {
  if (!coach.value || !selectedPkg.value) return
  loadingSlots.value = true
  try {
    slots.value = await api.slots(coach.value.id, selectedDate.value, selectedPkg.value.courseId)
  } catch (e: any) {
    toast(e.message)
    slots.value = null
  } finally {
    loadingSlots.value = false
  }
}

function pickSlot(s: any) {
  if (s.status !== 'FREE') return
  selectedSlot.value = s
}

function openSheet() {
  if (!selectedSlot.value) return toast('请先选择时间')
  sheetShow.value = true
}

async function confirmBooking() {
  if (submitting.value) return
  try {
    submitting.value = true
    await api.createBooking({
      packageId: selectedPkg.value.id,
      courseId: selectedPkg.value.courseId,
      date: selectedDate.value,
      startTime: selectedSlot.value.start
    })
    sheetShow.value = false
    selectedSlot.value = null
    toast('预约成功，已发送通知')
    await loadSlots()
  } catch (e: any) {
    toast(e.message)
    await loadSlots()
  } finally {
    submitting.value = false
  }
}

watch([selectedDate, () => selectedPkg.value?.id], loadSlots)

onMounted(async () => {
  try {
    home.value = await api.home()
    packages.value = await api.packages()
    const active = selectablePkgs.value.find(p => !p.disabled)
    if (active) selectedPkg.value = active
    await loadSlots()
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  }
})
</script>

<template>
  <div class="page">
    <NavBar title="约课" />

    <div class="date-strip">
      <button v-for="d in dates" :key="d.date" class="date-chip" :class="{ on: selectedDate === d.date }" @click="pickDate(d)">
        <span>{{ d.label }}</span><b>{{ d.day }}</b>
      </button>
    </div>

    <div class="scroll-area" style="padding-top: 2px">
      <template v-if="coach">
        <div class="coach-bar">
          <div class="avatar" style="width: 46px; height: 46px; font-size: 16px">{{ coach.name[0] }}</div>
          <div style="flex: 1; min-width: 0">
            <b style="font-size: 14.5px">{{ coach.name }} <span style="font-size: 11px; color: var(--primary-deep)">· 我的专属教练</span></b>
            <div style="font-size: 11.5px; color: var(--sub); margin-top: 3px">改绑教练请联系前台</div>
          </div>
          <span class="pill" :class="home.coachOnLeaveToday ? 'warn' : 'wait'">
            {{ home.coachOnLeaveToday ? '今日请假' : '今日正常上班' }}
          </span>
        </div>

        <div class="pkg-pick" v-if="selectablePkgs.length">
          <span v-for="p in selectablePkgs" :key="p.id" class="pp"
                :class="{ on: selectedPkg?.id === p.id, off: p.disabled }" @click="pickPkg(p)">
            {{ p.courseName }} · {{ p.remain }} 节
          </span>
        </div>
        <div v-else class="banner info" style="margin-top: 12px">暂无可用课包，请联系前台购买课时。</div>

        <div class="sec-title"><b>选择时间</b><span style="font-size: 12px; color: var(--sub)">{{ home?.studio?.hours }}</span></div>

        <div v-if="loadingSlots" class="loading">正在加载时段…</div>
        <div v-else-if="slots" class="slots">
          <div v-for="s in slots.slots" :key="s.start" class="sl"
               :class="{ on: selectedSlot?.start === s.start, mine: s.status === 'MINE', off: s.status !== 'FREE' && s.status !== 'MINE' }"
               @click="pickSlot(s)">
            {{ s.start }}
            <small>{{ slotLabel(s.status) || (selectedSlot?.start === s.start ? '已选中' : '可约') }}</small>
          </div>
        </div>

        <div class="legend" v-if="slots">
          <span><i style="background: #fff; box-shadow: var(--shadow)"></i>可约</span>
          <span><i style="background: #E9EDF1"></i>已被约 · 不可选</span>
          <span><i style="background: #E7F9F1; border: 1.5px solid var(--primary)"></i>我的预约</span>
          <span><i style="background: var(--grad)"></i>已选中</span>
        </div>
      </template>

      <div v-else class="empty">
        <div class="e-ico">🧑‍🏫</div>
        <p>暂未绑定专属教练<br/><small style="font-size: 11px">1V1 课程需先绑定教练，请联系前台</small></p>
      </div>
    </div>

    <div class="pick-bar" v-if="selectedSlot && selectedPkg">
      <div class="sel">
        <b>{{ selectedDate }} {{ selectedSlot.start }} - {{ selectedSlot.end }}</b>
        <small>{{ selectedPkg.courseName }} · {{ coach?.name }} · {{ slots?.durationMin }} 分钟</small>
      </div>
      <button class="btn small" @click="openSheet">下一步</button>
    </div>

    <template v-if="sheetShow">
      <div class="mask" @click="sheetShow = false"></div>
      <div class="sheet">
        <div class="grab"></div>
        <h3>确认预约</h3>
        <div class="conf-row">
          <span class="k">课程</span>
          <span class="v">{{ selectedPkg.courseName }} · {{ slots?.durationMin }} 分钟
            <small>教练 {{ coach?.name }}（我的专属教练）</small>
          </span>
        </div>
        <div class="conf-row">
          <span class="k">时间</span>
          <span class="v">{{ selectedDate }} {{ selectedSlot.start }} - {{ selectedSlot.end }}</span>
        </div>
        <div class="conf-row">
          <span class="k">课包</span>
          <span class="v">剩余 {{ selectedPkg.remain }} 节<small>开课自动签到扣减 1 节</small></span>
        </div>
        <div class="rule-tip">
          <span class="ok">✓</span>预约后不可改期；开课自动签到扣 1 节课时，开始前 2 小时内不可取消
        </div>
        <button class="btn" :disabled="submitting" @click="confirmBooking">
          {{ submitting ? '提交中…' : '确认预约' }}
        </button>
      </div>
    </template>

    <TabBar active="booking" />
  </div>
</template>
