<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const isEdit = !!route.params.id
const submitting = ref(false)
const form = reactive({ name: '', durationMin: 60, defaultSessions: 30 })

async function submit() {
  if (!form.name.trim()) return toast('请填写课程名称')
  submitting.value = true
  try {
    const payload = { name: form.name.trim(), durationMin: Number(form.durationMin), defaultSessions: Number(form.defaultSessions) }
    if (isEdit) {
      await api.updateCourse(Number(route.params.id), payload)
      toast('已保存')
    } else {
      await api.createCourse(payload)
      toast('课程已创建')
    }
    router.replace('/admin/courses')
  } catch (e: any) { toast(e.message) } finally { submitting.value = false }
}

onMounted(async () => {
  if (!isEdit) return
  try {
    const list = await api.courses()
    const c = list.find((x: any) => String(x.id) === String(route.params.id))
    if (c) { form.name = c.name; form.durationMin = c.durationMin; form.defaultSessions = c.defaultSessions }
  } catch { /* ignore */ }
})
</script>

<template>
  <div class="page">
    <NavBar :title="isEdit ? '编辑课程' : '新增课程'" />
    <div class="scroll-area">
      <div class="form-page">
        <div class="input">📚 <input v-model="form.name" placeholder="课程名称（如 基础私教）" /></div>
        <div class="input">⏱ <input v-model.number="form.durationMin" type="number" placeholder="单节时长（分钟）" /></div>
        <div class="input">🔢 <input v-model.number="form.defaultSessions" type="number" placeholder="默认课节数" /></div>
        <div class="banner info">课程模板只定义名称与时长，不设价格与固定排期；教练不排班，上课时间由会员预约决定。</div>
        <button class="btn" :disabled="submitting" @click="submit">{{ submitting ? '保存中…' : (isEdit ? '保存' : '创建课程') }}</button>
      </div>
    </div>
  </div>
</template>
