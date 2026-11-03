<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const coaches = ref<any[]>([])
const submitting = ref(false)
const form = reactive({ name: '', phone: '', gender: 1, birthday: '', coachId: '', password: '123456' })

async function submit() {
  if (!form.name || !/^1\d{10}$/.test(form.phone)) return toast('请填写姓名与正确手机号')
  submitting.value = true
  try {
    await api.createMember({
      name: form.name,
      phone: form.phone,
      gender: Number(form.gender),
      birthday: form.birthday || null,
      coachId: form.coachId ? Number(form.coachId) : null,
      password: form.password
    })
    toast('会员已创建，默认密码 123456')
    router.replace('/admin/members')
  } catch (e: any) { toast(e.message) } finally { submitting.value = false }
}

onMounted(async () => {
  try { coaches.value = await api.adminCoaches() } catch { /* ignore */ }
})
</script>

<template>
  <div class="page">
    <NavBar title="添加会员" />
    <div class="scroll-area">
      <div class="form-page">
        <div class="input">👤 <input v-model="form.name" placeholder="姓名" /></div>
        <div class="input">📱 <input v-model="form.phone" maxlength="11" placeholder="手机号（登录账号）" inputmode="numeric" /></div>
        <div class="input">⚥
          <select v-model="form.gender" style="flex:1;border:none;outline:none;background:transparent;font-size:15px;color:var(--ink)">
            <option :value="1">男</option>
            <option :value="2">女</option>
          </select>
        </div>
        <div class="input">🎂 <input v-model="form.birthday" type="date" placeholder="生日" style="flex:1;border:none;outline:none;background:transparent;font-size:15px;color:var(--ink)" /></div>
        <div class="input">🏋
          <select v-model="form.coachId" style="flex:1;border:none;outline:none;background:transparent;font-size:15px;color:var(--ink)">
            <option value="">选择专属教练（1V1）</option>
            <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="input">🔒 <input v-model="form.password" placeholder="初始密码（默认 123456）" /></div>
        <div class="banner info">已建会员档案并生成登录账号，可由会员用手机号+密码登录自助约课。</div>
        <button class="btn" :disabled="submitting" @click="submit">{{ submitting ? '提交中…' : '保存会员' }}</button>
      </div>
    </div>
  </div>
</template>
