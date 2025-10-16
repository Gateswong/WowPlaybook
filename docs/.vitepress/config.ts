import { defineConfig } from 'vitepress'
import type MarkdownIt from 'markdown-it'

// 自定义 Markdown 插件：支持 Wowhead 链接语法
// 语法: <类型=ID,额外信息,名称>
// 额外信息和名称均为可选
// 示例: <s=123> <s=123,额外> <s=123,,名称> <s=123,额外,名称>
function wowheadLinksPlugin(md: MarkdownIt) {
  // 在 emphasis 规则之前插入自定义规则
  md.inline.ruler.before('emphasis', 'wowhead', (state, silent) => {
    const start = state.pos

    // 检查是否以 < 开头
    if (state.src[start] !== '<') {
      return false
    }

    // 匹配模式: <类型=ID...>
    const match = state.src.slice(start).match(/^<([a-z]+)=(\d+)([^>]*)>/)

    if (!match) {
      return false
    }

    if (!silent) {
      const typeAbbr = match[1]
      const id = match[2]
      const rest = match[3] // 可能包含 ",额外信息,名称" 或 ",额外信息" 或 ",,名称" 或空

      // 映射缩写到完整类型
      const typeMap: { [key: string]: string } = {
        's': 'spell',
        'i': 'item',
        'q': 'quest',
        'z': 'zone',
        'n': 'npc',
      }

      const type = typeMap[typeAbbr]
      if (!type) {
        return false
      }

      let extraInfo = ''
      let displayName = ''
      let forceText = false // 是否强制使用指定文本

      if (rest) {
        // 解析额外信息和名称
        // 首先找到第一个未转义的逗号
        let firstCommaIndex = -1
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === ',' && (i === 0 || rest[i - 1] !== '\\')) {
            firstCommaIndex = i
            break
          }
        }

        if (firstCommaIndex === -1) {
          // 没有逗号，说明只有额外信息
          extraInfo = rest.substring(1).replace(/\\,/g, ',')
        } else if (firstCommaIndex === 0) {
          // 第一个字符就是逗号，说明没有额外信息
          // 继续找第二个逗号
          let secondCommaIndex = -1
          for (let i = 1; i < rest.length; i++) {
            if (rest[i] === ',' && (i === 0 || rest[i - 1] !== '\\')) {
              secondCommaIndex = i
              break
            }
          }

          if (secondCommaIndex === -1) {
            // 只有一个逗号，后面是额外信息（因为名称前的逗号可省略）
            extraInfo = rest.substring(1).replace(/\\,/g, ',')
          } else {
            // 有两个逗号，说明是 ,,名称 格式
            displayName = rest.substring(secondCommaIndex + 1)
          }
        } else {
          // 有额外信息
          extraInfo = rest.substring(1, firstCommaIndex).replace(/\\,/g, ',')

          // 检查是否还有名称
          if (firstCommaIndex + 1 < rest.length) {
            displayName = rest.substring(firstCommaIndex + 1)
          }
        }
      }

      // 检查名称是否以 ! 开头（强制使用指定文本）
      if (displayName && displayName.startsWith('!')) {
        forceText = true
        displayName = displayName.substring(1) // 移除 ! 前缀
      }

      // 获取默认 Wowhead 域名（中文）
      const defaultDomain = 'cn'

      // 构建 data-wowhead 属性
      let dataWowhead = `${type}=${id}`
      if (extraInfo) {
        dataWowhead += `&${extraInfo}`
      }
      // 添加默认 domain 参数
      dataWowhead += `&domain=${defaultDomain}`

      let dataRenameWowhead = `data-wh-rename-link="${!(forceText && displayName)}"`
      // if (forceText && displayName) {
      //   dataRenameWowhead = `data-wh-rename-link="false"`
      // }

      // 如果没有显示名称，使用 ID 作为显示文本
      const text = displayName || `${typeAbbr}=${id}`

      // 生成 HTML 标签
      const token = state.push('html_inline', '', 0)
      const wowheadUrl = `https://${defaultDomain}.wowhead.com/${type}=${id}`
      token.content = `<a href="${wowheadUrl}" class="wowhead-link" ${dataRenameWowhead} data-wowhead="${dataWowhead}" data-wowhead-type="${type}" data-wowhead-id="${id}">${text}</a>`
    }

    // 移动位置指针
    state.pos += match[0].length
    return true
  })
}

export default defineConfig({
  title: '魔兽世界手记',
  description: '魔兽世界攻略文档',

  // GitHub Pages 部署需要设置 base
  // 如果部署到 https://<USERNAME>.github.io/<REPO>/
  // 请将 base 设置为 '/<REPO>/'
  // 例如：base: '/WowPlaybook/'
  base: '/WowPlaybook/',

  appearance: 'dark',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '新闻和消息', link: '/news' },
    ],

    sidebar: [
      {
        text: '导航',
        items: [
          { text: '介绍', link: '/intro' },
          { text: '新闻和消息', link: '/news', },
        ]
      },
      {
        text: '测试服消息',
        items: [
          { text: 'Alpha测试', link: '/Midnight/Alpha测试', },
        ]
      },
      {
        text: '军团再临Remix',
        items: [
          { text: '简易笔记', link: '/LegionRemix', },
          { text: '德鲁伊/平衡', link: '/LegionRemix/DruidBalance', }
        ]
      },
      {
        text: 'Paruru的游戏配置',
        items: [
          { text: '界面设置', link: '/Paruru的游戏配置/界面设置'}
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gateswong/wowplaybook' }
    ]
  },

  markdown: {
    config: (md) => {
      md.use(wowheadLinksPlugin)
    }
  }
})