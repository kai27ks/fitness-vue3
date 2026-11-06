<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const coaches = ref<any[]>([])
const submitting = ref(false)
const result = ref<any>(null)
const form = reactive({ name: '', phone: '', gender: 1, birthday: '', coachId: '', password: '123456' })

async function submit() {
  if (!form.name || !/^1\d{10}$/.test(form.phone)) return toast('请填写姓名与正确手机号')
  submitting.value = true
  try {
    result.value = await api.createMember({
      name: form.name,
      phone: form.phone,
      gender: Number(form.gender),
      birthday: form.birthday || null,
      coachId: form.coachId ? Number(form.coachId) : null,
      password: form.password
    })
    toast('会员已创建')
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
        <template v-if="result">
          <div class="card" style="padding:20px;text-align:center">
            <div style="font-size:13px;color:var(--sub)">请把认领码交给 {{ result.name }}</div>
            <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:var(--primary-deep);margin:14px 0">{{ result.claimCode }}</div>
            <div style="font-size:12px;color:var(--sub)">有效期至 {{ result.claimCodeExpireAt }}</div>
            <div class="banner info" style="margin-top:16px;text-align:left">
              会员首次从公众号进入时，需输入建档手机号 <b>{{ result.phone }}</b> 与此认领码完成绑定。认领码用后即失效，可在会员详情里重置。
            </div>
          </div>
          <button class="btn" style="margin-top:16px" @click="router.replace('/admin/members')">完成</button>
        </template>

        <template v-else>
          <div class="input">👤 <input v-model="form.name" placeholder="姓名" /></div>
          <div class="input">📱 <input v-model="form.phone" maxlength="11" placeholder="手机号（请与会员核对）" inputmode="numeric" /></div>
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
          <div class="banner info">保存后会生成 6 位认领码，请线下交给会员，用于公众号首次登录绑定档案。</div>
          <button class="btn" :disabled="submitting" @click="submit">{{ submitting ? '提交中…' : '保存会员' }}</button>
        </template>
      </div>
    </div>
  </div>
</template>
