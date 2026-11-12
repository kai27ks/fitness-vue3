<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, getRole, type SupportContact } from '../api'

const contact = ref<SupportContact | null>(null)
const phoneHref = computed(() => `tel:${contact.value?.phone.replace(/[^\d+]/g, '') || ''}`)

onMounted(async () => {
  if (!['MEMBER', 'COACH'].includes(getRole())) return
  try {
    contact.value = await api.supportContact()
  } catch {
    // 辅助信息加载失败时隐藏，不干扰「我的」页正常使用。
  }
})
</script>

<template>
  <details v-if="contact" class="support-contact">
    <summary>
      <span>{{ contact.title }}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
    </summary>
    <div class="support-body">
      <p v-if="contact.description" class="support-description">{{ contact.description }}</p>
      <p v-if="contact.developerName" class="support-developer">开发维护：{{ contact.developerName }}</p>
      <a v-if="contact.phone" :href="phoneHref" class="support-link">
        <span class="support-label">联系电话</span>
        <span class="support-value">{{ contact.phone }}</span>
        <span class="support-action">拨打</span>
      </a>
      <a v-if="contact.email" :href="`mailto:${contact.email}`" class="support-link">
        <span class="support-label">联系邮箱</span>
        <span class="support-value">{{ contact.email }}</span>
        <span class="support-action">邮件</span>
      </a>
    </div>
  </details>
</template>

<style scoped>
.support-contact { margin: 10px 16px 0; color: #687582; font-size: 12px; }
summary { min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; list-style: none; }
summary::-webkit-details-marker { display: none; }
summary svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.6; transition: transform .2s; }
details[open] summary svg { transform: rotate(90deg); }
summary:focus-visible, .support-link:focus-visible { outline: 2px solid var(--primary-deep); outline-offset: 3px; border-radius: 6px; }
.support-body { max-width: 400px; margin: 0 auto; padding: 14px; border: 1px solid #E1E7EC; border-radius: 14px; background: #fff; }
.support-description { line-height: 1.8; margin-bottom: 8px; }
.support-developer { margin-bottom: 8px; line-height: 1.8; }
.support-link { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; min-height: 44px; text-decoration: none; color: var(--ink); }
.support-link + .support-link { border-top: 1px solid var(--line); }
.support-label { color: #687582; font-size: 11px; }
.support-value { flex: 1; min-width: 0; overflow-wrap: anywhere; font-size: 13px; }
.support-action { color: var(--primary-deep); font-size: 11px; }
</style>
