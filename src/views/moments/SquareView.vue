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
const cols = computed(() => {
  const c: any[][] = [[], []]
  list.value.forEach((m, i) => c[i % 2].push(m))
  return c
})

const statusText: Record<string, string> = {
  PENDING: '审核中', APPROVED: '', REJECTED: '已驳回'
}

async function load() {
  loading.value = true
  page.value = 1
  try {
    const [p, q] = await Promise.all([api.moments('all', 1, PAGE_SIZE), api.momentQuota()])
    list.value = p.list || []
    total.value = p.total || 0
    quota.value = q
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loading.value || loadingMore.value || finished.value) return
  loadingMore.value = true
  try {
    const p = await api.moments('all', page.value + 1, PAGE_SIZE)
    page.value = p.page || page.value + 1
    list.value = list.value.concat(p.list || [])
    total.value = p.total ?? total.value
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally {
    loadingMore.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="mom-hero">
      <div class="top">
        <div>
          <h3>会员风采</h3>
          <p>记录每一次训练，和伙伴们一起变好</p>
        </div>
        <span class="quota-cap" :class="{ full: !quota.canUpload }">今日 {{ quota.used }}/{{ quota.limit }}</span>
      </div>
    </div>

    <NavBar title="会员风采" right="我的" @right="$router.push('/moments/mine')" />

    <div class="mom-sub" style="padding: 0 16px">
      <a class="on" href="javascript:;">风采广场</a>
      <a @click="$router.push('/moments/mine')" href="javascript:;">我的发布 ›</a>
    </div>

    <div v-if="!loading" style="padding: 0 16px">
      <div v-if="list.length" class="waterfall">
        <div v-for="(col, ci) in cols" :key="ci">
          <router-link v-for="m in col" :key="m.id" class="wf-card" :to="`/moments/${m.id}`">
            <img :src="m.thumbUrl" :alt="m.title || '训练瞬间'" loading="lazy" />
            <div class="wf-body">
              <b>{{ m.title || '分享训练瞬间' }}</b>
              <div class="wf-foot">
                <span class="avatar" style="background:var(--grad);color:#fff">{{ (m.authorName || '会')[0] }}</span>
                <small style="margin:0">{{ m.authorName }}</small>
              </div>
              <small>{{ m.createTime?.slice(5, 16) }} · {{ m.commentCount }} 条评论</small>
              <div style="margin-top:7px" v-if="m.status !== 'APPROVED'">
                <span class="status-pill" :class="m.status.toLowerCase()">{{ statusText[m.status] }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
      <div v-else class="mom-empty"><span class="e-ico">📷</span>还没有已发布的图片<br />点右下角发布第一张吧</div>
      <div v-if="list.length" class="load-more">
        <button v-if="!finished" :disabled="loadingMore" @click="loadMore">{{ loadingMore ? '加载中…' : '加载更多' }}</button>
        <span v-else>没有更多了</span>
      </div>
    </div>

    <div class="fab" @click="$router.push('/moments/publish')">＋</div>
    <TabBar active="moments" />
  </div>
</template>
