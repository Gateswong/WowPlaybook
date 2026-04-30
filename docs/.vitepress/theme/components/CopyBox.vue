<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vitepress'

const props = defineProps<{
  title: string
  file: string
}>()

const route = useRoute()

const allConfigs = import.meta.glob('../../../**/*.txt', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

const content = computed(() => {
  // Derive directory from current route: "/Setup/ui" → "Setup/"
  const routePath = route.path.replace(/\.html$/, '')
  const slashIdx = routePath.lastIndexOf('/')
  const dir = slashIdx > 0 ? routePath.substring(1, slashIdx + 1) : ''
  const key = `../../../${dir}${props.file}.txt`
  return allConfigs[key] ?? ''
})

const copied = ref(false)

async function copyText() {
  if (!content.value) return
  await navigator.clipboard.writeText(content.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="copy-box">
    <p class="copy-box-title">{{ title }}</p>
    <button class="copy-box-btn" :class="{ copied }" @click="copyText">
      {{ copied ? '已复制' : '复制' }}
    </button>
  </div>
</template>

<style scoped>
.copy-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-1);
  margin: 12px 0;
}

.copy-box-title {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  flex: 1;
}

.copy-box-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-brand-1);
  background: transparent;
  color: var(--vp-c-brand-1);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.copy-box-btn:hover {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.copy-box-btn.copied {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  cursor: default;
}
</style>
