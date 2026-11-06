<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import { formatBytes, newBatchId, precompressImage } from '../../utils/image'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const title = ref('')
const quota = ref<any>({ used: 0, limit: 4, canUpload: true })
// 两个审核开关的当前组合，由 /moments/config 提供；默认值保证接口失败时按「需人工审核」显示
const config = ref<any>({ machineAuditEnabled: false, needReview: true, directPublish: false })
const tasks = ref<any[]>([])
const running = ref(false)
const done = ref(false)
const batchId = ref(newBatchId())
const MAX_SOURCE = 20 * 1024 * 1024

interface Task {
  file: File
  name: string
  preview: string
  state: 'wait' | 'uploading' | 'ok' | 'err'
  message: string
  before: number
  after: number
  dim: string
  id?: number
}

const heroText = computed(() => {
  if (config.value.directPublish) return '系统统一压缩，单图不超过 1 MB；上传成功后立即展示在风采广场'
  if (config.value.machineAuditEnabled && config.value.needReview) return '系统统一压缩，单图不超过 1 MB；每张图片先经机器审核，再由管理员通过后展示'
  if (config.value.machineAuditEnabled) return '系统统一压缩，单图不超过 1 MB；机器审核通过后立即展示'
  return '系统统一压缩，单图不超过 1 MB；提交后由管理员审核通过再展示'
})

const auditRule = computed(() => {
  if (config.value.directPublish) return '当前未开启审核，上传成功即展示，请仅发布合规内容'
  if (config.value.machineAuditEnabled) return '每张图片单独进行机器审核，有问题的只打回那一张，其余照常'
  return '每张图片单独提交，管理员审核通过后才会展示'
})

const pickText = computed(() => {
  if (config.value.directPublish) return '可一次选多张，系统会一张一张上传，成功后立即展示'
  if (config.value.machineAuditEnabled) return '可一次选多张，系统会一张一张上传、一张一张机器审核'
  return '可一次选多张，系统会一张一张上传，逐张进入人工审核'
})

const submitText = computed(() => {
  if (config.value.directPublish) return '开始上传（上传即展示）'
  if (config.value.machineAuditEnabled) return '开始上传（逐张机审）'
  return '开始上传（逐张提交）'
})

const resultLabel = computed(() => config.value.needReview ? '张提交成功' : '张发布成功')

/** 单张上传结果文案：按当前开关组合解释机审结论，避免写死「转人工审核」 */
function resultText(res: any, afterBytes: number): string {
  const stage = res.auditStatus === 'SKIPPED'
    ? (config.value.directPublish ? '未开启审核' : '未进行机器审核')
    : res.auditStatus === 'PASS' ? '机审通过'
    : res.auditStatus === 'REVIEW' ? '机审疑似，转人工复核'
    : res.auditStatus === 'BLOCK' ? '机审未通过'
    : res.auditStatus === 'ERROR' ? '机审异常' : res.auditStatus
  const status = res.status === 'APPROVED'
    ? (config.value.directPublish ? '已发布，立即展示在风采广场' : '已发布')
    : '待管理员审核'
  return `${stage} · ${status} · ${formatBytes(afterBytes)} / 1 MB`
}

async function loadQuota() {
  try { quota.value = await api.momentQuota() }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
}

async function loadConfig() {
  try { config.value = await api.momentConfig() }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return
  done.value = false
  batchId.value = newBatchId()
  for (const f of files) {
    tasks.value.push({
      file: f, name: f.name, preview: URL.createObjectURL(f), state: 'wait',
      message: '等待上传', before: f.size, after: 0, dim: ''
    })
  }
  input.value = ''
}

