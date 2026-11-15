<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const file = ref<File | null>(null)
const fileName = ref('')
const preview = ref<any>(null)
const result = ref<any>(null)
const loading = ref(false)
const committing = ref(false)
// 教练必须先录入：缺教练时禁止提交
const blocked = computed(() => !!(preview.value?.missingCoaches && preview.value.missingCoaches.length))

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  if (!/\.xlsx$/i.test(f.name)) {
    toast('请选择 .xlsx 文件')
    input.value = ''
    return
  }
  file.value = f
  fileName.value = f.name
  preview.value = null
  result.value = null
  doPreview()
}

async function doPreview() {
  if (!file.value) return
  loading.value = true
  try {
    preview.value = await api.memberImportPreview(file.value)
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally {
    loading.value = false
  }
}

async function doCommit() {
  if (!file.value || committing.value) return
  if (blocked.value) {
    toast('有教练还没录入教练管理，请先补录后再导入')
    return
  }
  const n = preview.value?.memberCount || 0
  if (!confirm(`确认导入 ${n} 位会员？将同时创建登录账号与课包，已存在的手机号会被跳过。`)) return
  committing.value = true
  try {
    result.value = await api.memberImportCommit(file.value)
    preview.value = null
    toast('导入完成')
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally {
    committing.value = false
  }
}
</script>

<template>
  <div class="page">
    <NavBar title="批量导入会员" />

    <div class="scroll-area" style="padding-top:6px">
      <div class="chart-card">
        <h4>选择文件</h4>
        <div class="cap">支持「会员绑卡」导出的 .xlsx，需包含：手机号 / 姓名 / 教练 / 卡名 / 剩余</div>
        <label class="pick">
          <input type="file" accept=".xlsx" @change="onPick" />
          <span>{{ fileName || '点击选择 Excel 文件' }}</span>
        </label>
        <div v-if="loading" class="cap" style="margin:10px 0 0">正在解析预览…</div>
        <div v-else-if="fileName" style="margin-top:10px">
          <a href="javascript:;" style="font-size:12px;color:var(--primary-deep)" @click="doPreview">重新解析</a>
        </div>
      </div>

      <div v-if="preview" class="chart-card">
        <h4>预览结果</h4>
        <div class="cap">只做了校验，还没有写库；确认无误再点底部「确认导入」</div>
        <div class="imp-nums">
          <div><b>{{ preview.totalRows }}</b><small>数据行</small></div>
          <div><b>{{ preview.memberCount }}</b><small>会员</small></div>
          <div><b>{{ preview.packageCount }}</b><small>课包</small></div>
          <div><b :class="{ bad: preview.invalidRows > 0 }">{{ preview.invalidRows }}</b><small>异常行</small></div>
        </div>
        <div v-if="preview.dedupRows" class="imp-tip" style="margin:-6px 0 12px">
          已自动去重 <b>{{ preview.dedupRows }}</b> 行完全相同的重复记录（同一会员/课程/教练且所有字段一致，只保留一条）
        </div>

        <div v-if="preview.missingCoaches && preview.missingCoaches.length" class="imp-block">
          <div class="imp-title bad">有 {{ preview.missingCoaches.length }} 位教练还没录入，无法导入</div>
          <div class="imp-tags">
            <span v-for="c in preview.missingCoaches" :key="c" class="imp-tag miss">{{ c }}</span>
          </div>
          <div class="imp-tip">
            导入按「教练名称」对照，请先到
            <a href="javascript:;" style="color:var(--primary-deep)" @click="router.push('/admin/coaches')">教练管理</a>
            录入这些教练（名称需与 Excel 完全一致），然后重新解析。
          </div>
        </div>

        <div class="imp-sec">
          <div class="imp-title">课程（{{ preview.courseTypes.length }}）</div>
          <div class="imp-tags">
            <span v-for="c in preview.courseTypes" :key="c" class="imp-tag">{{ c }}</span>
          </div>
          <div v-if="preview.coursesToCreate && preview.coursesToCreate.length" class="imp-tip">
            其中 {{ preview.coursesToCreate.length }} 个课程模板不存在，导入时会自动创建：{{ preview.coursesToCreate.join('、') }}
          </div>
        </div>
        <div class="imp-sec">
          <div class="imp-title">教练（{{ preview.coachNames.length }}）</div>
          <div class="imp-tags">
            <span v-for="c in preview.coachNames" :key="c" class="imp-tag coach">{{ c }}</span>
          </div>
        </div>

        <div class="imp-sec">
          <div class="imp-title">样例（前 {{ preview.sample.length }} 位）</div>
          <div v-for="(s, i) in preview.sample" :key="i" class="imp-row">
            <div class="imp-main">
              <b>{{ s.name }}</b><small>{{ s.phone }}</small>
            </div>
            <div class="imp-meta">
              <small>{{ s.coachName || '无教练' }} · {{ s.packageCount }} 个课包</small>
              <small class="imp-remain">{{ s.remain }} 节</small>
            </div>
          </div>
        </div>

        <div v-if="preview.errors && preview.errors.length" class="imp-sec">
          <div class="imp-title bad">异常行（最多显示 30 条）</div>
          <div v-for="(e, i) in preview.errors" :key="i" class="imp-err">{{ e }}</div>
        </div>
      </div>

      <div v-if="result" class="chart-card">
        <h4>导入完成</h4>
        <div class="cap">已写库，可在会员管理里核对</div>
        <div class="imp-nums">
          <div><b>{{ result.createdMembers }}</b><small>新增会员</small></div>
          <div><b>{{ result.createdPackages }}</b><small>新增课包</small></div>
          <div><b>{{ result.skippedMembers }}</b><small>跳过(已存在)</small></div>
          <div><b :class="{ bad: result.failedRows > 0 }">{{ result.failedRows }}</b><small>失败行</small></div>
        </div>
        <div class="cap" style="margin:10px 0 0">
          批次号 <b>#{{ result.batchId }}</b>；自动新建课程 {{ result.createdCourses }} 个；
          自动去重 {{ result.dedupRows }} 行；会员默认密码 <b>123456</b>，认领码在会员详情页查看。
        </div>
        <div v-if="result.errors && result.errors.length" class="imp-sec">
          <div class="imp-title bad">失败明细</div>
          <div v-for="(e, i) in result.errors" :key="i" class="imp-err">{{ e }}</div>
        </div>
        <button class="btn" style="margin-top:14px" @click="router.push('/admin/members')">返回会员列表</button>
      </div>

      <div v-if="preview" style="padding:6px 0 20px">
        <button class="btn" :disabled="committing || blocked" @click="doCommit">
          {{ committing ? '导入中，请稍候…' : (blocked ? '请先录入缺失教练' : '确认导入') }}
        </button>
        <div class="imp-tip">
          导入规则：同一会员同一课种合并为一条课包（课时相加）；总课时=剩余、金额=0、有效期=导入日+365 天；
          每次导入会留批次号与原始行，可按批次回滚。
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pick { display: block; border: 1.5px dashed #C9D4DC; border-radius: 14px; padding: 22px 12px; text-align: center; color: var(--sub); font-size: 13px; cursor: pointer; }
.pick input { display: none; }
.imp-nums { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
.imp-nums > div { background: #F7F9FB; border-radius: 12px; padding: 10px 4px; text-align: center; }
.imp-nums b { display: block; font-size: 18px; color: var(--ink); }
.imp-nums b.bad { color: var(--warn); }
.imp-nums small { font-size: 10.5px; color: var(--sub); }
.imp-sec { margin-top: 14px; }
.imp-title { font-size: 12.5px; font-weight: 600; margin-bottom: 8px; }
.imp-title.bad { color: var(--warn); }
.imp-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.imp-tag { font-size: 11px; padding: 3px 9px; border-radius: 8px; background: #EAF1FF; color: #3C6FD1; }
.imp-tag.coach { background: #EAF6F1; color: var(--primary-deep); }
.imp-tag.miss { background: #FDECEC; color: var(--warn); }
.imp-block { background: #FFF7F6; border: 1px solid #F7D7D3; border-radius: 12px; padding: 12px; margin-bottom: 14px; }
.imp-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
.imp-row:last-child { border: none; }
.imp-main b { font-size: 13px; }
.imp-main small { display: block; font-size: 11px; color: var(--sub); margin-top: 2px; }
.imp-meta { text-align: right; }
.imp-meta small { display: block; font-size: 11px; color: var(--sub); }
.imp-remain { color: var(--primary-deep); font-weight: 700; }
.imp-err { font-size: 11.5px; color: var(--warn); line-height: 1.7; }
.imp-tip { font-size: 11px; color: var(--sub); line-height: 1.7; margin-top: 10px; }
</style>
