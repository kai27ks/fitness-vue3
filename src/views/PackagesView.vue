<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, type SessionLog } from '../api'
import TabBar from '../components/TabBar.vue'
import NavBar from '../components/NavBar.vue'

const packages = ref<any[]>([])
const logs = ref<SessionLog[]>([])
const current = ref(0)
const loading = ref(true)

const pkg = computed(() => packages.value[current.value] || null)

const percent = computed(() => {
  if (!pkg.value || !pkg.value.total) return 0
  return Math.round((pkg.value.remain / pkg.value.total) * 100)
})

const TYPE_TEXT: Record<string, string> = {
  CONSUME: '上课消课',
  PURCHASE: '购买课时',
  ADJUST: '课时调整',
  IMPORT: '导入课时'
}

/** 消费记录：全部来自后端课时流水（购买 / 消课 / 调整 / 导入），按当前课包过滤 */
const flow = computed(() => {
  const p = pkg.value
  if (!p) return []
  return logs.value
    .filter(l => l.packageId === p.id)
    .map(l => {
      const up = l.changeSessions > 0
      const title = l.type === 'CONSUME'
        ? `${l.courseName} 上课消课`
        : `${TYPE_TEXT[l.type] || '课时变动'} · ${l.courseName}`
      const sub = [
        l.type === 'CONSUME' && l.bookingTime ? l.bookingTime : l.createTime,
        l.coachName || '',
        l.remark || ''
      ].filter(Boolean).join(' · ')
      return {
        type: l.type,
        title,
        sub,
        remain: l.remainAfter == null ? '' : `剩 ${l.remainAfter} 节`,
        delta: `${up ? '+' : ''}${l.changeSessions} 节`,
        cls: up ? '' : 'm'
      }
    })
})

onMounted(async () => {
  try {
    packages.value = await api.packages()
    logs.value = await api.sessionLogs(undefined, 200)
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
        <div class="sec-title" style="margin-top: 14px"><b>消费记录</b><span style="font-size: 11.5px; color: var(--sub)">续课请联系前台</span></div>
        <div class="flow">
          <div v-for="(f, i) in flow" :key="i" class="fw">
            <div class="ic" :class="f.type === 'PURCHASE' ? 'i-green' : f.type === 'CONSUME' ? 'i-green' : f.type === 'ADJUST' ? 'i-orange' : 'i-blue'">
              <svg v-if="f.type === 'CONSUME'" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              <svg v-else-if="f.type === 'PURCHASE'" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              <svg v-else-if="f.type === 'ADJUST'" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              <svg v-else viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>
            </div>
            <div class="t">{{ f.title }}<small>{{ f.sub }}</small></div>
            <div class="d"><b :class="f.cls">{{ f.delta }}</b><small v-if="f.remain">{{ f.remain }}</small></div>
          </div>
          <div v-if="!flow.length" class="empty" style="padding: 24px 0">
            <p style="font-size: 12px; color: var(--sub)">暂无消费记录</p>
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
