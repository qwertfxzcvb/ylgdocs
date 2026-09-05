<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'

const { theme } = useData()

// 将 sidebar 解析成树形结构: [{ text, link?, children? }]
const tree = computed(() => {
  const sidebar = theme.value.sidebar || []
  const result = []
  for (const group of sidebar) {
    const children = parseItems(group.items || [])
    if (group.text) {
      result.push({ text: group.text, link: group.link, children })
    } else {
      // 无标题分组直接平铺
      result.push(...children)
    }
  }
  return result
})

function parseItems(items) {
  const result = []
  let currentFolder = null

  for (const item of items) {
    if (item.text && !item.link && !item.items) {
      // 纯文字标签 = 文件夹名称，下一个 items 块归入它
      currentFolder = { text: item.text, children: [] }
      result.push(currentFolder)
    } else if (item.items && !item.text) {
      // 匿名 items 块，归入上一个文件夹
      const children = parseItems(item.items)
      if (currentFolder) {
        currentFolder.children.push(...children)
      } else {
        result.push(...children)
      }
    } else if (item.items && item.text) {
      // 命名分组 = 文件夹
      const folder = { text: item.text, link: item.link, children: parseItems(item.items) }
      result.push(folder)
      currentFolder = null
    } else if (item.link) {
      // 普通页面链接
      if (currentFolder) {
        currentFolder.children.push({ text: item.text, link: item.link })
      } else {
        result.push({ text: item.text, link: item.link })
      }
    }
  }
  return result
}
</script>

<template>
  <div class="auto-nav">
    <template v-for="node in tree" :key="node.text">
      <!-- 文件夹 -->
      <div v-if="node.children && node.children.length" class="nav-folder">
        <div class="folder-header">
          <span class="folder-icon">📂</span>
          <a v-if="node.link" :href="node.link" class="folder-name link">{{ node.text }}</a>
          <span v-else class="folder-name">{{ node.text }}</span>
        </div>
        <div class="folder-children">
          <template v-for="child in node.children" :key="child.link || child.text">
            <!-- 子文件夹 -->
            <div v-if="child.children && child.children.length" class="nav-subfolder">
              <div class="subfolder-header">
                <span class="folder-icon">📁</span>
                <span class="folder-name">{{ child.text }}</span>
              </div>
              <div class="subfolder-children">
                <a v-for="sub in child.children" :key="sub.link" :href="sub.link" class="nav-card">
                  <span class="nav-icon">📄</span>
                  <span class="nav-text">{{ sub.text }}</span>
                </a>
              </div>
            </div>
            <a v-else-if="child.link" :href="child.link" class="nav-card">
              <span class="nav-icon">📄</span>
              <span class="nav-text">{{ child.text }}</span>
            </a>
          </template>
        </div>
      </div>
      <!-- 单独页面 -->
      <a v-else-if="node.link" :href="node.link" class="nav-card root-card">
        <span class="nav-icon">📄</span>
        <span class="nav-text">{{ node.text }}</span>
      </a>
    </template>
  </div>
</template>

<style scoped>
.auto-nav {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ---------- 文件夹 ---------- */
.nav-folder {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  padding: 18px 20px 14px;
  transition: box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.nav-folder:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.folder-icon {
  font-size: 1.25rem;
}
.folder-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--vp-c-text-1);
}
.folder-name.link {
  text-decoration: none;
  transition: color 0.3s ease;
}
.folder-name.link:hover {
  color: var(--vp-c-brand-1);
}

.folder-children {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

/* ---------- 子文件夹 ---------- */
.nav-subfolder {
  grid-column: 1 / -1;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.28);
  border: 1px dashed rgba(0, 0, 0, 0.08);
  padding: 12px 14px 10px;
}
.subfolder-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.subfolder-header .folder-icon {
  font-size: 1rem;
}
.subfolder-header .folder-name {
  font-size: 0.95rem;
}
.subfolder-children {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

/* ---------- 卡片 ---------- */
.nav-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              background 0.4s ease;
}
.nav-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.78);
}
.nav-card:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.1s;
}

.root-card {
  padding: 14px 18px;
  border-radius: 14px;
}

.nav-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}
.nav-text {
  font-weight: 500;
  font-size: 0.93rem;
}

/* ---------- 暗色模式 ---------- */
.dark .nav-folder {
  background: rgba(30, 30, 30, 0.4);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.dark .nav-folder:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.dark .folder-header {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}
.dark .nav-subfolder {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.12);
}
.dark .nav-card {
  background: rgba(40, 40, 40, 0.5);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}
.dark .nav-card:hover {
  background: rgba(50, 50, 50, 0.7);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
</style>
