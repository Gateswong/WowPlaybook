import DefaultTheme from 'vitepress/theme'
import { Theme } from 'vitepress'
import { h } from 'vue'
import WowheadLanguageSwitch from './components/WowheadLanguageSwitch.vue'
import './custom.css'

let scriptLoaded = false

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(WowheadLanguageSwitch)
    })
  },
  enhanceApp({ app, router, siteData }) {
    if (typeof window !== 'undefined') {
      // 在 enhanceApp 阶段立即初始化
      initWowheadLinks()

      router.onAfterRouteChange = () => {
        updateWowheadLinks()
        refreshWowheadTooltips()
      }

      // 监听语言变化事件
      window.addEventListener('wowhead-language-change', () => {
        updateWowheadLinks()
        refreshWowheadTooltips()
      })
    }
  }
} satisfies Theme

// 初始化 Wowhead 链接系统
function initWowheadLinks() {
  // 立即加载脚本
  loadWowheadScript()

  // 立即更新链接（同步执行，避免闪烁）
  updateWowheadLinks()

  // 使用 MutationObserver 监听 DOM 变化
  const observer = new MutationObserver((mutations) => {
    // 检查是否有新的 wowhead-link 添加
    let hasNewLinks = false
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.classList?.contains('wowhead-link') ||
                node.querySelector?.('.wowhead-link')) {
              hasNewLinks = true
            }
          }
        })
      }
    }

    if (hasNewLinks) {
      updateWowheadLinks()
      refreshWowheadTooltips()
    }
  })

  // 等待 DOM 准备好后开始观察
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
      updateWowheadLinks()
      refreshWowheadTooltips()
    })
  }
}

function loadWowheadScript() {
  if (scriptLoaded) return

  // 添加 Wowhead 配置脚本
  const configScript = document.createElement('script')
  configScript.textContent = 'const whTooltips = {colorLinks: true, iconizeLinks: true, renameLinks: true};'
  document.head.appendChild(configScript)

  // 添加 Wowhead power.js
  const script = document.createElement('script')
  script.src = 'https://wow.zamimg.com/widgets/power.js'
  script.async = true
  document.head.appendChild(script)

  scriptLoaded = true
}

function getWowheadDomain(): string {
  const STORAGE_KEY = 'wowhead-language'
  const languageMap: { [key: string]: string } = {
    'cn': 'cn',
    'en': 'www',
    'tw': 'tw'
  }

  const savedLanguage = localStorage.getItem(STORAGE_KEY) || 'cn'
  return languageMap[savedLanguage] || 'cn'
}

function updateWowheadLinks() {
  const domain = getWowheadDomain()
  const links = document.querySelectorAll('a.wowhead-link')

  links.forEach((link) => {
    const currentDataWowhead = link.getAttribute('data-wowhead') || ''

    // 移除旧的 domain 参数（如果存在）
    let newDataWowhead = currentDataWowhead.replace(/&domain=[^&]*/, '')

    // 添加新的 domain 参数
    newDataWowhead += `&domain=${domain}`

    link.setAttribute('data-wowhead', newDataWowhead)
  })
}

function refreshWowheadTooltips() {
  // 等待脚本加载完成后刷新 tooltips
  const checkAndRefresh = () => {
    if ((window as any).$WowheadPower) {
      (window as any).$WowheadPower.refreshLinks()
    } else {
      setTimeout(checkAndRefresh, 100)
    }
  }
  checkAndRefresh()
}
