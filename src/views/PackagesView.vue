<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '../api'
import { parseBookingTime } from '../utils'
import TabBar from '../components/TabBar.vue'
import NavBar from '../components/NavBar.vue'

const packages = ref<any[]>([])
const bookings = ref<any[]>([])
const current = ref(0)
const loading = ref(true)

const pkg = computed(() => packages.value[current.value] || null)

const percent = computed(() => {
  if (!pkg.value || !pkg.value.total) return 0
  return Math.round((pkg.value.remain / pkg.value.total) * 100)
})

/** 消课流水：购买 + 每笔预约的课时变动 */
const flow = computed(() => {
  if (!pkg.value) return []
  const items: any[] = [{
    type: 'purchase',
    title: `购买课包 ${pkg.value.courseName} ${pkg.value.total} 节`,
    sub: '线下支付',
    delta: `+${pkg.value.total} 节`,
    cls: ''
  }]
  bookings.value
    .filter(b => !pkg.value || b.courseName === pkg.value.courseName)
    .forEach(b => {
      const t = parseBookingTime(b.startTime, b.endTime)
      if (b.status === 'BOOKED') {
        items.push({ type: 'book', title: `预约 ${t.date} ${t.time} ${b.courseName}`, sub: '开课自动签到扣减', delta: '预占', cls: 'n' })
      } else if (b.status === 'CHECKED_IN' || b.status === 'COMPLETED') {
        items.push({ type: 'checkin', title: `完成 ${b.courseName} 1 节`, sub: `${t.date} ${t.time} · ${b.coachName}`, delta: '-1 节', cls: 'm' })
      } else {
        items.push({ type: 'cancel', title: `取消 ${t.date} ${t.time} ${b.courseName}`, sub: b.cancelBy === 'MEMBER' ? '会员取消' : '教练取消', delta: '无变动', cls: 'n' })
      }
    })
  return items
})

onMounted(async () => {
  try {
    packages.value = await api.packages()
    bookings.value = await api.myBookings()
    const idx = packages.value.findIndex(p => p.remain > 0)
    if (idx >= 0) current.value = idx
  } catch (e: any) {
    if (e.message !== '登录已过期') alert(e.message)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <NavBar title="我的课包" />

    <div v-if="loading" class="loading">加载中…</div>

    <template v-else-if="pkg">
      <div class="pkg-hero">
        <small>{{ pkg.courseName }} · 有效期至 {{ pkg.expireDate }}</small>
        <h2>剩余课时</h2>
        <div class="nums"><b>{{ pkg.remain }}</b><span>/ {{ pkg.total }} 节</span></div>
        <div class="bar"><i :style="{ width: percent + '%' }"></i></div>
      </div>

      <div class="pkg-pick" style="margin: 14px 16px 0">
        <span v-for="(p, i) in packages" :key="p.id" class="pp" :class="{ on: i === current }" @click="current = i">
          {{ p.courseName }} · {{ p.remain }} 节
        </span>
      </div>

      <div class="scroll-area" style="margin-top: 6px">
        <div class="sec-title" style="margin-top: 14px"><b>消课记录</b><span style="font-size: 11.5px; color: var(--sub)">续课请联系前台</span></div>
        <div class="flow">
          <div v-for="(f, i) in flow" :key="i" class="fw">
            <div class="ic" :class="f.type === 'purchase' ? 'i-green' : f.type === 'checkin' ? 'i-green' : f.type === 'book' ? 'i-blue' : 'i-orange'">
              <svg v-if="f.type === 'checkin'" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              <svg v-else-if="f.type === 'purchase'" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              <svg v-else-if="f.type === 'book'" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
              <svg v-else viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
            <div class="t">{{ f.title }}<small>{{ f.sub }}</small></div>
            <div class="d"><b :class="f.cls">{{ f.delta }}</b></div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty">
      <div class="e-ico">💳</div>
      <p>暂无课包<br /><small style="font-size: 11px">请联系前台购买课时</small></p>
    </div>

    <TabBar active="pkg" />
  </div>
</template>
