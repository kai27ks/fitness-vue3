<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const route = useRoute()
const id = Number(route.params.id)
const coach = ref<any>(null)
const quals = ref<any[]>([])
const leaves = ref<any[]>([])
const showQual = ref(false)
const showLeave = ref(false)
const q = ref({ name: '', certNo: '', issuer: '', expireDate: '' })
const l = ref({ startTime: '', endTime: '', reason: '' })

async function load() {
  try {
    const coaches = await api.adminCoaches()
    coach.value = coaches.find((c: any) => String(c.id) === String(id)) || null
    quals.value = await api.coachQualifications(id)
    leaves.value = await api.coachLeaves(id)
  } catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
}

async function addQual() {
  if (!q.value.name || !q.value.certNo) return toast('请填写资质名称与编号')
  try {
    await api.addQualification(id, { ...q.value, expireDate: q.value.expireDate || null })
    toast('资质已添加'); showQual.value = false; q.value = { name: '', certNo: '', issuer: '', expireDate: '' }; load()
  } catch (e: any) { toast(e.message) }
}

async function addLeave() {
  if (!l.value.startTime || !l.value.endTime) return toast('请选择请假时段')
  try {
    await api.createLeave(id, { ...l.value, startTime: l.value.startTime + ':00', endTime: l.value.endTime + ':00' })
    toast('请假已提交'); showLeave.value = false; l.value = { startTime: '', endTime: '', reason: '' }; load()
  } catch (e: any) { toast(e.message) }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar :title="coach?.name || '教练详情'" />
    <div v-if="!coach" class="loading">加载中…</div>
    <div v-else class="scroll-area" style="padding-top:6px">
      <div class="m-row" style="padding:16px">
        <div class="avatar" style="width:52px;height:52px;font-size:17px">{{ coach.name[0] }}</div>
        <div class="info"><div class="n"><b>{{ coach.name }}</b><span class="pill wait">在职</span></div><small>{{ coach.intro || '暂无简介' }}</small></div>
      </div>

      <div class="sec-title"><b>专业资质</b><a @click="showQual = !showQual">＋ 添加</a></div>
      <div v-if="showQual" class="card" style="padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px">
        <input v-model="q.name" class="input" style="height:40px" placeholder="资质名称" />
        <input v-model="q.certNo" class="input" style="height:40px" placeholder="证书编号" />
        <input v-model="q.issuer" class="input" style="height:40px" placeholder="发证机构" />
        <input v-model="q.expireDate" type="date" class="input" style="height:40px" />
        <button class="btn-ghost" style="justify-content:center" @click="addQual">保存资质</button>
      </div>
      <div class="card" style="padding:4px 16px">
        <div v-for="x in quals" :key="x.id" class="rank"><span class="name">{{ x.name }}<small style="display:block;color:var(--sub);font-size:11px">{{ x.certNo }} · {{ x.issuer }}</small></span><span class="val">{{ x.expireDate || '长期' }}</span></div>
        <div v-if="!quals.length" style="padding:14px 0;color:var(--sub);font-size:12px">暂无资质</div>
      </div>

      <div class="sec-title"><b>请假记录</b><a @click="showLeave = !showLeave">＋ 请假</a></div>
      <div v-if="showLeave" class="card" style="padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px">
        <input v-model="l.startTime" type="datetime-local" class="input" style="height:40px" />
        <input v-model="l.endTime" type="datetime-local" class="input" style="height:40px" />
        <input v-model="l.reason" class="input" style="height:40px" placeholder="请假事由" />
        <button class="btn-ghost" style="justify-content:center" @click="addLeave">提交请假</button>
      </div>
      <div class="card" style="padding:4px 16px">
        <div v-for="x in leaves" :key="x.id" class="rank"><span class="name">{{ x.startTime?.slice(0, 16) }} → {{ x.endTime?.slice(0, 16) }}<small style="display:block;color:var(--sub);font-size:11px">{{ x.reason || '无' }}</small></span></div>
        <div v-if="!leaves.length" style="padding:14px 0;color:var(--sub);font-size:12px">暂无请假</div>
      </div>
    </div>
  </div>
</template>
