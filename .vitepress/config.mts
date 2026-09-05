import { defineConfig, type DefaultTheme } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

// 统计 markdown 文件字数（中文字符 + 英文单词）
function countWords(content: string): number {
  // 去除 frontmatter
  content = content.replace(/^---[\s\S]*?---/, '')
  // 去除 HTML 标签
  content = content.replace(/<[^>]+>/g, '')
  // 去除 markdown 语法符号
  content = content.replace(/[#*`~\[\]()>|_\-!]/g, '')
  // 统计中文字符
  const chinese = (content.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  // 统计英文单词
  const english = (content.match(/[a-zA-Z]+/g) || []).length
  return chinese + english
}

// 扫描所有 md 文件并生成字数统计
function getWordCounts(docsDir: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const mdFiles = findMdFiles(docsDir)
  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const relativePath = '/' + path.relative(docsDir, file).replace(/\\/g, '/').replace(/\.md$/, '')
    counts[relativePath] = countWords(content)
  }
  return counts
}

function findMdFiles(dir: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'public' && entry.name !== 'drafts') {
      results.push(...findMdFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
      results.push(fullPath)
    }
  }
  return results
}

// 统计过去一年内每日的文档提交次数，用于生成类似 GitHub 的贡献热力图
function getCommitActivity(repoDir: string): Record<string, number> {
  const activity: Record<string, number> = {}
  try {
    const output = execSync('git log --date=short --pretty=format:%ad', {
      cwd: repoDir,
      encoding: 'utf-8',
    })
    for (const line of output.split('\n')) {
      const date = line.trim()
      if (!date) continue
      activity[date] = (activity[date] || 0) + 1
    }
  } catch {
    // 非 git 环境或未安装 git 时忽略
  }
  return activity
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '..')
const wordCounts = getWordCounts(docsDir)
const commitActivity = getCommitActivity(docsDir)

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lastUpdated: true,
  srcExclude: ['drafts/**', 'README.md'],
  title: "YLG 文档",
  description: "YLG服务器教程",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css' }]
  ],
  themeConfig: {
    wordCounts,
    commitActivity,
    // 自建 Moe-Counter 的计数图地址（换服务器/主题只改这一行）
    counterUrl: 'https://count.ylg.net.cn/get/@ylg-docs?theme=rule34',
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    footer: {
      copyright: 'Copyright © 2026 ylg.net.cn All Rights Reserved.'
    },
    nav: [
      { text: '主页', link: '/' },
      { text: '教程', link: '/homepage' },
      { text: '更新日志', link: '/changelog' },
      { text: '常见问题', link: '/guide/faq' }
    ],

    sidebar: [
      {
        text: '服务器教程',
        items: [
          { text: '首页', link: '/homepage' },
        ]
      },
      {
        text: '新手指南',
        collapsed: true,
        items: [
          { text: '入服教程', link: '/guide/join' },
          { text: '服务器菜单', link: '/guide/menu' },
          { text: '服务器规则', link: '/guide/rules' },
          { text: '客户端推荐', link: '/guide/client' },
          { text: '皮肤站', link: '/guide/skin' },
          {
            text: '推荐 MOD',
            collapsed: true,
            items: [
              { text: 'Replay Mod', link: '/guide/suggestedmods/replaymod' },
            ]
          },
        ]
      },
      {
        text: '账号相关',
        collapsed: true,
        items: [
          { text: '注册账号', link: '/account/register' },
          // { text: '绑定邮箱', link: '/account/bindemail' },
          { text: '绑定QQ', link: '/account/bindqq' },
          { text: '重置密码', link: '/account/resetpassword' },
        ]
      },
      {
        text: '基础玩法',
        collapsed: true,
        items: [
          { text: '设置家', link: '/gameplay/home' },
          { text: '创建领地', link: '/gameplay/claim' },
          { text: '个人仓库', link: '/gameplay/inventory' },
          { text: '每日签到', link: '/gameplay/signin' },
          { text: '地标传送', link: '/gameplay/landmark' },
          { text: '技能系统', link: '/gameplay/ylgmmo' },
        ]
      },
      {
        text: '社交与功能',
        collapsed: true,
        items: [
          { text: '公会', link: '/socialfeatures/guild' },
          { text: '坐姿动作', link: '/socialfeatures/gsit' },
          { text: '展示物品', link: '/socialfeatures/showcase' },
        ]
      },
      {
        text: '服务器机制',
        collapsed: true,
        items: [
          { text: '方块记录与回档', link: '/servermechanics/coreprotect' },
          { text: '背包回档', link: '/servermechanics/inventoryrollback' },
          { text: '红石与刷怪', link: '/servermechanics/redstone' },
          { text: '死亡惩罚', link: '/servermechanics/deathpenalty' },
        ]
      },
      {
        text: '经济系统',
        collapsed: true,
        items: [
          { text: '获取金币', link: '/economy/earning' },
          { text: '银行', link: '/economy/bank' },
          // { text: '系统商店', link: '/economy/shop' },
          { text: '箱子商店', link: '/economy/chestshop' },
          { text: '市场交易', link: '/economy/market' },
        ]
      },
      {
        text: '魔法插件',
        collapsed: true,
        items: [
          { text: '首页', link: '/linsmagic/home' }
        ]
      },
      // {
      //   text: '副本',
      //   collapsed: true,
      //   items: [
      //     { text: '副本介绍', link: '/dungeon/lobby' },
      //     { text: '僵尸之爷', link: '/dungeon/zombie' },
      //   ]
      // },
      {
        text: '其他',
        collapsed: true,
        items: [
          { text: 'QQ小技巧', link: '/tips/qq-settings' },
          { text: '常见问题', link: '/guide/faq' },
          { text: '更新日志', link: '/changelog' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/qwertfxzcvb/ylgdocs' }
    ]
    // wordCounts / commitActivity 是自定义字段，DefaultTheme.Config 里没有声明
  } as DefaultTheme.Config
})
