<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const list = ref<any[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try { list.value = await api.courses() }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
}

async function toggle(c: any) {
  try { await api.toggleCourse(c.id); toast(c.status === 1 ? '已下架' : '已上架'); load() }
  catch (e: any) { toast(e.message) }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar title="课程模板" :right="'＋'" @right="router.push('/admin/courses/add')" />
    <div class="scroll-area" style="padding-top:6px">
      <div class="banner info">课程模板无价格、无固定排期；价格与节数落在会员课包上。</div>
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!list.length" class="empty"><div class="e-ico">📚</div><p>还没有课程，点右上角新增</p></div>
      <div v-for="c in list" :key="c.id" class="m-row">
        <div class="avatar" style="width:44px;height:44px;font-size:15px;background:linear-gradient(135deg,#12C48B,#0B8F7E);color:#fff">{{ (c.name || '课')[0] }}</div>
        <div class="info">
          <div class="n"><b>{{ c.name }}</b><span class="pill" :class="c.status === 1 ? 'wait' : 'cancel'">{{ c.status === 1 ? '上架' : '下架' }}</span></div>
          <small>{{ c.durationMin }} 分钟 · 默认 {{ c.defaultSessions }} 节</small>
        </div>
        <div style="display:flex;gap:6px">
          <span class="btn-ghost" style="height:30px;padding:0 10px;font-size:12px;cursor:pointer" @click="router.push(`/admin/courses/${c.id}`)">编辑</span>
          <span class="btn-ghost red" style="height:30px;padding:0 10px;font-size:12px;cursor:pointer" @click="toggle(c)">{{ c.status === 1 ? '下架' : '上架' }}</span>
        </div>
      </div>
    </div>
    <div class="fab" @click="router.push('/admin/courses/add')">＋</div>
  </div>
</template>
