// 记住侧边栏分组的展开/折叠状态（存 localStorage，刷新后恢复）
const STORAGE_KEY = 'ylg-sidebar-collapsed'

type State = Record<string, boolean>

function readState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeState(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 隐私模式等无法写入时忽略
  }
}

// 用「父分组标题 / 自身标题」作为 key，避免同名分组冲突
function keyOf(el: Element): string {
  const parts: string[] = []
  let cur: Element | null = el
  while (cur) {
    const text = cur.querySelector(':scope > .item')?.textContent?.trim()
    if (text) parts.unshift(text)
    cur = cur.parentElement?.closest('.VPSidebarItem') ?? null
  }
  return parts.join(' / ')
}

function collapsibleItems(): Element[] {
  return [...document.querySelectorAll('.VPSidebar .VPSidebarItem.collapsible')]
}

// 把保存的状态应用回 DOM：通过点击 caret 触发 VitePress 自身的展开/折叠逻辑
function restore() {
  const state = readState()
  for (const el of collapsibleItems()) {
    const want = state[keyOf(el)]
    if (want === undefined) continue
    // 含当前页面的分组保持展开，否则刷新后会看不到自己在哪
    if (el.classList.contains('has-active')) continue
    if (el.classList.contains('collapsed') === want) continue
    const caret = el.querySelector(':scope > .item > .caret') as HTMLElement | null
    caret?.click()
  }
}

let scheduled = false
function scheduleRestore() {
  if (scheduled) return
  scheduled = true
  setTimeout(() => {
    scheduled = false
    restore()
  })
}

function save(item: Element) {
  // 等 Vue 更新完 class 再读取结果
  setTimeout(() => {
    const state = readState()
    state[keyOf(item)] = item.classList.contains('collapsed')
    writeState(state)
  })
}

function onToggle(e: Event) {
  if (e.type === 'keydown') {
    const key = (e as KeyboardEvent).key
    if (key !== 'Enter' && key !== ' ') return
  }
  const target = e.target as Element | null
  const item = target?.closest?.('.VPSidebar .VPSidebarItem.collapsible')
  if (item) save(item)
}

export function setupSidebarPersist() {
  document.addEventListener('click', onToggle, true)
  document.addEventListener('keydown', onToggle, true)

  // 侧边栏在路由切换时会重新渲染，用 MutationObserver 持续恢复状态
  const observer = new MutationObserver(scheduleRestore)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  })

  scheduleRestore()
}
