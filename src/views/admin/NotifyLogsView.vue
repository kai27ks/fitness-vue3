<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const scene = ref('')
const list = ref<any[]>([])
const loading = ref(true)

const SCENES: Record<string, string> = {
  BOOKING_CREATED: '预约成功',
  BOOKING_CANCELED: '预约取消',
  BOOKING_REMINDER: '上课前提醒'
}
const STATUS: Record<string, string> = {
  SUCCESS: '已发送', FAILED: '失败', SKIPPED: '跳过'
}

async function load() {
  loading.value = true
  try { list.value = await api.notifyLogs(scene.value || undefined) }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
  finally { loading.value = false }
}

function fmt(t: string) {
  return t ? String(t).replace('T', ' ').slice(0, 16) : ''
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar title="通知发送记录" />
    <div class="scroll-area" style="padding: 12px">
      <div class="banner info">
        公众号模板消息发送结果。「跳过」通常表示会员未关注服务号或未绑定微信；未关注不影响站内预约信息。
      </div>

      <div class="input" style="margin: 12px 0">
        <select v-model="scene" style="flex:1;border:none;outline:none;background:transparent;font-size:15px;color:var(--ink)" @change="load">
          <option value="">全部场景</option>
          <option value="BOOKING_CREATED">预约成功</option>
          <option value="BOOKING_CANCELED">预约取消</option>
          <option value="BOOKING_REMINDER">上课前提醒</option>
        </select>
      </div>

      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!list.length" class="empty"><div class="e-ico">📭</div><p>暂无发送记录</p></div>

      <div v-for="r in list" :key="r.id" class="card" style="padding: 13px; margin-bottom: 10px">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <b style="font-size:14px">{{ SCENES[r.scene] || r.scene }}</b>
          <span class="pill" :class="r.status === 'SUCCESS' ? 'info' : (r.status === 'FAILED' ? 'cancel' : 'wait')">
            {{ STATUS[r.status] || r.status }}
          </span>
        </div>
        <small style="color:var(--sub); display:block; margin-top:6px">
          {{ fmt(r.createTime) }} · {{ r.errcode != null ? '错误码 ' + r.errcode + ' ' : '' }}{{ r.errmsg || '' }}
        </small>
        <small v-if="r.content" style="color:var(--ink); display:block; margin-top:6px">{{ r.content }}</small>
      </div>
    </div>
  </div>
</template>
