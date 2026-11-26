<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, getRole, type AdminReviewPage } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const PAGE_SIZE = 20

const coachId = ref(0)
const page = ref(1)
const data = ref<AdminReviewPage | null>(null)
const coaches = ref<any[]>([])
const loading = ref(true)

const list = computed(() => data.value?.items || [])
const total = computed(() => data.value?.total || 0)
const pages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const summary = computed(() => data.value?.summary || { count: 0, average: 0 })
const avgText = computed(() => summary.value.count ? summary.value.average.toFixed(1) : '—')
const filterLabel = computed(() => {
  const c = coaches.value.find(x => x.id === coachId.value)
  return c ? `教练：${c.name}` : '全店口径'
})

const starText = (n: number) => '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)))

/** "2026-11-19 14:00:00" -> "2026-11-19 14:00" */
function fmt(t: string | null) {
  return t ? String(t).replace('T', ' ').slice(0, 16) : '—'
}

async function load() {
  loading.value = true
  try {
    data.value = await api.adminReviews({
      coachId: coachId.value || undefined,
      page: page.value,
      size: PAGE_SIZE
    })
    // 筛选后页码越界（例如换教练后只剩 1 页）时回到最后一页
    if (page.value > pages.value) {
      page.value = pages.value
      data.value = await api.adminReviews({
        coachId: coachId.value || undefined,
        page: page.value,
        size: PAGE_SIZE
      })
    }
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally {
    loading.value = false
  }
}

async function loadCoaches() {
  try { coaches.value = await api.adminCoaches() } catch { /* 教练列表失败不影响主列表 */ }
}

function switchCoach() {
  page.value = 1
  load()
}

function go(p: number) {
  if (p < 1 || p > pages.value || p === page.value) return
  page.value = p
  load()
}

onMounted(() => {
  if (getRole() !== 'ADMIN') {
    toast('仅管理员可查看点评记录')
    router.replace('/admin/workbench')
    return
  }
  loadCoaches()
  load()
})
</script>

<template>
  <div class="page">
    <NavBar title="点评记录" />

    <div class="scroll-area" style="padding-top: 12px">
      <div class="chart-card" style="margin: 0 0 12px">
        <h4>会员满意度</h4>
        <div class="cap">{{ filterLabel }} · 五星为满分</div>
        <div style="display: flex; align-items: baseline; gap: 10px; margin-top: 10px">
          <b style="font-size: 34px; line-height: 1">{{ avgText }}</b>
          <span class="rated" style="font-size: 15px; letter-spacing: 2px">{{ starText(Math.round(summary.average)) }}</span>
          <small style="color: var(--sub)">共 {{ summary.count }} 条评价</small>
        </div>
      </div>

      <div class="input" style="margin: 0 0 12px">
        <select v-model.number="coachId" style="flex:1;border:none;outline:none;background:transparent;font-size:15px;color:var(--ink)" @change="switchCoach">
          <option :value="0">全部教练</option>
          <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div v-if="loading" class="loading">加载中…</div>

      <div v-else-if="!list.length" class="empty">
        <div class="e-ico">📝</div>
        <p>{{ coachId ? '该教练暂无评价' : '暂无点评记录' }}</p>
        <p style="margin-top: 12px; font-size: 12px; color: var(--sub)">会员在「我的预约 → 已完成」里评价教练后，记录会出现在这里</p>
      </div>

      <template v-else>
        <div v-for="r in list" :key="r.id" class="card" style="padding: 13px; margin-bottom: 10px">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
            <b style="font-size: 14px">
              {{ r.memberName }}
              <small style="color: var(--sub); font-weight: 400">{{ r.memberPhone || '' }}</small>
            </b>
            <span class="rated" style="letter-spacing: 1px">{{ starText(r.rating) }}</span>
          </div>
          <small style="display: block; margin-top: 6px; color: var(--sub)">{{ r.coachName }} · {{ r.courseName }}</small>
          <small style="display: block; margin-top: 4px; color: var(--sub)">
            上课 {{ fmt(r.bookingTime) }} · 评价于 {{ fmt(r.createTime) }}
          </small>
        </div>

        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 0 18px">
          <button class="btn-ghost" :disabled="page <= 1" :style="{ opacity: page <= 1 ? .4 : 1 }" @click="go(page - 1)">上一页</button>
          <small style="color: var(--sub)">{{ page }} / {{ pages }} · 共 {{ total }} 条</small>
          <button class="btn-ghost" :disabled="page >= pages" :style="{ opacity: page >= pages ? .4 : 1 }" @click="go(page + 1)">下一页</button>
        </div>
      </template>
    </div>
  </div>
</template>
