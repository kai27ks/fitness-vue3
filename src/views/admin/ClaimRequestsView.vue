<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const list = ref<any[]>([])
const loading = ref(true)
const showBind = ref(false)
const current = ref<any>(null)
const keyword = ref('')
const candidates = ref<any[]>([])
const bindForm = reactive({ memberId: '', note: '' })
const submitting = ref(false)

async function load() {
  loading.value = true
  try { list.value = await api.claimRequests('PENDING') }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
  finally { loading.value = false }
}

async function search() {
  try { candidates.value = await api.adminMembers(keyword.value || undefined) }
  catch (e: any) { toast(e.message) }
}

function openBind(r: any) {
  current.value = r
  bindForm.memberId = ''
  bindForm.note = ''
  keyword.value = r.phoneInput || ''
  candidates.value = []
  showBind.value = true
  search()
}

async function confirmBind() {
  if (!bindForm.memberId) return toast('请选择要绑定的会员')
  if (submitting.value) return
  submitting.value = true
  try {
    await api.bindClaimRequest(current.value.id, {
      memberId: Number(bindForm.memberId),
      note: bindForm.note
    })
    toast('已绑定，会员下次从公众号进入即可自动登录')
    showBind.value = false
    load()
  } catch (e: any) { toast(e.message) }
  finally { submitting.value = false }
}

async function reject(r: any) {
  try { await api.rejectClaimRequest(r.id, '前台核实后驳回'); toast('已驳回'); load() }
  catch (e: any) { toast(e.message) }
}

function fmt(t: string) {
  return t ? String(t).replace('T', ' ').slice(0, 16) : ''
}
function tail(s: string) {
  return s && s.length > 6 ? '***' + s.slice(-6) : (s || '***')
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar title="待核实认领申请" />
    <div class="scroll-area" style="padding: 12px">
      <div class="banner info">
        会员首次从公众号进入时填写的手机号未在档案中命中，会留在这里。请线下核实身份后，绑定至正确会员，或在会员详情里修正建档手机号后让会员重试。
      </div>

      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!list.length" class="empty"><div class="e-ico">✅</div><p>暂无待核实申请</p></div>

      <div v-for="r in list" :key="r.id" class="card" style="padding: 14px; margin-bottom: 12px">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <b style="font-size:15px">{{ r.phoneInput }}</b>
          <span class="pill warn">待核实</span>
        </div>
        <small style="color:var(--sub); display:block; margin-top:6px">
          微信 {{ tail(r.openid) }} · {{ fmt(r.createTime) }}
        </small>
        <div style="display:flex; gap:8px; margin-top:12px">
          <span class="btn-ghost" style="flex:1; justify-content:center" @click="openBind(r)">绑定会员</span>
          <span class="btn-ghost red" style="justify-content:center" @click="reject(r)">驳回</span>
        </div>
      </div>
    </div>

    <div v-if="showBind" style="position:fixed; inset:0; background:rgba(16,24,32,.45); z-index:60; display:flex; align-items:flex-end" @click.self="showBind = false">
      <div class="card" style="width:100%; border-radius:20px 20px 0 0; padding:18px; max-height:80vh; overflow:auto">
        <div style="display:flex; justify-content:space-between; margin-bottom:14px">
          <b>绑定到会员档案</b><span style="cursor:pointer" @click="showBind = false">✕</span>
        </div>
        <div class="banner warn">请确认已线下核实会员身份，再执行绑定。</div>
        <div class="input" style="margin-bottom:10px">
          <input v-model="keyword" placeholder="搜索姓名 / 手机号" @keyup.enter="search" />
          <button class="code" @click="search">搜索</button>
        </div>
        <select v-model="bindForm.memberId" class="input" style="height:44px; margin-bottom:10px">
          <option value="">选择会员</option>
          <option v-for="m in candidates" :key="m.id" :value="m.id">{{ m.name }} · {{ m.phone }}</option>
        </select>
        <div class="input" style="margin-bottom:14px">
          <input v-model="bindForm.note" placeholder="核实备注（选填）" />
        </div>
        <button class="btn" :disabled="submitting" @click="confirmBind">{{ submitting ? '提交中…' : '确认绑定' }}</button>
      </div>
    </div>
  </div>
</template>
