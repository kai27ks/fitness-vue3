<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { api, getRole, type CoachAccount } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const isAdmin = getRole() === 'ADMIN'
const list = ref<any[]>([])
const keyword = ref('')
const accounts = ref<CoachAccount[]>([])
const accountsLoaded = ref(false)
const accountError = ref('')
const loading = ref(true)
const showAdd = ref(false)
const saving = ref(false)
const createLogin = ref(true)
const form = reactive({ name: '', phone: '', intro: '', initialPassword: '', confirmPassword: '' })
const accountMap = computed(() => new Map(accounts.value.map(a => [a.coachId, a])))
const filtered = computed(() => {
  const query = keyword.value.trim()
  return list.value.filter(c => c.name.includes(query) || (accountMap.value.get(c.id)?.phone || '').includes(query))
})

function accountLabel(id: number) {
  const account = accountMap.value.get(id)
  if (!accountsLoaded.value || !account) return '账号信息待核对'
  if (account.state === 'MISSING') return '关联账号异常 · 点击修复'
  if (account.state === 'UNBOUND') return '未开通登录账号 · 点击设置'
  return `登录账号：${account.phone}${account.status === 1 ? '' : '（已停用）'}`
}

async function load() {
  loading.value = true
  accountError.value = ''; accountsLoaded.value = false
  try {
    const [coachesResult, accountsResult] = await Promise.allSettled([
      api.adminCoaches(), isAdmin ? api.coachAccounts() : Promise.resolve([])
    ])
    if (coachesResult.status === 'rejected') throw coachesResult.reason
    list.value = coachesResult.value
    if (accountsResult.status === 'fulfilled') {
      accounts.value = accountsResult.value; accountsLoaded.value = true
    } else {
      accounts.value = []; accountError.value = accountsResult.reason?.message || '登录账号信息加载失败'
    }
  }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) } finally { loading.value = false }
}

async function submit() {
  if (saving.value) return
  if (!form.name.trim()) return toast('请填写教练姓名')
  if (createLogin.value) {
    if (!/^1\d{10}$/.test(form.phone.trim())) return toast('请输入正确的11位手机号')
    if (form.initialPassword.length < 8 || form.initialPassword.length > 64 || !form.initialPassword.trim()) return toast('请设置8～64位初始密码')
    if (form.initialPassword !== form.confirmPassword) return toast('两次输入的密码不一致')
  }
  saving.value = true
  try {
    await api.createCoach({
      name: form.name.trim(), intro: form.intro || null,
      phone: createLogin.value ? form.phone.trim() : null,
      initialPassword: createLogin.value ? form.initialPassword : null
    })
    toast(createLogin.value ? '教练及登录账号已创建，请线下告知初始密码' : '教练档案已新增，尚未开通登录账号')
    showAdd.value = false
    form.name = ''; form.phone = ''; form.intro = ''; form.initialPassword = ''; form.confirmPassword = ''
    createLogin.value = true
    load()
  } catch (e: any) { toast(e.message) }
  finally { saving.value = false }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar title="教练管理" :right="isAdmin ? '＋' : ''" @right="isAdmin && (showAdd = !showAdd)" />
    <div class="scroll-area" style="padding-top:6px">
      <form v-if="isAdmin && showAdd" class="card coach-create" @submit.prevent="submit">
        <label for="coach-name">教练姓名</label><input id="coach-name" v-model="form.name" class="input" maxlength="30" required :disabled="saving" />
        <label for="coach-intro">教练简介</label><input id="coach-intro" v-model="form.intro" class="input" :disabled="saving" />
        <label class="create-login"><input v-model="createLogin" type="checkbox" :disabled="saving" @change="form.initialPassword = ''; form.confirmPassword = ''" /> 同时开通登录账号</label>
        <template v-if="createLogin">
          <label for="coach-create-phone">登录手机号</label><input id="coach-create-phone" v-model="form.phone" class="input" type="tel" inputmode="tel" maxlength="11" required :disabled="saving" placeholder="教练本人手机号" />
          <label for="coach-create-password">初始密码</label><input id="coach-create-password" v-model="form.initialPassword" class="input" type="password" autocomplete="new-password" minlength="8" maxlength="64" required :disabled="saving" placeholder="8～64位密码" />
          <label for="coach-create-confirm">再次输入初始密码</label><input id="coach-create-confirm" v-model="form.confirmPassword" class="input" type="password" autocomplete="new-password" minlength="8" maxlength="64" required :disabled="saving" />
        </template>
        <p v-else class="create-note">仅建立教练档案，之后可在教练详情中开通或关联登录账号。</p>
        <button class="btn-ghost" type="submit" :disabled="saving" style="justify-content:center">{{ saving ? '保存中…' : '确认新增' }}</button>
      </form>
      <div class="search"><input v-model="keyword" :placeholder="isAdmin ? '搜索教练姓名 / 登录手机号' : '搜索教练姓名'" :aria-label="isAdmin ? '搜索教练姓名或登录手机号' : '搜索教练姓名'" /></div>
      <div v-if="isAdmin && accountError" class="banner warn" role="alert">{{ accountError }} <button type="button" class="retry-accounts" @click="load">重试</button></div>
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="!filtered.length" class="empty"><div class="e-ico">🧑‍🏫</div><p>{{ keyword.trim() ? '没有匹配的教练' : '暂无教练' }}</p></div>
      <router-link v-for="c in filtered" v-else :key="c.id" class="m-row" :to="`/admin/coaches/${c.id}`">
        <div class="avatar" style="width:48px;height:48px;font-size:16px">{{ (c.name || '教')[0] }}</div>
        <div class="info">
          <div class="n"><b>{{ c.name }}</b><span class="pill" :class="c.status === 1 ? 'wait' : 'cancel'">{{ c.status === 1 ? '在职' : '停用' }}</span></div>
          <small>{{ c.intro || '暂无简介' }}</small>
          <small v-if="isAdmin" class="login-account" :class="{ unbound: accountMap.get(c.id)?.state !== 'BOUND' }">{{ accountLabel(c.id) }}</small>
        </div>
        <span class="arr" style="color:#C6CDD5">›</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.coach-create { padding: 14px; margin-bottom: 12px; display: grid; gap: 10px; }
.coach-create > label { font-size: 12px; font-weight: 600; }
.coach-create .input { width: 100%; min-width: 0; height: 44px; padding: 0 12px; font-size: 14px; border: 1px solid #DCE3E9; }
.create-login { display: flex; align-items: center; gap: 8px; min-height: 36px; }
.create-note { font-size: 12px; color: #687582; line-height: 1.8; }
.info .login-account { color: var(--primary-deep); margin-top: 7px; overflow-wrap: anywhere; }
.info .login-account.unbound { color: #99622D; }
.retry-accounts { border: 0; background: none; color: inherit; text-decoration: underline; cursor: pointer; }
button:disabled { opacity: .6; cursor: wait; }
</style>
