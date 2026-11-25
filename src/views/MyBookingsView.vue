<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '../api'
import { BOOKING_STATUS, parseBookingTime, timeUntil, toast } from '../utils'
import TabBar from '../components/TabBar.vue'

const tab = ref<'ALL' | 'WAIT' | 'DONE'>('WAIT')
const list = ref<any[]>([])
const loading = ref(true)
const cancelTarget = ref<any>(null)
const reason = ref('')
const submitting = ref(false)
const reviewTarget = ref<any>(null)
const reviewRating = ref(5)
const reviewSubmitting = ref(false)

const RATING_TEXT = ['很不满意', '不满意', '一般', '满意', '非常满意']
const ratingText = computed(() => RATING_TEXT[reviewRating.value - 1] || '')
const starText = (n: number) => '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)))

function askReview(b: any) {
  reviewTarget.value = b
  reviewRating.value = 5
}

async function doReview() {
  if (!reviewTarget.value || reviewSubmitting.value) return
  try {
    reviewSubmitting.value = true
    await api.reviewBooking(reviewTarget.value.id, reviewRating.value)
    toast('感谢评价，已提交满意度')
    reviewTarget.value = null
    await load()
  } catch (e: any) {
    toast(e.message)
    await load()
  } finally {
    reviewSubmitting.value = false
  }
}

async function load() {
  loading.value = true
  try {
    list.value = await api.myBookings(tab.value === 'ALL' ? undefined : tab.value)
  } catch (e: any) {
    if (e.message !== '登录已过期') toast(e.message)
  } finally {
    loading.value = false
  }
}

function statusOf(b: any) {
  return BOOKING_STATUS[b.status] || { text: b.status, cls: 'done' }
}

function askCancel(b: any) {
  cancelTarget.value = b
  reason.value = ''
}

async function doCancel() {
  if (!cancelTarget.value || submitting.value) return
  try {
    submitting.value = true
    await api.cancelBooking(cancelTarget.value.id, reason.value)
    toast('已取消，未扣减课时')
    cancelTarget.value = null
    await load()
  } catch (e: any) {
    toast(e.message)
    await load()
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="nav-top">
      <span class="side plain"></span>
      <span>我的预约</span>
      <span class="side plain"></span>
    </div>

    <div class="my-tabs">
      <span :class="{ on: tab === 'WAIT' }" @click="tab = 'WAIT'; load()">待上课</span>
      <span :class="{ on: tab === 'DONE' }" @click="tab = 'DONE'; load()">已完成</span>
      <span :class="{ on: tab === 'ALL' }" @click="tab = 'ALL'; load()">全部</span>
    </div>

    <div class="scroll-area">
      <div class="banner info" style="margin: 12px">
        通知仅作提醒，请以「我的预约」为准；关注公众号可接收预约成功、改约取消与上课前 24 小时提醒。
      </div>
      <div v-if="loading" class="loading">加载中…</div>

      <div v-else-if="!list.length" class="empty">
        <div class="e-ico">📅</div>
        <p>暂无预约记录</p>
        <p style="margin-top: 12px"><router-link to="/booking"><span class="btn-ghost">去约课</span></router-link></p>
      </div>

      <div v-for="b in list" v-else :key="b.id" class="bk" :style="b.status === 'CANCELED' ? 'opacity: .72' : ''">
        <div class="top">
          <div class="avatar" style="width: 38px; height: 38px; font-size: 14px">{{ (b.coachName || '教')[0] }}</div>
          <b>{{ b.courseName }} · {{ b.coachName }}</b>
          <span class="pill" :class="statusOf(b).cls">{{ statusOf(b).text }}</span>
        </div>
        <div class="meta">
          📅 <b>{{ parseBookingTime(b.startTime, b.endTime).date }}</b>
          {{ parseBookingTime(b.startTime, b.endTime).week }}
          {{ parseBookingTime(b.startTime, b.endTime).time }} - {{ parseBookingTime(b.startTime, b.endTime).end }}
          <span class="right">
            <template v-if="b.status === 'BOOKED'">{{ timeUntil(b.startTime) }}</template>
            <template v-else-if="b.status === 'CANCELED'">{{ b.cancelBy === 'MEMBER' ? '会员取消' : '教练取消' }} · 不扣课时</template>
            <template v-else>已扣 1 节</template>
          </span>
        </div>
        <div class="ops" v-if="b.status === 'BOOKED'">
          <span v-if="b.cancellable" class="btn-ghost red" style="cursor: pointer" @click="askCancel(b)">取消预约</span>
          <span v-else class="btn-ghost red disabled">已过可取消时间</span>
        </div>
        <div class="ops" v-else-if="b.status === 'CHECKED_IN' || b.status === 'COMPLETED'">
          <span v-if="b.rating" class="rated">{{ starText(b.rating) }} 已评价</span>
          <span v-else class="btn-ghost" style="cursor: pointer" @click="askReview(b)">评价教练</span>
        </div>
      </div>
    </div>

    <template v-if="reviewTarget">
      <div class="mask" @click="reviewTarget = null"></div>
      <div class="sheet">
        <div class="grab"></div>
        <h3>评价教练</h3>
        <div class="conf-row">
          <span class="k">课程</span>
          <span class="v">{{ reviewTarget.courseName }} · {{ reviewTarget.coachName }}<small>{{ parseBookingTime(reviewTarget.startTime, reviewTarget.endTime).date }}</small></span>
        </div>
        <div class="conf-row">
          <span class="k">满意度</span>
          <span class="v" style="font-weight: 400">
            <span class="stars">
              <span v-for="n in 5" :key="n" :class="{ on: n <= reviewRating }" @click="reviewRating = n">★</span>
              <small>{{ ratingText }}</small>
            </span>
          </span>
        </div>
        <div class="rule-tip"><span style="color: var(--warn)">!</span>满意度提交后不可修改，请如实评价</div>
        <div style="display: flex; gap: 12px">
          <button class="btn-ghost" style="flex: 1; justify-content: center; height: 48px" @click="reviewTarget = null">取消</button>
          <button class="btn" style="flex: 1" :disabled="reviewSubmitting" @click="doReview">{{ reviewSubmitting ? '提交中…' : '提交评价' }}</button>
        </div>
      </div>
    </template>

    <template v-if="cancelTarget">
      <div class="mask" @click="cancelTarget = null"></div>
      <div class="sheet">
        <div class="grab"></div>
        <h3>取消预约</h3>
        <div class="conf-row">
          <span class="k">课程</span>
          <span class="v">{{ cancelTarget.courseName }}<small>{{ cancelTarget.startTime }}</small></span>
        </div>
        <div class="conf-row">
          <span class="k">取消原因</span>
          <span class="v" style="font-weight: 400"><input v-model="reason" placeholder="选填" style="border: none; outline: none; width: 100%; font-size: 13.5px" /></span>
        </div>
        <div class="rule-tip"><span style="color: var(--warn)">!</span>取消不扣课时；开课前 2 小时内不可取消，请谨慎操作</div>
        <div style="display: flex; gap: 12px">
          <button class="btn-ghost" style="flex: 1; justify-content: center; height: 48px" @click="cancelTarget = null">再想想</button>
          <button class="btn" style="flex: 1" :disabled="submitting" @click="doCancel">{{ submitting ? '提交中…' : '确认取消' }}</button>
        </div>
      </div>
    </template>

    <TabBar active="mine" />
  </div>
</template>
