<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const router = useRouter()
const list = ref<any[]>([])
const loading = ref(true)
const showAdd = ref(false)
const form = reactive({ name: '', phone: '', intro: '' })

async function load() {
  loading.value = true
  try { list.value = await api.adminCoaches() }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
}

async function submit() {
  if (!form.name.trim()) return toast('请填写教练姓名')
  try {
    await api.createCoach({ name: form.name.trim(), phone: form.phone || null, intro: form.intro || null })
    toast('教练已新增，默认密码 123456')
    showAdd.value = false
    form.name = ''; form.phone = ''; form.intro = ''
    load()
  } catch (e: any) { toast(e.message) }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar title="教练管理" :right="'＋'" @right="showAdd = !showAdd" />
    <div class="scroll-area" style="padding-top:6px">
      <div v-if="showAdd" class="card" style="padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px">
        <input v-model="form.name" class="input" style="height:42px" placeholder="教练姓名" />
        <input v-model="form.phone" class="input" style="height:42px" placeholder="手机号（登录账号，可空）" />
        <input v-model="form.intro" class="input" style="height:42px" placeholder="简介" />
        <button class="btn-ghost" style="justify-content:center" @click="submit">确认新增</button>
      </div>
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!list.length" class="empty"><div class="e-ico">🧑‍🏫</div><p>暂无教练</p></div>
      <router-link v-for="c in list" :key="c.id" class="m-row" :to="`/admin/coaches/${c.id}`">
        <div class="avatar" style="width:48px;height:48px;font-size:16px">{{ (c.name || '教')[0] }}</div>
        <div class="info">
          <div class="n"><b>{{ c.name }}</b><span class="pill" :class="c.status === 1 ? 'wait' : 'cancel'">{{ c.status === 1 ? '在职' : '停用' }}</span></div>
          <small>{{ c.intro || '暂无简介' }}</small>
        </div>
        <span class="arr" style="color:#C6CDD5">›</span>
      </router-link>
    </div>
  </div>
</template>
