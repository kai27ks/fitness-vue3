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

const maxBar = (arr: any[]) => Math.max(1, ...arr.map(x => x.value || 0))

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

onMounted(async () => {
  try {
    finance.value = await api.reportFinance()
    course.value = await api.reportCourses()
  } catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
})
</script>

<template>
  <div class="page">
    <NavBar title="数据报表" />
    <div class="report-tabs">
      <div class="rt" :class="{ on: tab === 'finance' }" @click="tab = 'finance'">财务</div>
      <div class="rt" :class="{ on: tab === 'course' }" @click="tab = 'course'">课程</div>
    </div>
    <div v-if="loading" class="loading">加载中…</div>

    <div v-else-if="tab === 'finance' && finance" class="scroll-area" style="padding-top:0">
      <div class="pkg-hero" style="margin:0 0 12px;padding:18px 20px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><small>本月总营收</small><h2 style="margin:6px 0 0;font-size:30px">¥ {{ Math.round(finance.monthRevenue).toLocaleString() }}</h2></div>
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
        <h4>会员消费排行</h4><div class="cap">本月 · 按课包购买金额</div>
        <div v-for="(m, i) in finance.topMembers" :key="i" class="rank">
          <span class="no" :class="{ g: i === 0 }">{{ i + 1 }}</span>
          <span class="name">{{ m.name }}</span>
          <span class="val">¥{{ Math.round(m.amount).toLocaleString() }}</span>
        </div>
        <div v-if="!finance.topMembers.length" style="padding:10px 0;color:var(--sub);font-size:12px">本月暂无数据</div>
      </div>
    </div>

    <div v-else-if="course" class="scroll-area" style="padding-top:0">
      <div class="pkg-hero" style="margin:0 0 12px;padding:18px 20px;background:linear-gradient(135deg,#4E8CFF,#3A6FE0)">
        <small>累计消课 / 取消率</small>
        <h2 style="margin:6px 0 0;font-size:30px">{{ course.totalConsumed }} 节 <span style="font-size:14px;opacity:.8">· 取消率 {{ course.cancelRate }}%</span></h2>
      </div>
      <div class="chart-card">
        <h4>近 7 日消课</h4><div class="cap">单位：节</div>
        <div class="bars">
          <div v-for="b in courseBars" :key="b.label" class="b"><i :style="{ height: Math.max(4, b.h) + '%' }"></i>{{ b.label.slice(5) }}</div>
        </div>
      </div>
      <div class="chart-card">
        <h4>教练消课排行</h4><div class="cap">单位：节 · 签到率</div>
        <div v-for="(m, i) in course.coachRank" :key="i" class="rank">
          <span class="no" :class="{ g: i === 0 }">{{ i + 1 }}</span>
          <span class="name">{{ m.name }}</span>
          <span class="pill info">{{ m.ratePercent }}%</span>
          <span class="val">{{ m.classes }} 节</span>
        </div>
        <div v-if="!course.coachRank.length" style="padding:10px 0;color:var(--sub);font-size:12px">暂无数据</div>
      </div>
    </div>

    <AdminTabBar active="reports" />
  </div>
</template>
