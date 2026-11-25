<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api'
import NavBar from '../components/NavBar.vue'

const route = useRoute()
const detail = ref<any>(null)
const rating = ref({ count: 0, average: 0 })
const loading = ref(true)

const ratingStars = computed(() => {
  const n = Math.max(0, Math.min(5, Math.round(rating.value.average || 0)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
})

onMounted(async () => {
  try {
    detail.value = await api.coachDetail(route.params.id)
  } catch (e: any) {
    if (e.message !== '登录已过期') alert(e.message)
  } finally {
    loading.value = false
  }
  try { rating.value = await api.coachRating(route.params.id) } catch { rating.value = { count: 0, average: 0 } }
})
</script>

<template>
  <div class="page" style="padding-bottom: 30px">
    <div v-if="loading" class="loading" style="padding-top: 120px">加载中…</div>

    <template v-else-if="detail">
      <div class="cd-hero">
        <NavBar :title="detail.coach.name" right="" />
        <div class="ava">{{ detail.coach.name[0] }}</div>
        <h2>{{ detail.coach.name }}</h2>
        <div class="cd-rating">
          <span class="rv-stars">{{ ratingStars }}</span>
          <b v-if="rating.count">{{ rating.average }}</b>
          <small>{{ rating.count ? `· ${rating.count} 条评价` : '暂无评价' }}</small>
        </div>
        <div class="tags">
          <span>🏅 专业认证</span>
          <span>1V1 专属</span>
          <span v-if="detail.onLeaveToday">今日请假</span>
        </div>
      </div>

      <div class="cd-body">
        <div class="banner warn" v-if="detail.onLeaveToday">⚠️ {{ detail.coach.name }} 今日请假，不可约课。</div>

        <div class="cd-sec">
          <h4>教练简介</h4>
          <p>{{ detail.intro || '暂无简介' }}</p>
        </div>

        <div class="cd-sec">
          <h4>专业资质（{{ detail.qualifications.length }}）</h4>
          <div v-if="detail.qualifications.length" class="qual-list">
            <div v-for="q in detail.qualifications" :key="q.certNo" class="qual">
              <div class="qi2">🏅</div>
              <div class="t">
                {{ q.name }}
                <small>证书编号 {{ q.certNo }}<template v-if="q.issuer"> · {{ q.issuer }}</template><template v-if="q.expireDate"> · 有效期至 {{ q.expireDate }}</template></small>
              </div>
            </div>
          </div>
          <p v-else>暂无资质信息</p>
        </div>

        <div class="banner info">1V1 课程由系统绑定专属教练，会员不可自行选择教练；约课请从底部「约课」进入。</div>
      </div>
    </template>
  </div>
</template>
