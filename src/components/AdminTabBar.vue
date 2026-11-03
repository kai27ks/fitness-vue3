<script setup lang="ts">
import { computed } from 'vue'
import { getRole } from '../api'

defineProps<{ active: string }>()
const role = getRole()
const items = computed(() => {
  const all = [
    { key: 'workbench', label: '工作台', path: '/admin/workbench' },
    { key: 'schedule', label: '预约', path: '/admin/schedule' },
    { key: 'reports', label: '报表', path: '/admin/reports' },
    { key: 'mine', label: '我的', path: '/admin/mine' }
  ]
  return role === 'COACH' ? all.filter(i => i.key !== 'reports') : all
})
</script>

<template>
  <nav class="tabbar">
    <router-link v-for="it in items" :key="it.key" :to="it.path" class="tab"
                 :class="{ on: active === it.key }">
      <svg v-if="it.key === 'workbench'" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
      <svg v-else-if="it.key === 'schedule'" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
      <svg v-else-if="it.key === 'reports'" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>
      <svg v-else viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      <span>{{ it.label }}</span>
      <i class="dot"></i>
    </router-link>
  </nav>
</template>
