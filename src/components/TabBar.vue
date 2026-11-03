<script setup lang="ts">
defineProps<{ active: string }>()

const icons = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  booking: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>',
  pkg: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>',
  mine: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>'
}
const items = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'booking', label: '约课', path: '/booking' },
  { key: 'pkg', label: '课包', path: '/packages' },
  { key: 'mine', label: '我的', path: '/mine' }
]
</script>

<template>
  <nav class="tabbar">
    <router-link
      v-for="it in items"
      :key="it.key"
      :to="it.path"
      class="tab"
      :class="{ on: active === it.key }"
    >
      <svg viewBox="0 0 24 24" v-html="(icons as any)[it.key]"></svg>
      <span>{{ it.label }}</span>
      <i class="dot"></i>
    </router-link>
  </nav>
</template>
