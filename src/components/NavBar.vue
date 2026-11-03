<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{ title: string; right?: string }>()
const emit = defineEmits<{ (e: 'right'): void }>()
const router = useRouter()
</script>

<template>
  <div class="nav-top">
    <button class="side" @click="router.back()">
      <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
    <span>{{ title }}</span>
    <span class="side plain" style="cursor:pointer" @click="emit('right')">{{ right || '' }}</span>
  </div>
</template>
