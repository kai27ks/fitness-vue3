<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'
import AdminTabBar from '../../components/AdminTabBar.vue'

const tabs = [
  { key: 'PENDING', label: '待审核' },
  { key: 'APPROVED', label: '已通过' },
  { key: 'REJECTED', label: '已驳回' }
]
const status = ref('PENDING')
const config = ref<any>({ machineAuditEnabled: false, needReview: true, directPublish: false })
const list = ref<any[]>([])
const selected = ref<number[]>([])
const loading = ref(true)
const result = ref<any>(null)
const working = ref(false)

const selectedCount = computed(() => selected.value.length)
const allSelected = computed(() => list.value.length > 0 && selected.value.length === list.value.length)

async function load() {
  loading.value = true
  result.value = null
  try {
    const p = await api.adminMoments(status.value, 1, 50)
    list.value = p.list || []
    selected.value = []
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally { loading.value = false }
}

function switchTab(k: string) {
  status.value = k
  load()
}

function toggle(id: number) {
  const i = selected.value.indexOf(id)
  i >= 0 ? selected.value.splice(i, 1) : selected.value.push(id)
}

function toggleAll() {
  selected.value = allSelected.value ? [] : list.value.map(m => m.id)
}

function reasonFor(action: string): string | undefined {
  if (action === 'REJECT') {
    const r = prompt('请输入驳回理由（会员可见）')
    if (r === null) return undefined
    if (!r.trim()) { toast('驳回必须填写理由'); return undefined }
    return r.trim()
  }
  return ''
}

async function batch(action: string) {
  if (!selected.value.length || working.value) return
  const reason = reasonFor(action)
  if (reason === undefined) return
  working.value = true
  try {
    const r = await api.batchReviewMoments([...selected.value], action, reason)
    result.value = r
    toast(`完成 ${r.successIds.length}/${r.total} 张${r.failed.length ? '，部分未处理' : ''}`)
    await load()
    // load() 会清 result，这里重新赋值保证结果面板可见
    result.value = r
  } catch (e: any) { toast(e.message) }
  finally { working.value = false }
}

async function single(id: number, action: string) {
  const reason = reasonFor(action)
  if (reason === undefined) return
  try {
    await api.reviewMoment(id, action, reason)
    toast('已处理')
    load()
  } catch (e: any) { toast(e.message) }
}

const auditText: Record<string, string> = {
  SKIPPED: '未启用机审', PASS: '机审通过', REVIEW: '机审疑似·建议复核',
  BLOCK: '机审不通过', ERROR: '机审异常'
}

async function loadConfig() {
  try { config.value = await api.momentConfig() }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
}

onMounted(() => { load(); loadConfig() })
</script>

<template>
  <div class="page">
    <NavBar title="风采审核" :right="allSelected ? '取消全选' : '全选'" @right="toggleAll" />

    <div class="mom-sub" style="padding:0 16px;margin-top:12px">
      <a v-for="t in tabs" :key="t.key" href="javascript:;" :class="{ on: status === t.key }" @click="switchTab(t.key)">{{ t.label }}</a>
    </div>

    <div style="padding:4px 16px 0">
      <div v-if="!config.needReview" class="switch-off-hint">
        人工审核已关闭：新上传的图片不会再进入待审核队列，{{ config.machineAuditEnabled ? '机审通过后直接展示' : '上传成功后立即展示' }}。此处仅可查看与处理历史待审图片。
      </div>
      <div v-if="result" class="batch-result">
        批量处理 {{ result.total }} 张：成功 {{ result.successIds.length }} 张，
        <span class="bad">未处理 {{ result.failed.length }} 张</span>
        <div v-for="f in result.failed" :key="f.id" class="bad">· 图片 #{{ f.id }}：{{ f.reason }}</div>
        <div v-if="!result.failed.length">全部完成，无需人工补处理。</div>
      </div>

      <div v-if="!loading && !list.length" class="mom-empty"><span class="e-ico">✅</span>当前没有{{ tabs.find(t => t.key === status)?.label }}图片</div>

      <div v-for="m in list" :key="m.id" class="review-card">
        <div class="chk" :class="{ on: selected.includes(m.id) }" @click="toggle(m.id)">{{ selected.includes(m.id) ? '✓' : '' }}</div>
        <img :src="m.thumbUrl" @click="$router.push(`/moments/${m.id}`)" />
        <div class="info">
          <b>{{ m.title || '分享训练瞬间' }}</b>
          <small>{{ m.authorName }} · {{ m.createTime?.slice(0, 16) }}</small>
          <small>机审：{{ auditText[m.auditStatus] || m.auditStatus }}<template v-if="m.auditLabel">（{{ m.auditLabel }}）</template></small>
          <small v-if="m.rejectReason" style="color:var(--warn)">驳回理由：{{ m.rejectReason }}</small>
          <div style="display:flex;gap:8px;margin-top:8px" v-if="status === 'PENDING'">
            <button class="btn small" @click="single(m.id, 'APPROVE')">通过</button>
            <button class="btn-ghost red" @click="single(m.id, 'REJECT')">驳回</button>
          </div>
        </div>
      </div>
    </div>

    <div class="review-bar" v-if="selectedCount && status === 'PENDING'">
      <span class="n">已选 {{ selectedCount }} 张</span>
      <button class="reject" :disabled="working" @click="batch('REJECT')">批量驳回</button>
      <button class="pass" :disabled="working" @click="batch('APPROVE')">批量通过</button>
    </div>

    <AdminTabBar active="review" />
  </div>
</template>
