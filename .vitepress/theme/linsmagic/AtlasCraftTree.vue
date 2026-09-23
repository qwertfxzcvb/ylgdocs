<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { entryById, entryHref, recipes, type AtlasRecipe } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'
import AtlasCraftNode, { type CraftNode } from './AtlasCraftNode.vue'

const props = defineProps<{ id: string; recipeId?: string }>()
const count = ref(1)
const zoom = ref(100)
const open = ref(false)
const expanded = ref(false)
const dragging = ref(false)
const selected = ref<Record<string, string>>({})
const collapsed = ref<Record<string, boolean>>({})
const closeButton = ref<HTMLButtonElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
let previousOverflow = ''
let dragStart: { pointerId: number; x: number; y: number; left: number; top: number } | null = null
let suppressClick = false
watch(() => [props.id, props.recipeId], () => {
  count.value = 1
  zoom.value = 100
  selected.value = {}
  collapsed.value = {}
  open.value = false
  expanded.value = false
})
watch(open, async value => {
  if (typeof document === 'undefined') return
  if (value) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    centerTree()
    closeButton.value?.focus()
  } else document.body.style.overflow = previousOverflow
})
onUnmounted(() => { if (typeof document !== 'undefined' && open.value) document.body.style.overflow = previousOverflow })
function centerTree() {
  if (viewport.value) viewport.value.scrollLeft = (viewport.value.scrollWidth - viewport.value.clientWidth) / 2
  if (viewport.value) viewport.value.scrollTop = 0
}
async function changeZoom(next: number, clientX?: number, clientY?: number) {
  const view = viewport.value
  const oldZoom = zoom.value
  const newZoom = Math.max(40, Math.min(200, next))
  if (newZoom === oldZoom) return
  const bounds = view?.getBoundingClientRect()
  const x = bounds && clientX !== undefined ? clientX - bounds.left : (view?.clientWidth ?? 0) / 2
  const y = bounds && clientY !== undefined ? clientY - bounds.top : (view?.clientHeight ?? 0) / 2
  const left = view?.scrollLeft ?? 0
  const top = view?.scrollTop ?? 0
  zoom.value = newZoom
  await nextTick()
  if (view) {
    const ratio = newZoom / oldZoom
    view.scrollLeft = (left + x) * ratio - x
    view.scrollTop = (top + y) * ratio - y
  }
}
function onWheel(event: WheelEvent) {
  if (event.deltaY === 0) return
  void changeZoom(zoom.value + (event.deltaY < 0 ? 10 : -10), event.clientX, event.clientY)
}
function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !viewport.value || !(event.target instanceof Element)) return
  if (event.target.closest('button,input,select,option')) return
  dragStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY,
    left: viewport.value.scrollLeft, top: viewport.value.scrollTop }
  suppressClick = false
}
function onPointerMove(event: PointerEvent) {
  if (!dragStart || event.pointerId !== dragStart.pointerId || !viewport.value) return
  const dx = event.clientX - dragStart.x
  const dy = event.clientY - dragStart.y
  if (!dragging.value && Math.hypot(dx, dy) > 4) {
    dragging.value = true
    suppressClick = true
    viewport.value.setPointerCapture(event.pointerId)
  }
  if (dragging.value) {
    viewport.value.scrollLeft = dragStart.left - dx
    viewport.value.scrollTop = dragStart.top - dy
  }
}
function onPointerUp(event: PointerEvent) {
  if (!dragStart || event.pointerId !== dragStart.pointerId) return
  if (viewport.value?.hasPointerCapture(event.pointerId)) viewport.value.releasePointerCapture(event.pointerId)
  dragStart = null
  dragging.value = false
  if (suppressClick) window.setTimeout(() => { suppressClick = false }, 0)
}
function onTreeClick(event: MouseEvent) {
  if (!suppressClick) return
  event.preventDefault()
  event.stopPropagation()
  suppressClick = false
}
async function toggleExpanded() {
  const view = viewport.value
  const centerX = (view?.scrollLeft ?? 0) + (view?.clientWidth ?? 0) / 2
  const centerY = (view?.scrollTop ?? 0) + (view?.clientHeight ?? 0) / 2
  expanded.value = !expanded.value
  await nextTick()
  if (view) {
    view.scrollLeft = centerX - view.clientWidth / 2
    view.scrollTop = centerY - view.clientHeight / 2
  }
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { open.value = false; return }
  if (event.key !== 'Tab' || !dialog.value) return
  const focusable = [...dialog.value.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select')]
  if (!focusable.length) return
  if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus() }
  else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus() }
}

