<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../../api'
import { BOOKING_STATUS, parseBookingTime, toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const route = useRoute()
const id = Number(route.params.id)
const data = ref<any>(null)
const loading = ref(true)
const coaches = ref<any[]>([])
const courses = ref<any[]>([])
const showAdd = ref(false)
const addForm = reactive({ courseId: '', totalSessions: 30, totalPrice: 9600 })

const showEdit = ref(false)
const saving = ref(false)
const editForm = reactive({ name: '', phone: '', gender: 1, birthday: '' })
const claimCode = ref<any>(null)
const bindInfo = ref<any>(null)

const member = computed(() => data.value?.member || {})
const packages = computed(() => data.value?.packages || [])
const bookings = computed(() => data.value?.bookings || [])
const coachName = computed(() => data.value?.coach?.name || '未绑定')

async function loadExtra() {
  try { claimCode.value = await api.claimCode(id) } catch { claimCode.value = null }
  try { bindInfo.value = await api.wechatBindInfo(id) } catch { bindInfo.value = null }
}

async function load() {
  loading.value = true
  try { data.value = await api.memberDetail(id) }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
  finally { loading.value = false }
  loadExtra()
}

async function rebind(e: any) {
  const coachId = Number(e.target.value)
  if (!coachId) return
  try { await api.rebindCoach(id, coachId, '管理端改绑'); toast('已改绑'); load() }
  catch (err: any) { toast(err.message) }
}

async function adjust(p: any, delta: number) {
  try { await api.adjustPackage(p.id, delta, '管理端调整'); toast(delta > 0 ? '已增加 1 节' : '已扣减 1 节'); load() }
  catch (e: any) { toast(e.message) }
}

async function addPackage() {
  if (!addForm.courseId) return toast('请选择课程')
  try {
    await api.addPackage(id, {
      courseId: Number(addForm.courseId),
      totalSessions: Number(addForm.totalSessions),
      totalPrice: Number(addForm.totalPrice)
    })
    toast('课包已添加'); showAdd.value = false; load()
  } catch (e: any) { toast(e.message) }
}

function openEdit() {
  editForm.name = member.value.name || ''
  editForm.phone = member.value.phone || ''
  editForm.gender = member.value.gender || 1
  editForm.birthday = member.value.birthday || ''
  showEdit.value = true
}

async function saveEdit() {
  if (!editForm.name) return toast('请填写姓名')
  if (!/^1\d{10}$/.test(editForm.phone)) return toast('请输入正确的手机号')
  if (saving.value) return
  saving.value = true
  try {
    await api.updateMember(id, {
      name: editForm.name,
      phone: editForm.phone,
      gender: Number(editForm.gender),
      birthday: editForm.birthday || null
    })
    toast('资料已保存')
    showEdit.value = false
    load()
  } catch (e: any) { toast(e.message) }
  finally { saving.value = false }
}

async function resetCode() {
  try { claimCode.value = await api.resetClaimCode(id); toast('认领码已重置，请线下交给会员') }
  catch (e: any) { toast(e.message) }
}

async function unbind() {
  try { await api.unbindWechat(id); toast('已解绑微信'); loadExtra() }
  catch (e: any) { toast(e.message) }
}

onMounted(async () => {
  load()
  try { coaches.value = await api.adminCoaches(); courses.value = await api.courses() } catch { /* ignore */ }
})
</script>

<template>
  <div class="page">
    <NavBar title="会员详情" :right="'编辑'" @right="openEdit" />
    <div v-if="loading" class="loading">加载中…</div>
    <template v-else-if="data">
      <div class="scroll-area" style="padding-top:6px">
        <div class="m-row" style="padding:16px">
          <div class="avatar" style="width:52px;height:52px;font-size:17px">{{ (member.name || '会')[0] }}</div>
          <div class="info">
            <div class="n"><b>{{ member.name }}</b><span class="pill info">{{ member.gender === 2 ? '女' : '男' }}</span></div>
            <small>{{ member.phone }} · 生日 {{ member.birthday || '未填' }}</small>
          </div>
        </div>

        <div class="card" style="padding:14px;margin-top:12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b style="font-size:14px">公众号认领码</b>
            <span class="pill" :class="claimCode && !claimCode.used ? 'wait' : 'cancel'">
              {{ claimCode && !claimCode.used ? '可用' : '已用 / 未生成' }}
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
            <b style="font-size:24px;letter-spacing:5px;color:var(--primary-deep)">{{ claimCode?.code || '------' }}</b>
            <span class="btn-ghost" style="height:30px;padding:0 12px;font-size:12px" @click="resetCode">重置</span>
          </div>
          <small style="color:var(--sub);display:block;margin-top:8px">
            有效期至 {{ claimCode?.expireAt || '—' }} · 请核对会员身份后线下交付
          </small>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;border-top:1px solid #EEF1F4;padding-top:12px">
            <span style="font-size:13px">微信绑定：{{ bindInfo?.bound ? bindInfo.openidTail : '未绑定' }}</span>
            <span v-if="bindInfo?.bound" class="btn-ghost red" style="height:28px;padding:0 10px;font-size:12px" @click="unbind">解绑</span>
          </div>
        </div>

        <div class="search" style="margin-top:12px">
          <span style="white-space:nowrap">专属教练</span>
          <b style="color:var(--ink)">{{ coachName }}</b>
          <select style="margin-left:auto;border:none;background:transparent;color:var(--primary-deep);font-size:13px" @change="rebind">
            <option value="">改绑</option>
            <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="sec-title"><b>课包</b><a @click="showAdd = !showAdd">＋ 增购</a></div>
        <div v-if="showAdd" class="card" style="padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px">
          <select v-model="addForm.courseId" class="input" style="height:42px">
            <option value="">选择课程</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}（{{ c.durationMin }}分钟）</option>
          </select>
          <input v-model.number="addForm.totalSessions" class="input" style="height:42px" type="number" placeholder="总节数" />
          <input v-model.number="addForm.totalPrice" class="input" style="height:42px" type="number" placeholder="总价" />
          <button class="btn-ghost" style="justify-content:center" @click="addPackage">确认增购</button>
        </div>
        <div v-for="p in packages" :key="p.id" class="lesson">
          <div class="avatar" style="background:linear-gradient(135deg,#12C48B,#0B8F7E);color:#fff">{{ p.remainSessions }}</div>
          <div class="info">
            <b>{{ p.courseName }} · 剩余 {{ p.remainSessions }} / {{ p.totalSessions }} 节</b>
            <small>有效期至 {{ p.expireDate }} · ¥{{ p.totalPrice }}</small>
          </div>
          <div style="display:flex;gap:6px">
            <span class="btn-ghost" style="height:28px;padding:0 10px;font-size:12px;cursor:pointer" @click="adjust(p, 1)">+1</span>
            <span class="btn-ghost red" style="height:28px;padding:0 10px;font-size:12px;cursor:pointer" @click="adjust(p, -1)">-1</span>
          </div>
        </div>
        <div v-if="!packages.length" class="banner info">暂无课包，点击「增购」添加。</div>

        <div class="sec-title"><b>预约记录</b></div>
        <div v-for="b in bookings" :key="b.id" class="lesson">
          <div class="avatar">{{ (b.courseName || '课')[0] }}</div>
          <div class="info"><b>{{ b.courseName || '课程' }}</b><small>{{ parseBookingTime(b.startTime, b.endTime).date }} {{ parseBookingTime(b.startTime, b.endTime).time }} - {{ parseBookingTime(b.startTime, b.endTime).end }}</small></div>
          <span class="pill" :class="(BOOKING_STATUS[b.status] || { cls: 'wait' }).cls">{{ (BOOKING_STATUS[b.status] || { text: b.status }).text }}</span>
        </div>
        <div v-if="!bookings.length" class="banner info">暂无预约记录。</div>
      </div>
    </template>

    <div v-if="showEdit" style="position:fixed;inset:0;background:rgba(16,24,32,.45);z-index:60;display:flex;align-items:flex-end" @click.self="showEdit = false">
      <div class="card" style="width:100%;border-radius:20px 20px 0 0;padding:18px">
        <div style="display:flex;justify-content:space-between;margin-bottom:14px">
          <b>编辑会员资料</b><span style="cursor:pointer" @click="showEdit = false">✕</span>
        </div>
        <div class="banner warn">修改手机号前请核对会员身份；手机号同时用于账号登录与微信认领。</div>
        <div class="input" style="margin-bottom:10px">👤 <input v-model="editForm.name" placeholder="姓名" /></div>
        <div class="input" style="margin-bottom:10px">📱 <input v-model="editForm.phone" maxlength="11" placeholder="手机号" inputmode="numeric" /></div>
        <div class="input" style="margin-bottom:10px">⚥
          <select v-model="editForm.gender" style="flex:1;border:none;outline:none;background:transparent;font-size:15px;color:var(--ink)">
            <option :value="1">男</option>
            <option :value="2">女</option>
          </select>
        </div>
        <div class="input" style="margin-bottom:14px">🎂 <input v-model="editForm.birthday" type="date" style="flex:1;border:none;outline:none;background:transparent;font-size:15px;color:var(--ink)" /></div>
        <button class="btn" :disabled="saving" @click="saveEdit">{{ saving ? '保存中…' : '保存资料' }}</button>
      </div>
    </div>
  </div>
</template>
