<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { categoryEntries, categoryGroups, categoryHref, entryHref, recipeHref, recipes,
  type AtlasCategoryId, type AtlasEntry, type AtlasRecipe } from './atlasData'
import catalog from './catalog.generated.json'
import AtlasIcon from './AtlasIcon.vue'

const props = defineProps<{ category?: AtlasCategoryId; subgroup?: string }>()
const search = ref('')
const homeSearch = ref('')
const page = ref(1)
const targetPage = ref(1)
const listTop = ref<HTMLElement | null>(null)
const perPage = 36
const group = computed(() => categoryGroups.find(value => value.id === props.category))
const subgroups = computed(() => props.category ? (catalog.categorySubgroups as Record<string, Array<{ id: string; title: string }>>)[props.category] ?? [] : [])
const homeResults = computed(() => {
  const query = homeSearch.value.trim().toLocaleLowerCase('zh-CN')
  if (!query) return []
  const groups = categoryGroups.map(row => ({ key: `category:${row.id}`, name: row.title, detail: '分类', href: categoryHref(row.id), icon: row.icon }))
  groups.unshift(
    { key: 'start', name: '新手教程', detail: '从领取大典到第一台机器的顺序路线', href: '/linsmagic/atlas/tutorials/new-player', icon: 'item/compass' },
    { key: 'systems', name: '系统教程', detail: '管道、多方块、附魔等搭建步骤', href: '/linsmagic/atlas/tutorials/systems/', icon: 'block/piston_top' },
    { key: 'guide', name: '玩法指南', detail: '按功能查阅的说明书', href: '/linsmagic/atlas/guide/', icon: 'item/book' }
  )
  for (const [category, children] of Object.entries(catalog.categorySubgroups as Record<string, Array<{ id: string; title: string }>>)) {
    for (const child of children) groups.push({ key: `${category}:${child.id}`, name: child.title, detail: '子分类',
      href: `/linsmagic/atlas/${category}/${child.id}/`, icon: subgroupIcon(child.id, category as AtlasCategoryId) })
  }
  const guideNames = [['book', '芸集知识之书'], ['merchant', '异界行商联络器'], ['hub', '次元枢纽传送单元'],
    ['enchant', '魔法附魔玩法'], ['guild', '公会'], ['special', '特殊事件指南'], ['night', '特殊夜晚指南'], ['mineral', '工业矿机组指南']]
  for (const [id, name] of guideNames) groups.push({ key: `guide:${id}`, name, detail: '玩法指南', href: `/linsmagic/atlas/guide/${id}`, icon: 'item/book' })
  const systemNames = [['pipeline', '管道系统'], ['multiblock', '多方块机器搭建'], ['enchanting', '附魔体系'],
    ['events-bosses', '夜间事件与首领'], ['web-machines', '网页机器'],
    ['applied-energistics', '应用能源（入门）'], ['ae-autocrafting', '应用能源（自动合成）']]
  for (const [id, name] of systemNames) groups.push({ key: `system:${id}`, name, detail: '系统教程',
    href: `/linsmagic/atlas/tutorials/systems/${id}`, icon: 'block/piston_top' })
  const pages = [...categoryEntries('machines'), ...categoryEntries('weapons'), ...categoryEntries('items'),
    ...categoryEntries('materials'), ...categoryEntries('ae'), ...categoryEntries('enchants'), ...categoryEntries('events'),
    ...categoryEntries('bosses'), ...categoryEntries('vanilla')]
    .map(row => ({ key: `entry:${row.id}`, name: row.name, detail: row.category, href: row.href, icon: row.icon, itemId: row.id }))
  const recipePages = recipes.map(row => ({ key: `recipe:${row.id}`, name: row.name, detail: row.station,
    href: row.href, icon: '', itemId: row.result[0]?.id }))
  const rank = (row: { key: string; name: string }) => {
    const name = row.name.toLocaleLowerCase('zh-CN')
    const match = name === query ? 0 : name.startsWith(query) ? 1 : name.includes(query) ? 2 : 3
    const kind = row.key.startsWith('category:') ? 0 : row.key.startsWith('entry:') ? 1
      : row.key.startsWith('recipe:') ? 2 : 3
    return match * 10 + kind
  }
  return [...groups, ...pages, ...recipePages]
    .filter(row => `${row.name} ${row.detail}`.toLocaleLowerCase('zh-CN').includes(query))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 30)
})
function openFirstResult() { if (homeResults.value[0]) window.location.href = homeResults.value[0].href }

