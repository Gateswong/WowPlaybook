<template>
  <div class="VPNavBarMenuGroup wowhead-language-switch" ref="dropdownRef">
    <button
      class="language-button VPLink"
      :title="'Wowhead 语言'"
      @click="toggleDropdown"
      :class="{ active: isDropdownOpen }"
    >
      <span class="language-text">{{ currentLanguageLabel }}</span>
      <svg class="arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 15.5l-6-6h12z"/>
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="isDropdownOpen" class="language-dropdown">
        <button
          v-for="lang in languages"
          :key="lang.value"
          class="language-option"
          :class="{ selected: currentLanguage === lang.value }"
          @click="selectLanguage(lang.value)"
        >
          <span class="option-icon">{{ lang.icon }}</span>
          <span class="option-label">{{ lang.label }}</span>
          <span v-if="currentLanguage === lang.value" class="check-mark">✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const STORAGE_KEY = 'wowhead-language'

const languages = [
  { value: 'cn', label: '简体中文', icon: '🇨🇳', domain: 'cn' },
  { value: 'en', label: 'English', icon: '🇺🇸', domain: 'www' },
  { value: 'tw', label: '繁體中文', icon: '🇹🇼', domain: 'tw' }
]

const currentLanguage = ref('cn') // 默认简体中文
const currentLanguageLabel = ref('')
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 更新当前语言显示
function updateCurrentLanguage() {
  const lang = languages.find(l => l.value === currentLanguage.value) || languages[0]
  currentLanguageLabel.value = lang.label
}

// 切换下拉菜单
function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 选择语言
function selectLanguage(value: string) {
  currentLanguage.value = value
  isDropdownOpen.value = false

  // 保存到 localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, currentLanguage.value)

    // 触发自定义事件通知语言变更
    window.dispatchEvent(new CustomEvent('wowhead-language-change', {
      detail: { language: currentLanguage.value }
    }))

    // 刷新 Wowhead tooltips
    if ((window as any).$WowheadPower) {
      (window as any).$WowheadPower.refreshLinks()
    }
  }
}

// 点击外部关闭下拉菜单
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

// 从 localStorage 加载语言设置
onMounted(() => {
  if (typeof window !== 'undefined') {
    const savedLanguage = localStorage.getItem(STORAGE_KEY)
    if (savedLanguage && languages.find(l => l.value === savedLanguage)) {
      currentLanguage.value = savedLanguage
    }
    document.addEventListener('click', handleClickOutside)
  }
  updateCurrentLanguage()
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleClickOutside)
  }
})

// 监听语言变化
watch(currentLanguage, () => {
  updateCurrentLanguage()
})

// 导出获取当前语言的方法供外部使用
defineExpose({
  getCurrentLanguage: () => currentLanguage.value,
  getLanguageDomain: () => {
    const lang = languages.find(l => l.value === currentLanguage.value)
    return lang ? lang.domain : 'tw'
  }
})
</script>

<style scoped>
.wowhead-language-switch {
  position: relative;
  display: flex;
  align-items: center;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  line-height: var(--vp-nav-height);
  transition: color 0.25s;
}

.language-button:hover {
  color: var(--vp-c-brand-1);
}

.language-button.active .arrow-icon {
  transform: rotate(180deg);
}

.language-text {
  white-space: nowrap;
}

.arrow-icon {
  transition: transform 0.25s;
  opacity: 0.6;
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 140px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px;
  box-shadow: var(--vp-shadow-3);
  z-index: 100;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-1);
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  transition: background-color 0.25s;
  text-align: left;
}

.language-option:hover {
  background-color: var(--vp-c-bg-soft);
}

.language-option.selected {
  color: var(--vp-c-brand-1);
}

.option-icon {
  font-size: 16px;
}

.option-label {
  flex: 1;
}

.check-mark {
  color: var(--vp-c-brand-1);
  font-weight: bold;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
