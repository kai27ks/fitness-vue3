<script setup lang="ts">
import { getRole } from '../api'
defineProps<{ active: 'list' | 'create' }>()
const isCoach = getRole() === 'COACH'
</script>

<template>
  <nav class="staff-booking-tabs" aria-label="预约功能">
    <router-link to="/admin/schedule" :class="{ active: active === 'list' }" :aria-current="active === 'list' ? 'page' : undefined">{{ isCoach ? '我的预约' : '预约管理' }}</router-link>
    <router-link to="/admin/schedule/new" :class="{ active: active === 'create' }" :aria-current="active === 'create' ? 'page' : undefined">替会员约课</router-link>
  </nav>
</template>

<style scoped>
.staff-booking-tabs { display: flex; gap: 4px; padding: 4px; margin: 4px 16px 14px; border-radius: 14px; background: #E9EEF1; }
.staff-booking-tabs a { flex: 1; text-align: center; padding: 12px 6px; font-size: 14px; color: #687582; text-decoration: none; border-radius: 11px; }
.staff-booking-tabs a.active { background: #fff; color: var(--primary-deep); font-weight: 600; box-shadow: 0 3px 8px #17222B0A; }
.staff-booking-tabs a:focus-visible { outline: 2px solid var(--primary-deep); outline-offset: 2px; }
</style>