function subgroupMatches(entry: AtlasEntry, subgroup: string) {
  if (props.category === 'machines') return subgroup === 'structures' ? !!entry.structureId : !entry.structureId
  return entry.group === subgroup
}
const allRows = computed<Array<AtlasEntry | AtlasRecipe>>(() => {
  if (!props.category) return []
  const source = props.category === 'recipes' ? recipes : categoryEntries(props.category)
  return props.subgroup ? source.filter(row => 'result' in row ? row.group === props.subgroup : subgroupMatches(row, props.subgroup!)) : source
})
const rows = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('zh-CN')
  return query ? allRows.value.filter(row => `${row.name} ${'result' in row ? row.station : `${row.description} ${row.obtain}`}`.toLocaleLowerCase('zh-CN').includes(query)) : allRows.value
})
const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / perPage)))
const visibleRows = computed(() => rows.value.slice((page.value - 1) * perPage, page.value * perPage))
watch([search, () => props.category, () => props.subgroup], () => { page.value = 1; targetPage.value = 1 })
function changePage(next: number) {
  page.value = Math.max(1, Math.min(totalPages.value, next))
  targetPage.value = page.value
  listTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function jumpToPage() { changePage(Math.floor(Number(targetPage.value) || 1)) }

function count(category: AtlasCategoryId) { return category === 'recipes' ? recipes.length : categoryEntries(category).length }
function subgroupCount(id: string) { return allGroupRows().filter(row => 'result' in row ? row.group === id : subgroupMatches(row, id)).length }
function allGroupRows(): Array<AtlasEntry | AtlasRecipe> {
  if (!props.category) return []
  return props.category === 'recipes' ? recipes : categoryEntries(props.category)
}
function rowIcon(row: AtlasEntry | AtlasRecipe) { return 'result' in row ? row.result[0]?.id ?? '' : row.id }
function rowHref(row: AtlasEntry | AtlasRecipe) { return 'result' in row ? recipeHref(row.id) : entryHref(row.id) }
function rowSummary(row: AtlasEntry | AtlasRecipe) { return 'result' in row ? `${row.station} · 查看配方与材料` : row.description || row.obtain || '查看资料与关联内容' }
function subgroupIcon(id: string, category = props.category) {
  if (category === 'recipes') return id === 'processing' ? 'block/furnace_front' : 'block/crafting_table_front'
  if (category === 'materials') return id === 'ultimate' ? 'item/nether_star' : id === 'advanced' ? 'item/diamond' : 'item/iron_ingot'
  if (category === 'weapons') return id === 'armor' ? 'item/diamond_chestplate' : 'item/diamond_sword'
  if (category === 'machines') return id === 'structures' ? 'block/piston_top' : 'block/furnace_front'
  if (category === 'ae') return id === 'blocks' ? 'item/white_glazed_terracotta' : 'item/quartz'
  if (category === 'enchants') return 'item/enchanted_book'
  if (category === 'events') return id === 'nights' ? 'item/nether_star' : 'item/ender_eye'
  return id === 'food' ? 'item/golden_apple' : id === 'accessories' ? 'item/ender_eye' : 'item/compass'
}
</script>

<template>
  <div class="lm-category">
    <template v-if="!category">
      <form class="lm-atlas-search" @submit.prevent="openFirstResult">
        <label><span aria-hidden="true">⌕</span><input v-model="homeSearch" type="search" placeholder="搜索分类、物品、机器或配方…" aria-label="搜索魔法百科" /></label>
        <button type="submit" :disabled="!homeResults.length">打开首项</button>
      </form>
      <div v-if="homeSearch.trim()" class="lm-folder-grid lm-record-grid" aria-live="polite">
        <a v-for="result in homeResults" :key="result.key" :href="result.href" class="lm-folder lm-record" :data-lm-item-id="'itemId' in result ? result.itemId : undefined">
          <AtlasIcon v-if="'itemId' in result && result.itemId" :id="result.itemId" :size="48" />
          <AtlasIcon v-else :texture="result.icon || 'item/book'" :size="48" />
          <span><strong>{{ result.name }}</strong><small>{{ result.detail }}</small></span><span class="lm-folder-arrow" aria-hidden="true">↗</span>
        </a>
        <p v-if="!homeResults.length" class="lm-muted">没有找到匹配内容。</p>
      </div>
      <div v-else class="lm-folder-grid">
        <a href="/linsmagic/atlas/tutorials/new-player" class="lm-folder lm-tutorial-choice">
          <AtlasIcon texture="item/compass" :size="56" />
          <span><strong>新手教程</strong><small>不知道接下来做什么？从领取芸集知识之书开始，按顺序完成材料、第一台机器、装备与经济目标。</small><em>从第一步开始 →</em></span>
          <span class="lm-folder-arrow" aria-hidden="true">↗</span>
        </a>
        <a href="/linsmagic/atlas/tutorials/systems/" class="lm-folder lm-tutorial-choice">
          <AtlasIcon texture="block/piston_top" :size="56" />
          <span><strong>系统教程</strong><small>已经知道要做什么，却不知道怎么搭？从最小例子学会管道、多方块机器、附魔、网页机器与应用能源。</small><em>按系统找教程 →</em></span>
          <span class="lm-folder-arrow" aria-hidden="true">↗</span>
        </a>
        <a href="/linsmagic/atlas/guide/" class="lm-folder"><AtlasIcon texture="item/book" :size="48" />
          <span><strong>玩法指南</strong><small>按功能查阅的大典、行商、矿机、公会等说明书；新玩家请先看上方新手教程。</small></span>
          <span class="lm-folder-arrow" aria-hidden="true">↗</span>
        </a>
        <a v-for="folder in categoryGroups" :key="folder.id" :href="categoryHref(folder.id)" class="lm-folder">
          <AtlasIcon :texture="folder.icon" :size="48" />
          <span><strong>{{ folder.title }}</strong><small>{{ folder.description }}</small><em>{{ count(folder.id) }} 个资料页</em></span>
          <span class="lm-folder-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </template>
    <template v-else>
      <p v-if="!subgroup" class="lm-intro">{{ group?.description }}当前收录 {{ allGroupRows().length }} 项；可先选择子分类，也可以直接在下方搜索全部条目。</p>
      <p v-else class="lm-intro">此子分类收录 {{ allRows.length }} 项；可在下方{{ category === 'recipes' ? '按配方名称或工作站' : '按名称、用途或获取方式' }}搜索。</p>
      <template v-if="!subgroup && subgroups.length">
        <h2 class="lm-subtitle">分类目录</h2>
        <div class="lm-folder-grid lm-subfolder-grid">
          <a v-for="folder in subgroups" :key="folder.id" :href="`${categoryHref(category)}${folder.id}/`" class="lm-folder">
            <AtlasIcon :texture="subgroupIcon(folder.id)" :size="44" />
            <span><strong>{{ folder.title }}</strong><small>{{ subgroupCount(folder.id) }} 项资料</small></span>
            <span class="lm-folder-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </template>
      <div ref="listTop" class="lm-list-heading"><h2>{{ subgroup ? '条目列表' : '全部资料' }}</h2><span>{{ rows.length }} 项</span></div>
      <label class="lm-category-search"><span aria-hidden="true">⌕</span><input v-model="search" type="search" :placeholder="category === 'recipes' ? '搜索配方名称或工作站…' : '搜索名称、用途或获取方式…'" /></label>
      <div class="lm-folder-grid lm-record-grid">
        <a v-for="row in visibleRows" :key="row.id" :href="rowHref(row)" class="lm-folder lm-record" :data-lm-item-id="rowIcon(row)">
          <AtlasIcon :id="rowIcon(row)" :size="48" />
          <span><strong>{{ row.name }}</strong><small>{{ rowSummary(row) }}</small></span>
          <span class="lm-folder-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
      <p v-if="rows.length === 0" class="lm-muted">没有匹配的条目，试试缩短关键词。</p>
      <nav v-if="totalPages > 1" class="lm-pagination" aria-label="资料分页">
        <button type="button" :disabled="page === 1" @click="changePage(page - 1)">上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页</span>
        <button type="button" :disabled="page === totalPages" @click="changePage(page + 1)">下一页</button>
        <form class="lm-page-jump" @submit.prevent="jumpToPage">
          <label>跳转到 <input v-model.number="targetPage" type="number" min="1" :max="totalPages" inputmode="numeric" aria-label="跳转页码" /> 页</label>
          <button type="submit">跳转</button>
        </form>
      </nav>
    </template>
  </div>
</template>
