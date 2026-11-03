<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const coach = ref<any>(null)
const type = ref('事假')
const types = ['事假', '年假', '病假']
const conflict = ref<any[]>([])
const form = reactive({ startTime: '', endTime: '', reason: '' })
const submitting = ref(false)

async function checkConflict() {
  if (!coach.value || !form.startTime || !form.endTime) { conflict.value = []; return }
  try {
    conflict.value = await api.leaveConflict(coach.value.id, form.startTime + ':00', form.endTime + ':00')
  } catch { conflict.value = [] }
}

async function submit() {
  if (!form.startTime || !form.endTime) return toast('请选择请假时段')
  if (form.endTime <= form.startTime) return toast('结束时间须晚于开始时间')
  submitting.value = true
  try {
    await api.createLeave(coach.value.id, {
      startTime: form.startTime + ':00', endTime: form.endTime + ':00',
      reason: `[${type.value}] ${form.reason || ''}`.trim(), type: 1
    })
    toast('请假已提交')
    form.startTime = ''; form.endTime = ''; form.reason = ''
    conflict.value = []
  } catch (e: any) { toast(e.message) } finally { submitting.value = false }
}

watch(() => [form.startTime, form.endTime], checkConflict)

onMounted(async () => {
  try { coach.value = await api.coachMe() } catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
})
</script>

<template>
  <div class="page">
    <NavBar title="教练请假" />
    <div class="scroll-area" style="padding-top:8px">
      <div class="leave-type">
        <div v-for="t in types" :key="t" class="lt" :class="{ on: type === t }" @click="type = t">{{ t }}</div>
      </div>
      <div class="form-label">请假时段</div>
      <div class="range">
        <input v-model="form.startTime" type="datetime-local" class="input" style="border:none" />
        <span class="arrow">→</span>
        <input v-model="form.endTime" type="datetime-local" class="input" style="border:none" />
      </div>
      <div class="form-label">请假事由</div>
      <textarea v-model="form.reason" class="ta" placeholder="请输入请假事由…" style="width:100%;border:none;outline:none;resize:none"></textarea>
      <div v-if="conflict.length" class="conflict">
        ⚠ 该时段内有 <b>{{ conflict.length }} 节已约课程</b>，提交后请与会员沟通取消后重新预约（系统无改期功能）。
      </div>
      <button class="btn" :disabled="submitting" @click="submit">{{ submitting ? '提交中…' : '提交请假' }}</button>
    </div>
  </div>
</template>