const makers = new Map<string, AtlasRecipe[]>()
for (const recipe of recipes) for (const output of recipe.result) {
  if (output.count <= 0) continue
  const current = makers.get(output.id) ?? []
  current.push(recipe)
  makers.set(output.id, current)
}
function displayName(id: string) { return entryById[id]?.name ?? id.replace(/^minecraft:/, '') }
function ingredients(recipe: AtlasRecipe) {
  const totals = new Map<string, number>()
  for (const input of recipe.type === 'crafting' ? recipe.slots ?? [] : recipe.inputs ?? []) {
    if (input) totals.set(input.id, (totals.get(input.id) ?? 0) + (input.count || 1))
  }
  return [...totals]
}
function makeNode(id: string, needed: number, key: string, ancestors: Set<string>, budget: { nodes: number }): CraftNode {
  const options = makers.get(id) ?? []
  const stopped = ancestors.has(id) || ancestors.size >= 9 || budget.nodes >= 250
  const preference = selected.value[key] ?? (key === props.id ? props.recipeId : undefined)
  const naturalRecipe = !id.startsWith('minecraft:')
    ? options.find(option => option.result.length === 1 && (option.type === 'crafting' || option.type === 'shapeless'))
      ?? options.find(option => option.result.length === 1 && option.type === 'machine')
    : undefined
  const recipe = stopped || preference === '__raw__' ? undefined
    : options.find(option => option.id === preference) ?? naturalRecipe
  const node: CraftNode = { key, id, count: needed, options, children: [], stopped }
  if (!recipe) return node
  const output = recipe.result.find(value => value.id === id)
  if (!output?.count) return node
  const batches = Math.ceil(needed / output.count)
  node.recipe = recipe
  node.batches = batches
  const next = new Set(ancestors)
  next.add(id)
  for (const [inputId, amount] of ingredients(recipe)) {
    budget.nodes++
    node.children.push(makeNode(inputId, amount * batches, `${key}/${inputId}`, next, budget))
  }
  return node
}
const quantity = computed(() => Math.max(1, Math.min(999999, Math.floor(Number(count.value) || 1))))
const tree = computed(() => makeNode(props.id, quantity.value, props.id, new Set(), { nodes: 0 }))
const leaves = computed(() => {
  const totals = new Map<string, number>()
  function visit(node: CraftNode) {
    if (!node.children.length) totals.set(node.id, (totals.get(node.id) ?? 0) + node.count)
    else node.children.forEach(visit)
  }
  visit(tree.value)
  return [...totals].map(([id, amount]) => ({ id, amount })).sort((a, b) => b.amount - a.amount)
})
function choose(key: string, recipeId: string) { selected.value = { ...selected.value, [key]: recipeId } }
function toggle(key: string) { collapsed.value = { ...collapsed.value, [key]: !collapsed.value[key] } }
</script>

<template>
  <div class="lm-craft-launcher">
    <div class="lm-craft-launcher-copy"><AtlasIcon :id="id" :size="40" /><div><strong>合成树</strong><small>查看从目标物品到基础材料的完整制作路径</small></div></div>
    <label>数量 <input v-model.number="count" type="number" min="1" max="999999" step="1" inputmode="numeric" @change="count = quantity" /></label>
    <button type="button" @click="open = true">打开合成树 ↗</button>
  </div>
  <Teleport to="body">
    <div v-if="open" class="lm-craft-modal-backdrop" :class="{ 'lm-craft-expanded': expanded }" @click.self="open = false" @keydown="onKeydown">
      <div ref="dialog" class="lm-craft-modal" role="dialog" aria-modal="true" :aria-label="`${displayName(id)}合成树`">
        <header class="lm-craft-modal-header">
          <div class="lm-craft-modal-title"><AtlasIcon :id="id" :size="38" /><div><strong>{{ displayName(id) }} · 合成树</strong><small>点击物品查看资料，选择制作路线可重算整棵树</small></div></div>
          <div class="lm-craft-zoom" aria-label="合成树缩放">
            <button type="button" class="lm-tree-center" title="回到目标物品" aria-label="回到合成树顶部" @click="centerTree">⌖</button>
            <button type="button" aria-label="缩小合成树" :disabled="zoom <= 40" @click="changeZoom(zoom - 10)">−</button>
            <span>{{ zoom }}%</span>
            <button type="button" aria-label="放大合成树" :disabled="zoom >= 200" @click="changeZoom(zoom + 10)">+</button>
          </div>
          <label>目标数量 <input v-model.number="count" type="number" min="1" max="999999" step="1" inputmode="numeric" @change="count = quantity" /></label>
          <button type="button" class="lm-craft-expand" :aria-label="expanded ? '退出网页全屏' : '铺满网页'" @click="toggleExpanded">{{ expanded ? '退出全屏' : '网页全屏' }}</button>
          <button ref="closeButton" type="button" class="lm-craft-close" aria-label="关闭合成树" @click="open = false">×</button>
        </header>
        <div ref="viewport" class="lm-craft-tree-viewport" :class="{ 'is-dragging': dragging }"
          @wheel.prevent="onWheel" @pointerdown="onPointerDown" @pointermove="onPointerMove"
          @pointerup="onPointerUp" @pointercancel="onPointerUp" @pointerleave="event => { if (!dragging) onPointerUp(event) }" @click.capture="onTreeClick">
          <div class="lm-craft-tree-canvas" :style="{ zoom: `${zoom}%` }"><AtlasCraftNode :node="tree" :selected="selected" :collapsed="collapsed" @choose="choose" @toggle="toggle" /></div>
        </div>
        <footer class="lm-craft-modal-footer">
          <h3>末端材料 <small>{{ leaves.length }} 种 · 按目标数量汇总</small></h3>
          <div class="lm-craft-materials">
            <a v-for="item in leaves" :key="item.id" :href="entryHref(item.id)" :data-lm-item-id="item.id">
              <AtlasIcon :id="item.id" :size="32" /><span>{{ displayName(item.id) }}</span><strong>×{{ item.amount }}</strong>
            </a>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
