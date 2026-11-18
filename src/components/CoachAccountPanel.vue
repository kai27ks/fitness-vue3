<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { api, type CoachAccount, type CoachWechatBind } from '../api'
import { toast } from '../utils'

const props = defineProps<{ coachId: number }>()
const account = ref<CoachAccount | null>(null)
const wxBind = ref<CoachWechatBind | null>(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const showSetup = ref(false)
const showReset = ref(false)
const setup = reactive({ mode: 'CREATE' as 'CREATE' | 'BIND', phone: '', password: '', confirmPassword: '' })
const reset = reactive({ password: '', confirmPassword: '' })
const bound = computed(() => account.value?.state === 'BOUND')
const statusText = computed(() => account.value?.state === 'MISSING' ? '关联异常' : !bound.value ? '未开通登录账号' : account.value?.status === 1 ? '可登录' : '账号已停用')
const roleText = computed(() => account.value?.role === 'ADMIN' ? '管理员（兼任教练）' : account.value?.role === 'COACH' ? '教练' : '其他角色')
const wxBindText = computed(() => !wxBind.value ? '绑定状态读取中' : wxBind.value.bound ? '微信已绑定' : '微信未绑定')
const wxBindDetail = computed(() => {
  const w = wxBind.value
  if (!w) return ''
  if (!w.bound) return '教练从公众号进入时，需用手机号 + 密码完成绑定。'
  return `已绑定微信${w.nickname ? `（${w.nickname}）` : ''}${w.openidTail ? `，标识尾号 ${w.openidTail}` : ''}。`
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    account.value = await api.coachAccount(props.coachId)
    wxBind.value = await api.coachWechatBind(props.coachId)
  } catch (e: any) { error.value = e.message || '账号信息加载失败' }
  finally { loading.value = false }
}

async function unbindWechat() {
  if (saving.value) return
  if (!confirm('解绑后该教练从公众号进入需重新用手机号 + 密码绑定，确认解绑？')) return
  saving.value = true
  try {
    await api.unbindCoachWechat(props.coachId)
    toast('已解绑微信')
    load()
  } catch (e: any) { toast(e.message) }
  finally { saving.value = false }
}

function clearSetup() {
  showSetup.value = false
  setup.phone = ''; setup.password = ''; setup.confirmPassword = ''; setup.mode = 'CREATE'
}

function validPassword(password: string, confirmation: string) {
  if (password.length < 6 || password.length > 64 || !password.trim()) {
    toast('请设置6～64位密码'); return false
  }
  if (password !== confirmation) { toast('两次输入的密码不一致'); return false }
  return true
}

async function saveAccount() {
  if (saving.value) return
  const phone = setup.phone.trim()
  if (!/^1\d{10}$/.test(phone)) return toast('请输入正确的11位手机号')
  if (setup.mode === 'CREATE' && !validPassword(setup.password, setup.confirmPassword)) return
  saving.value = true
  try {
    account.value = await api.configureCoachAccount(props.coachId, {
      mode: setup.mode, phone,
      ...(setup.mode === 'CREATE' ? { initialPassword: setup.password } : {})
    })
    toast(setup.mode === 'CREATE' ? '登录账号已开通，请将初始密码线下告知教练' : '教练账号已关联')
    clearSetup()
  } catch (e: any) { toast(e.message) }
  finally { saving.value = false }
}

async function resetPassword() {
  if (saving.value || !validPassword(reset.password, reset.confirmPassword)) return
  saving.value = true
  try {
    await api.resetCoachPassword(props.coachId, reset.password)
    toast('密码已重置，请将新密码线下告知教练')
    reset.password = ''; reset.confirmPassword = ''; showReset.value = false
  } catch (e: any) { toast(e.message) }
  finally { saving.value = false }
}

function cancelReset() {
  showReset.value = false; reset.password = ''; reset.confirmPassword = ''
}

onMounted(load)
</script>

<template>
  <section class="card coach-account" aria-label="教练登录账号">
    <div class="account-heading"><h2>登录账号</h2><span v-if="account && !loading && !error" class="pill" :class="bound && account.status === 1 ? 'wait' : 'warn'">{{ statusText }}</span></div>
    <p v-if="loading" class="account-note" role="status">正在读取账号信息…</p>
    <div v-else-if="error" class="account-error" role="alert"><p>{{ error }}</p><button class="btn-ghost" type="button" @click="load">重新加载</button></div>
    <template v-else-if="account">
      <template v-if="bound">
        <dl class="account-info"><div><dt>登录手机号</dt><dd>{{ account.phone }}</dd></div><div><dt>账号角色</dt><dd>{{ roleText }}</dd></div></dl>
        <p class="account-note">教练使用这个手机号和密码，在统一登录页登录。</p>
        <div class="wechat-bind">
          <div class="wechat-bind-head"><span>公众号微信绑定</span><span class="pill" :class="wxBind?.bound ? 'wait' : 'warn'">{{ wxBindText }}</span></div>
          <p class="account-note">{{ wxBindDetail }}</p>
          <button v-if="wxBind?.bound" class="btn-ghost" type="button" :disabled="saving" @click="unbindWechat">解绑微信</button>
        </div>
        <button v-if="account.role === 'COACH' && !showReset" class="btn-ghost" type="button" @click="showReset = true">重置登录密码</button>
        <p v-if="account.role !== 'COACH'" class="account-note">此账号保留原有角色，密码由对应的账号管理流程维护。</p>
        <form v-if="showReset" class="account-form" @submit.prevent="resetPassword">
          <p class="account-note">原密码无法查看。设置新密码后，请线下告知教练。</p>
          <label :for="`coach-reset-${coachId}`">新密码</label>
          <input :id="`coach-reset-${coachId}`" v-model="reset.password" class="input" type="password" autocomplete="new-password" minlength="6" maxlength="64" required placeholder="6～64位密码" :disabled="saving" />
          <label :for="`coach-reset-confirm-${coachId}`">再次输入新密码</label>
          <input :id="`coach-reset-confirm-${coachId}`" v-model="reset.confirmPassword" class="input" type="password" autocomplete="new-password" minlength="6" maxlength="64" required :disabled="saving" />
          <div class="account-actions"><button type="button" class="btn-ghost" :disabled="saving" @click="cancelReset">取消</button><button class="btn" type="submit" :disabled="saving">{{ saving ? '保存中…' : '确认重置密码' }}</button></div>
        </form>
      </template>
      <template v-else>
        <p class="account-note">{{ account.state === 'MISSING' ? '原关联账号已不存在，请重新创建或关联。' : '目前只有教练档案，尚不能以教练身份登录。' }}</p>
        <button v-if="!showSetup" class="btn-ghost" type="button" @click="showSetup = true">开通 / 关联登录账号</button>
        <form v-if="showSetup" class="account-form" @submit.prevent="saveAccount">
          <fieldset class="account-modes" :disabled="saving"><legend>开通方式</legend><label><input v-model="setup.mode" type="radio" value="CREATE" @change="setup.password = ''; setup.confirmPassword = ''" /> 创建新账号</label><label><input v-model="setup.mode" type="radio" value="BIND" @change="setup.password = ''; setup.confirmPassword = ''" /> 关联已有教练账号</label></fieldset>
          <p class="account-note">{{ setup.mode === 'CREATE' ? '使用教练本人手机号开通账号，并设置初始密码。' : '输入已有教练账号的手机号。关联后沿用该账号原密码；一个账号只能关联一位教练。' }}</p>
          <label :for="`coach-phone-${coachId}`">登录手机号</label>
          <input :id="`coach-phone-${coachId}`" v-model="setup.phone" class="input" type="tel" inputmode="tel" autocomplete="off" maxlength="11" required placeholder="教练本人11位手机号" :disabled="saving" />
          <template v-if="setup.mode === 'CREATE'">
            <label :for="`coach-password-${coachId}`">初始密码</label>
            <input :id="`coach-password-${coachId}`" v-model="setup.password" class="input" type="password" autocomplete="new-password" minlength="6" maxlength="64" required placeholder="6～64位密码" :disabled="saving" />
            <label :for="`coach-confirm-${coachId}`">再次输入初始密码</label>
            <input :id="`coach-confirm-${coachId}`" v-model="setup.confirmPassword" class="input" type="password" autocomplete="new-password" minlength="6" maxlength="64" required :disabled="saving" />
          </template>
          <div class="account-actions"><button class="btn-ghost" type="button" :disabled="saving" @click="clearSetup">取消</button><button class="btn" type="submit" :disabled="saving">{{ saving ? '保存中…' : setup.mode === 'CREATE' ? '创建并关联' : '确认关联账号' }}</button></div>
        </form>
      </template>
    </template>
  </section>
</template>

<style scoped>
.coach-account { margin-top: 14px; padding: 16px; }
.account-heading { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: center; }
.account-heading h2 { font-size: 15px; }
.account-info { margin-top: 14px; }
.account-info div { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 10px; font-size: 13px; }
.account-info dt { color: #687582; }
.account-info dd { font-weight: 600; overflow-wrap: anywhere; }
.account-note { color: #687582; font-size: 12px; line-height: 1.8; margin: 12px 0; }
.wechat-bind { margin-top: 14px; border-top: 1px solid var(--line); padding-top: 14px; }
.wechat-bind-head { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; }
.wechat-bind .account-note { margin: 10px 0; }
.account-error { font-size: 13px; color: var(--warn); display: grid; gap: 12px; margin-top: 14px; }
.account-form { display: grid; gap: 10px; margin-top: 14px; border-top: 1px solid var(--line); padding-top: 14px; }
.account-form > label { font-size: 12px; font-weight: 600; }
.account-form .input { width: 100%; min-width: 0; height: 44px; padding: 0 12px; border: 1px solid #DCE3E9; font-size: 14px; }
.account-form .account-note { margin: 0; }
.account-modes { border: 0; display: flex; flex-wrap: wrap; gap: 8px 14px; font-size: 12px; }
.account-modes legend { margin-bottom: 10px; font-weight: 600; }
.account-modes label { min-height: 32px; display: inline-flex; align-items: center; gap: 6px; }
.account-actions { display: flex; gap: 10px; margin-top: 4px; }
.account-actions button { flex: 1; height: 44px; justify-content: center; font-size: 13px; letter-spacing: 0; }
button { cursor: pointer; }
button:disabled { opacity: .6; cursor: wait; }
input:focus-visible, button:focus-visible { outline: 2px solid var(--primary-deep); outline-offset: 2px; }
</style>