/** 一张一张上传 = 一张一张调用图片审核；任一张被打回只标记该张，其余继续 */
async function run() {
  if (running.value || !tasks.value.some(t => t.state === 'wait')) return
  running.value = true
  done.value = false
  for (const t of tasks.value as Task[]) {
    if (t.state !== 'wait') continue
    t.state = 'uploading'
    t.message = '压缩并上传中…'

    if (t.file.size > MAX_SOURCE) {
      t.state = 'err'
      t.message = `已打回：原图 ${formatBytes(t.file.size)} 超过 20 MB 上限，不占额度`
      continue
    }
    if (t.file.type && !/^image\//.test(t.file.type)) {
      t.state = 'err'
      t.message = '已打回：仅支持 JPG / PNG / WebP 图片，本期不支持视频'
      continue
    }
    try {
      const p = await precompressImage(t.file)
      t.after = p.outputBytes
      t.dim = `${p.sourceWidth}×${p.sourceHeight} → ${p.width}×${p.height}`
      const res = await api.uploadMoment(p.blob, title.value.trim(), batchId.value)
      t.id = res.id
      t.after = res.outputSize || p.outputBytes
      t.state = 'ok'
      t.message = resultText(res, t.after)
    } catch (err: any) {
      t.state = 'err'
      // 后端返回的具体原因（图片过大 / 压缩后超限 / 机审打回 / 额度用尽）
      t.message = err.message === '登录已过期' ? err.message : '已打回：' + err.message
    }
    await loadQuota()
  }
  running.value = false
  done.value = true
}

function clearTasks() {
  tasks.value.forEach(t => URL.revokeObjectURL(t.preview))
  tasks.value = []
  done.value = false
}

// 额度与开关配置并行拉取，多一次轻量 GET，不阻塞渲染
onMounted(() => { Promise.all([loadQuota(), loadConfig()]) })
</script>

<template>
  <div class="page">
    <NavBar title="发布图片" />
    <div class="up-hero" style="margin-top: -1px">
      <h3>分享你的训练瞬间</h3>
      <p>{{ heroText }}</p>
    </div>

    <div style="padding: 14px 16px 0">
      <div class="up-card">
        <h4>今日额度</h4>
        <div class="quota-dots">
          <i v-for="i in quota.limit" :key="i" class="dot" :class="{ on: i <= quota.used }"></i>
          <span>{{ quota.used }} / {{ quota.limit }} 张{{ quota.canUpload ? '' : ' · 已用完，0 点重置' }}</span>
        </div>
        <div class="up-rule"><i>✓</i><span>支持 JPG / PNG / WebP；iPhone HEIC 由浏览器转 JPEG</span></div>
        <div class="up-rule"><i>✓</i><span>原图 &gt; 20 MB 直接拒绝；压缩后仍 &gt; 1 MB 为保证清晰度也会拒绝</span></div>
        <div class="up-rule"><i>✓</i><span>{{ auditRule }}</span></div>
        <div class="up-rule"><i>✓</i><span>校验失败不占额度；上传成功后{{ config.directPublish ? '删除' : '审核中/驳回/删除' }}都不返还额度</span></div>
      </div>

      <div class="up-card">
        <h4>配文（选填）</h4>
        <input class="input" v-model="title" maxlength="200" placeholder="说说今天的训练感受…" />
      </div>

      <label class="up-drop" :class="{ disabled: running }">
        <b>＋ 选择图片</b>
        {{ pickText }}
        <input type="file" accept="image/*" multiple :disabled="running" @change="onPick" style="display:none" />
      </label>

      <div v-if="tasks.length">
        <div v-for="t in tasks" :key="t.preview" class="img-task" :class="t.state === 'err' ? 'err' : (t.state === 'ok' ? 'ok' : '')">
          <img :src="t.preview" />
          <div class="info">
            <b>{{ t.name }}</b>
            <small>{{ formatBytes(t.before) }}<template v-if="t.after"> → {{ formatBytes(t.after) }}</template><template v-if="t.dim"> · {{ t.dim }}</template></small>
            <small :style="t.state === 'err' ? 'color:var(--warn)' : ''">{{ t.message }}</small>
          </div>
        </div>

        <div v-if="done" class="batch-result">
          本次完成：{{ tasks.filter(t => t.state === 'ok').length }} {{ resultLabel }}，
          <span class="bad">{{ tasks.filter(t => t.state === 'err').length }} 张被打回</span>（原因见各自卡片，均未占额度）。
        </div>

        <button class="btn" :disabled="running" @click="run">
          {{ running ? '逐张上传中…' : submitText }}
        </button>
        <button class="btn-ghost" style="width:100%;margin-top:10px" @click="clearTasks">清空列表</button>
        <button class="btn-ghost" style="width:100%;margin-top:10px" v-if="done" @click="router.push('/moments/mine')">查看我的发布 ›</button>
      </div>
    </div>
  </div>
</template>
