<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'
import TabBar from '../../components/TabBar.vue'

const PAGE_SIZE = 6
const list = ref<any[]>([])
const quota = ref<any>({ used: 0, limit: 4, canUpload: true })
const loading = ref(true)
const loadingMore = ref(false)
const page = ref(1)
const total = ref(0)
const finished = computed(() => list.value.length >= total.value)

const text: Record<string, string> = { PENDING: '审核中', APPROVED: '已发布', REJECTED: '已驳回' }

async function load() {
  loading.value = true
  page.value = 1
  try {
    const [p, q] = await Promise.all([api.moments('mine', 1, PAGE_SIZE), api.momentQuota()])
    list.value = p.list || []
    total.value = p.total || 0
    quota.value = q
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally { loading.value = false }
}

async function loadMore() {
  if (loading.value || loadingMore.value || finished.value) return
  loadingMore.value = true
  try {
    const p = await api.moments('mine', page.value + 1, PAGE_SIZE)
    page.value = p.page || page.value + 1
    list.value = list.value.concat(p.list || [])
    total.value = p.total ?? total.value
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally { loadingMore.value = false }
}

async function remove(m: any) {
  if (!confirm('确定删除这张图片吗？删除后不返还今日额度')) return
  try {
    await api.deleteMoment(m.id)
    toast('已删除')
    list.value = list.value.filter(x => x.id !== m.id)
    total.value = Math.max(0, total.value - 1)
  } catch (e: any) { toast(e.message) }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar title="我的发布" />
    <div class="mom-hero" style="margin-top:-1px;border-radius:0 0 26px 26px">
      <div class="top">
        <div><h3>我的发布</h3><p>查看审核状态与驳回原因</p></div>
        <span class="quota-cap" :class="{ full: !quota.canUpload }">今日 {{ quota.used }}/{{ quota.limit }}</span>
      </div>
    </div>

    <div style="padding:14px 16px 0">
      <div v-if="!loading && list.length" class="up-card" style="padding:0">
        <div v-for="m in list" :key="m.id" class="img-task" style="box-shadow:none;border-bottom:1px solid var(--line);border-radius:0;margin:0">
          <img :src="m.thumbUrl" @click="$router.push(`/moments/${m.id}`)" />
          <div class="info">
            <b>{{ m.title || '分享训练瞬间' }}</b>
            <small>{{ m.createTime?.slice(0, 16) }} · {{ m.commentCount }} 条评论</small>
            <small v-if="m.rejectReason" style="color:var(--warn)">驳回原因：{{ m.rejectReason }}</small>
            <small v-if="m.auditLabel">机审标记：{{ m.auditLabel }}</small>
            <div style="margin-top:7px;display:flex;gap:8px;align-items:center">
              <span class="status-pill" :class="m.status.toLowerCase()">{{ text[m.status] }}</span>
              <span class="status-pill audit" v-if="m.auditStatus === 'REVIEW'">待人工复核</span>
              <span style="flex:1"></span>
              <a href="javascript:;" style="font-size:11px;color:var(--sub)" @click="remove(m)">删除</a>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="!loading" class="mom-empty"><span class="e-ico">📷</span>还没有发布记录</div>
      <div v-if="list.length" class="load-more">
        <button v-if="!finished" :disabled="loadingMore" @click="loadMore">{{ loadingMore ? '加载中…' : '加载更多' }}</button>
        <span v-else>没有更多了</span>
      </div>
    </div>

    <div class="fab" @click="$router.push('/moments/publish')">＋</div>
    <TabBar active="moments" />
  </div>
</template>
