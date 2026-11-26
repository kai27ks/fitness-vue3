<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '../../api'
import { toast } from '../../utils'
import AdminTabBar from '../../components/AdminTabBar.vue'
import NavBar from '../../components/NavBar.vue'

const tab = ref<'finance' | 'course'>('finance')
const finance = ref<any>(null)
const course = ref<any>(null)
const loading = ref(true)

/* ===== 财务营收：日 / 周 / 月 / 累计 ===== */
type Range = 'day' | 'week' | 'month' | 'total'
const financeRange = ref<Range>('month')

async function loadFinance(range: Range) {
  financeRange.value = range
  try {
    finance.value = await api.reportFinance(range)
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  }
}

/* ===== 课程统计 ===== */
type StatsRange = 'day' | 'week' | 'month' | 'total'
const statsRange = ref<StatsRange>('month')
const stats = ref<any>(null)
const statsLoading = ref(false)
const openCourse = ref('')

async function loadStats(range: StatsRange) {
  statsRange.value = range
  statsLoading.value = true
  try {
    stats.value = await api.reportCourseStats(range)
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally {
    statsLoading.value = false
  }
}

const maxBar = (arr: any[]) => Math.max(1, ...arr.map(x => x.value || 0))

const statsRangeLabel = computed(() => {
  const s = stats.value
  if (!s) return ''
  if (!s.from || s.from === '全部') return '全部时间'
  return `${s.from} ~ ${s.to}`
})

const RANGE_NAMES: Record<StatsRange, string> = { day: '当日', week: '本周', month: '本月', total: '累计' }
const rangeName = computed(() => RANGE_NAMES[statsRange.value])
// 汇总口径与「课程统计」卡片保持同源，取消率 = 同范围取消数 / 同范围预约数
const statsSummary = computed(() => {
  const s = stats.value
  if (!s) return null
  const bookings = Number(s.totalBookings) || 0
  const canceled = Number(s.totalCanceled) || 0
  return {
    classes: Number(s.totalClasses) || 0,
    bookings,
    canceled,
    cancelRate: bookings ? Math.round(canceled * 1000 / bookings) / 10 : 0
  }
})
const heroClasses = computed(() => statsSummary.value ? statsSummary.value.classes : (course.value?.totalConsumed ?? 0))
const heroCancelRate = computed(() => statsSummary.value ? statsSummary.value.cancelRate : (course.value?.cancelRate ?? 0))

// 教练消课排行：直接由当前范围的课程统计（已按课程 + 教练细分）聚合，跟随 range 联动
const statsCoachRank = computed(() => {
  const s = stats.value
  if (!s) return []
  const map = new Map<string, { name: string; classes: number; bookings: number }>()
  for (const c of s.courses || []) {
    for (const co of c.coaches || []) {
      const cur = map.get(co.coachName) || { name: co.coachName, classes: 0, bookings: 0 }
      cur.classes += co.classes || 0
      cur.bookings += co.bookings || 0
      map.set(co.coachName, cur)
    }
  }
  return [...map.values()]
    .map(x => ({ ...x, ratePercent: x.bookings ? Math.round(x.classes * 100 / x.bookings) : 0 }))
    .sort((a, b) => b.classes - a.classes || b.bookings - a.bookings || a.name.localeCompare(b.name))
})

const financeBars = computed(() => {
  const arr = finance.value?.dailyRevenue || []
  const m = maxBar(arr)
  return arr.map((x: any) => ({ ...x, h: Math.round((x.value / m) * 100) }))
})
const courseBars = computed(() => {
  const arr = course.value?.dailyConsumed || []
  const m = maxBar(arr)
  return arr.map((x: any) => ({ ...x, h: Math.round((x.value / m) * 100) }))
})

const financeRangeName = computed(() => RANGE_NAMES[financeRange.value as StatsRange])
const financeHero = computed(() => {
  const f = finance.value
  if (!f) return 0
  if (financeRange.value === 'day') return Number(f.todayRevenue) || 0
  if (financeRange.value === 'week') return Number(f.weekRevenue) || 0
  if (financeRange.value === 'month') return Number(f.monthRevenue) || 0
  return Number(f.totalRevenue) || 0
})

onMounted(async () => {
  loadStats('month')
  try {
    await loadFinance('month')
    course.value = await api.reportCourses()
  } catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
})
</script>

<template>
  <div class="page">
    <NavBar title="数据报表" right="点评记录" @right="$router.push('/admin/reviews')" />
    <div class="report-tabs">
      <div class="rt" :class="{ on: tab === 'finance' }" @click="tab = 'finance'">财务</div>
      <div class="rt" :class="{ on: tab === 'course' }" @click="tab = 'course'">课程</div>
    </div>
    <div v-if="loading" class="loading">加载中…</div>

    <div v-else-if="tab === 'finance' && finance" class="scroll-area" style="padding-top:0">
      <div class="range-tabs" style="margin:0 0 12px">
        <span :class="{ on: financeRange === 'day' }" @click="loadFinance('day')">今日</span>
        <span :class="{ on: financeRange === 'week' }" @click="loadFinance('week')">本周</span>
        <span :class="{ on: financeRange === 'month' }" @click="loadFinance('month')">本月</span>
        <span :class="{ on: financeRange === 'total' }" @click="loadFinance('total')">累计</span>
      </div>
      <div class="pkg-hero" style="margin:0 0 12px;padding:18px 20px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><small>{{ financeRangeName }}营收</small><h2 style="margin:6px 0 0;font-size:30px">¥ {{ Math.round(financeHero).toLocaleString() }}</h2></div>
          <span class="pill" style="background:rgba(255,255,255,.2);color:#fff">累计 ¥{{ Math.round(finance.totalRevenue).toLocaleString() }}</span>
        </div>
      </div>
      <div class="chart-card">
        <h4>近 7 日营收</h4><div class="cap">单位：元 · 按课包购买时间统计</div>
        <div class="bars">
          <div v-for="b in financeBars" :key="b.label" class="b"><i :style="{ height: Math.max(4, b.h) + '%' }"></i>{{ b.label.slice(5) }}</div>
        </div>
      </div>
      <div class="chart-card">
        <h4>会员消费排行</h4><div class="cap">{{ financeRangeName }} · 按课包购买金额</div>
        <div v-for="(m, i) in finance.topMembers" :key="i" class="rank">
          <span class="no" :class="{ g: i === 0 }">{{ i + 1 }}</span>
          <span class="name">{{ m.name }}</span>
          <span class="val">¥{{ Math.round(m.amount).toLocaleString() }}</span>
        </div>
        <div v-if="!finance.topMembers.length" style="padding:10px 0;color:var(--sub);font-size:12px">{{ financeRangeName }}暂无数据</div>
      </div>
    </div>

    <div v-else-if="course" class="scroll-area" style="padding-top:0">
      <div class="pkg-hero" style="margin:0 0 12px;padding:18px 20px;background:linear-gradient(135deg,#4E8CFF,#3A6FE0)">
        <small>{{ rangeName }}消课 / 取消率</small>
        <h2 style="margin:6px 0 0;font-size:30px">{{ heroClasses }} 节 <span style="font-size:14px;opacity:.8">· 取消率 {{ heroCancelRate }}%</span></h2>
      </div>
      <div class="chart-card">
        <h4>课程统计</h4>
        <div class="cap">按消课节数排序 · 点课程展开教练细分<template v-if="stats">（{{ statsRangeLabel }}）</template></div>
        <div class="range-tabs">
          <span :class="{ on: statsRange === 'day' }" @click="loadStats('day')">当日</span>
          <span :class="{ on: statsRange === 'week' }" @click="loadStats('week')">本周</span>
          <span :class="{ on: statsRange === 'month' }" @click="loadStats('month')">本月</span>
          <span :class="{ on: statsRange === 'total' }" @click="loadStats('total')">总计</span>
        </div>
        <div v-if="statsLoading" class="cap" style="margin:0">加载中…</div>
        <template v-else-if="stats && stats.courses.length">
          <div class="stat-sum">
            <span>消课 <b>{{ stats.totalClasses }}</b> 节</span>
            <span>预约 <b>{{ stats.totalBookings }}</b> 次</span>
            <span>取消 <b>{{ stats.totalCanceled }}</b> 次</span>
          </div>
          <div v-for="c in stats.courses" :key="c.courseName" class="stat-row"
               @click="openCourse = openCourse === c.courseName ? '' : c.courseName">
            <div class="stat-line">
              <b>{{ c.courseName }}</b>
              <span class="val">{{ c.classes }} 节</span>
            </div>
            <div class="stat-bar"><i :style="{ width: Math.max(3, c.classPercent) + '%' }"></i></div>
            <small>{{ c.bookings }} 次预约 · 取消 {{ c.canceled }} · 占比 {{ c.classPercent }}%</small>
            <div v-if="openCourse === c.courseName" class="stat-coaches">
              <div v-for="co in c.coaches" :key="co.coachName" class="stat-coach">
                <span>{{ co.coachName }}</span>
                <span>{{ co.classes }} 节 / {{ co.bookings }} 预约</span>
              </div>
              <div v-if="!c.coaches.length" class="stat-coach"><span>暂无教练数据</span><span>—</span></div>
            </div>
          </div>
        </template>
        <div v-else class="cap" style="margin:0">该时间段暂无数据</div>
      </div>

      <div class="chart-card">
        <h4>近 7 日消课</h4><div class="cap">单位：节</div>
        <div class="bars">
          <div v-for="b in courseBars" :key="b.label" class="b"><i :style="{ height: Math.max(4, b.h) + '%' }"></i>{{ b.label.slice(5) }}</div>
        </div>
      </div>
      <div class="chart-card">
        <h4>教练消课排行</h4><div class="cap">{{ rangeName }}口径 · 单位：节 · 签到率 <template v-if="stats">（{{ statsRangeLabel }}）</template></div>
        <div v-for="(m, i) in statsCoachRank" :key="i" class="rank">
          <span class="no" :class="{ g: i === 0 }">{{ i + 1 }}</span>
          <span class="name">{{ m.name }}</span>
          <span class="pill info">{{ m.ratePercent }}%</span>
          <span class="val">{{ m.classes }} 节</span>
        </div>
        <div v-if="!statsCoachRank.length" style="padding:10px 0;color:var(--sub);font-size:12px">该时间段暂无数据</div>
      </div>
    </div>

    <AdminTabBar active="reports" />
  </div>
</template>
