<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'
import NavBar from '../components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const detail = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    detail.value = await api.coachDetail(route.params.id)
  } catch (e: any) {
    if (e.message !== '登录已过期') alert(e.message)
  } finally {
    loading.value = false
  }
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

        <button class="btn" @click="router.push('/booking')">预约{{ detail.coach.name }}</button>
      </div>
    </template>
  </div>
</template>
