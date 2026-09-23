<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { blockTextureUrl, entryHref, structureById, type AtlasBlock } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'

const props = defineProps<{ id: string }>()
const structure = computed(() => structureById[props.id])
const variant = ref(0)
const layer = ref<string>('all')
const hovered = ref<AtlasBlock | null>(null)
const choices = ref<Record<string, string>>({})
const rotateX = ref(57)
const rotateZ = ref(-38)
watch(() => props.id, () => { variant.value = 0; layer.value = 'all'; hovered.value = null; choices.value = {} })
const blocks = computed(() => structure.value?.variants[variant.value] ?? [])
const levels = computed(() => [...new Set(blocks.value.map(block => block.y))].sort((a, b) => b - a))
const positionKey = (block: AtlasBlock) => `${variant.value}:${block.x},${block.y},${block.z}`
const resolvedBlocks = computed(() => blocks.value.map(block => {
  const option = block.options?.find(value => value.id === choices.value[positionKey(block)])
  return option ? { ...block, ...option } : block
}).filter(block => block.id !== 'minecraft:air'))
const shownBlocks = computed(() => layer.value === 'all' ? resolvedBlocks.value : resolvedBlocks.value.filter(block => String(block.y) === layer.value))
const blockCounts = computed(() => {
  const counts = new Map<string, { block: AtlasBlock; count: number }>()
  for (const block of resolvedBlocks.value) {
    const existing = counts.get(block.id)
    if (existing) existing.count++
    else counts.set(block.id, { block, count: 1 })
  }
  return [...counts.values()]
})
const miningStatus = computed(() => {
  if (props.id !== 'mining_rig') return null
  const ids = resolvedBlocks.value.map(block => block.id)
  const basic = ids.filter(id => id === '基础挖掘模块').length
  const standard = ids.filter(id => id === '标准挖掘模块').length
  const speed = (basic * .05 + standard * .2).toFixed(2)
  const storage = ids.some(id => ['minecraft:chest', 'minecraft:trapped_chest', '恒温箱', '致密温室箱'].includes(id))
  const tiers = ['光海通灵器', '渊底探针', '虚空凝晶镜', '星辉共鸣器', '混沌萃取仪', '创世催化器', '终焉解码器']
  const tier = Math.max(0, ...tiers.map((id, index) => ids.includes(id) ? index + 1 : 0))
  if (!basic && !standard) return { ok: false, text: '缺少挖掘模块：矿机无法运行。' }
  if (!storage) return { ok: false, text: '缺少箱子或存储模块：矿机无法运行。' }
  if (tier >= 6 && !ids.includes('致密温室箱')) return { ok: false, text: `挖掘速度 ${speed} 颗/秒；此等级缺少致密温室箱，产物会变为原矿废料。` }
  if (tier >= 4 && !ids.includes('恒温箱') && !ids.includes('致密温室箱')) return { ok: false, text: `挖掘速度 ${speed} 颗/秒；此等级缺少恒温箱，产物会变为原矿废料。` }
  return { ok: true, text: `当前组合可运行 · 挖掘速度 ${speed} 颗/秒${tier ? ` · 探针等级 ${tier}` : ''}` }
})
let start: { x: number; y: number; rx: number; rz: number } | null = null
let dragged = false

function pointerDown(event: PointerEvent) {
  start = { x: event.clientX, y: event.clientY, rx: rotateX.value, rz: rotateZ.value }
  dragged = false
  ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
}
function pointerMove(event: PointerEvent) {
  if (!start) return
  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true
  rotateZ.value = start.rz - dx * .45
  rotateX.value = Math.max(18, Math.min(82, start.rx + dy * .4))
}
function pointerUp() { start = null }
function blockClick(event: MouseEvent) { if (dragged) event.preventDefault() }
function isCrossSprite(block: AtlasBlock) {
  return /^minecraft:(?:small_amethyst_bud|medium_amethyst_bud|large_amethyst_bud|amethyst_cluster)$/.test(block.id)
}
</script>

<template>
  <div v-if="structure" class="lm-structure">
    <div class="lm-structure-view">
      <div v-if="structure.variants.length > 1" class="lm-layer-tabs lm-variant-tabs" aria-label="选择结构摆法">
        <button v-for="(_, index) in structure.variants" :key="index" type="button" :class="{ active: variant === index }"
          @click="variant = index; layer = 'all'; hovered = null">摆法 {{ index + 1 }}</button>
      </div>
      <div class="lm-layer-tabs" aria-label="选择结构层数">
        <button type="button" :class="{ active: layer === 'all' }" @click="layer = 'all'">全部</button>
        <button v-for="level in levels" :key="level" type="button" :class="{ active: layer === String(level) }"
          @click="layer = String(level)">{{ level === 0 ? '中心层' : level < 0 ? '下层' : '上层' }} Y={{ level }}</button>
      </div>
      <div class="lm-scene" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp">
        <div class="lm-world" :style="{ transform: `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)` }">
          <a v-for="block in shownBlocks" :key="`${block.x},${block.y},${block.z}`" class="lm-cube"
            :class="{ 'lm-cross-sprite': isCrossSprite(block) }" :data-lm-item-id="block.id"
            :href="entryHref(block.id)" :style="{ transform: `translate3d(${block.x * 70}px, ${block.z * 70}px, ${block.y * 70}px)` }"
            :aria-label="`${block.name}：${block.description}`" @mouseenter="hovered = block" @mouseleave="hovered = null"
            @focus="hovered = block" @blur="hovered = null" @click="blockClick">
            <template v-if="isCrossSprite(block)">
              <span v-for="plane in ['one', 'two']" :key="plane" class="lm-cross-plane"
                :class="`lm-cross-${plane}`" :style="{ backgroundImage: `url(${blockTextureUrl(block)})` }"></span>
            </template>
            <template v-else>
              <span v-for="face in ['front', 'back', 'left', 'right', 'top', 'bottom']" :key="face" class="lm-cube-face"
                :class="`lm-face-${face}`" :style="{ backgroundImage: `url(${blockTextureUrl(block)})` }"></span>
            </template>
          </a>
        </div>
      </div>
      <div class="lm-scene-caption">{{ hovered ? `${hovered.name} · ${hovered.description} · 点击查看资料` : '拖动旋转模型，悬停查看方块，点击打开资料页' }}</div>
    </div>
    <div class="lm-structure-list">
      <p v-if="structure.note" class="lm-structure-note">{{ structure.note }}</p>
      <p v-if="miningStatus" class="lm-mining-status" :class="{ 'lm-mining-warning': !miningStatus.ok }">{{ miningStatus.text }}</p>
      <div v-if="blocks.some(block => block.options?.length)" class="lm-block-options">
        <strong>切换结构方块</strong>
        <label v-for="block in blocks.filter(block => block.options?.length)" :key="positionKey(block)">
          <span>位置 {{ block.x }}, {{ block.y }}, {{ block.z }}</span>
          <select :value="choices[positionKey(block)] ?? block.id" @change="choices[positionKey(block)] = ($event.target as HTMLSelectElement).value; hovered = null">
            <option v-for="option in block.options" :key="option.id" :value="option.id">{{ option.name }}</option>
          </select>
        </label>
      </div>
      <a v-for="row in blockCounts" :key="row.block.id" :href="entryHref(row.block.id)" :data-lm-item-id="row.block.id">
        <AtlasIcon :id="row.block.id" :size="36" />
        <span><strong>{{ row.block.name }} ×{{ row.count }}</strong><small>{{ row.block.description }}</small></span>
      </a>
      <p>中心层坐标为 Y=0。点击方块查看资料。</p>
    </div>
  </div>
</template>
