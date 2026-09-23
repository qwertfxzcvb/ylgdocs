<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { entryById, entryHref, textureUrl } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'
import { tutorialScenes, type SceneBlock } from './tutorialScenes'

/**
 * 教程用的 3D 示意场景：场景数据写在 tutorialScenes.ts，正文里 <LmScene id="pipe-basic" /> 引用。
 * 与百科的 AtlasStructure 同一套方块渲染（拖动旋转、悬停看名称、点击进资料页），另外支持：
 *  - axis：原木类方块的年轮面朝向（阀门的方向就靠它看）
 *  - facing：顶面画箭头（单向运输器、物品流向）
 *  - tag：方块上方的编号气泡，对应下方的步骤说明
 *  - bad：标红的错误示范
 *  - flows：沿路径移动的物品，演示运输过程
 */
const props = defineProps<{ id: string }>()
const scene = computed(() => tutorialScenes[props.id])

const CELL = 70
const rotateX = ref(58)
const rotateZ = ref(-35)
const hovered = ref<SceneBlock | null>(null)
const activeTag = ref<string | null>(null)
const playing = ref(true)
const clock = ref(0)
const scale = ref(1)
const sceneEl = ref<HTMLElement | null>(null)

watch(() => props.id, () => resetView())
function resetView() {
  rotateX.value = scene.value?.view?.rx ?? 58
  rotateZ.value = scene.value?.view?.rz ?? -35
}
resetView()

const bounds = computed(() => {
  const blocks = scene.value?.blocks ?? []
  const xs = blocks.map(b => b.x), ys = blocks.map(b => b.y), zs = blocks.map(b => b.z)
  const min = (a: number[]) => a.length ? Math.min(...a) : 0
  const max = (a: number[]) => a.length ? Math.max(...a) : 0
  return {
    cx: (min(xs) + max(xs)) / 2, cy: (min(ys) + max(ys)) / 2, cz: (min(zs) + max(zs)) / 2,
    span: Math.max(max(xs) - min(xs), max(zs) - min(zs), max(ys) - min(ys)) + 1
  }
})

function place(x: number, y: number, z: number) {
  const b = bounds.value
  return `translate3d(${(x - b.cx) * CELL}px, ${(z - b.cz) * CELL}px, ${(y - b.cy) * CELL}px)`
}
/** 始终面向镜头的贴片：抵消外层的两次旋转 */
function billboard(x: number, y: number, z: number, lift = 0) {
  return `${place(x, y + lift, z)} rotateZ(${-rotateZ.value}deg) rotateX(${-rotateX.value}deg)`
}

// 方块贴图：原版方块直接取 block 贴图，插件物品取图标对应的方块
const special: Record<string, string> = {
  chest: 'block/oak_planks', trapped_chest: 'block/oak_planks', barrel: 'block/barrel_side',
  piston: 'block/piston_side', lightning_rod: 'block/copper_block', oxidized_lightning_rod: 'block/oxidized_copper',
  hopper: 'block/hopper_outside', comparator: 'block/smooth_stone', lever: 'block/cobblestone',
  furnace: 'block/furnace_front', composter: 'block/composter_side', dispenser: 'block/dispenser_front',
  dropper: 'block/dropper_front', observer: 'block/observer_front', loom: 'block/loom_front'
}
const LOG_LIKE = /(_log|_stem|pillar|basalt|bone_block|hay_block|chiseled_tuff_bricks|quartz_pillar)$/
function material(block: SceneBlock) {
  const raw = block.id.startsWith('minecraft:') ? block.id.slice(10) : (entryById[block.id]?.icon.replace(/^(item|block)\//, '') ?? 'stone')
  return raw.replace(/^waxed_/, '')
}
function sideTexture(block: SceneBlock) {
  if (block.texture) return textureUrl(block.texture)
  const m = material(block)
  return textureUrl(special[m] ?? `block/${m}`)
}
function endTexture(block: SceneBlock) {
  const m = material(block)
  if (block.endTexture) return textureUrl(block.endTexture)
  if (m === 'barrel') return textureUrl('block/barrel_top')
  if (m === 'piston') return textureUrl('block/piston_top')
  if (LOG_LIKE.test(m)) return textureUrl(`block/${m}_top`)
  return sideTexture(block)
}
/**
 * CSS 面与世界坐标的对应：world x ↔ left/right，world z ↔ top/bottom（CSS 的 Y），world y（高度）↔ front/back。
 * axis 指定哪一对面画年轮（端面）；没写 axis 的原木类默认竖放（上下是端面），与游戏里直接放在地上一致。
 */
function faceTexture(block: SceneBlock, face: string) {
  const m = material(block)
  const axis = block.axis ?? (LOG_LIKE.test(m) || m === 'barrel' || m === 'piston' ? 'y' : null)
  const endFaces = axis === 'x' ? ['left', 'right'] : axis === 'z' ? ['top', 'bottom'] : axis === 'y' ? ['front', 'back'] : []
  return endFaces.includes(face) ? endTexture(block) : sideTexture(block)
}
const arrowAngle: Record<string, number> = { north: 0, east: 90, south: 180, west: 270 }

function name(block: SceneBlock) {
  return block.label ?? entryById[block.id]?.name ?? block.id.replace(/^minecraft:/, '')
}
function kindName(block: SceneBlock) {
  return entryById[block.id]?.name ?? block.label ?? block.id.replace(/^minecraft:/, '')
}
/** 染色玻璃贴图本身很淡，垫一层底色，看起来才像对应颜色的管道 */
const glassTint: Record<string, string> = {
  black: 'rgba(10,10,14,.5)', gray: 'rgba(60,60,66,.45)', light_gray: 'rgba(150,150,150,.4)', white: 'rgba(235,235,235,.35)',
  purple: 'rgba(110,40,170,.45)', blue: 'rgba(40,60,180,.45)', light_blue: 'rgba(90,160,225,.4)', cyan: 'rgba(20,140,140,.45)'
}
function faceStyle(block: SceneBlock, face: string) {
  const style: Record<string, string> = { backgroundImage: `url(${faceTexture(block, face)})` }
  const m = material(block).match(/^(.*)_stained_glass$/)
  if (m && glassTint[m[1]]) style.backgroundColor = glassTint[m[1]]
  return style
}
function isChest(block: SceneBlock) { return /^minecraft:(chest|trapped_chest)$/.test(block.id) }
function isGlass(block: SceneBlock) { return /stained_glass$/.test(material(block)) }

// ---------- 流动的物品 ----------
interface FlowSprite { key: string; x: number; y: number; z: number; icon: string }
const sprites = computed<FlowSprite[]>(() => {
  const out: FlowSprite[] = []
  for (const [fi, flow] of (scene.value?.flows ?? []).entries()) {
    const pts = flow.path
    if (pts.length < 2) continue
    const seg: number[] = []
    let total = 0
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2])
      seg.push(d); total += d
    }
    const speed = flow.speed ?? 1.6
    const n = flow.count ?? Math.max(1, Math.round(total / 2.5))
    const cycle = total + 1.2 // 到终点后停一小会再从头开始
    for (let k = 0; k < n; k++) {
      let dist = ((clock.value * speed + (k * cycle) / n) % cycle)
      if (dist > total) continue // 到达终点后的间歇：物品已进入容器
      let i = 0
      while (i < seg.length - 1 && dist > seg[i]) { dist -= seg[i]; i++ }
      const t = seg[i] ? Math.min(1, dist / seg[i]) : 0
      const a = pts[i], b = pts[i + 1]
      const items = flow.items ?? [flow.item]
      out.push({ key: `${fi}-${k}`, x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, z: a[2] + (b[2] - a[2]) * t, icon: items[k % items.length] })
    }
  }
  return out
})
function spriteUrl(icon: string) {
  if (icon.includes('/')) return textureUrl(icon)
  const e = entryById[icon]
  return textureUrl(e?.icon ?? `item/${icon.replace(/^minecraft:/, '')}`)
}

// 只在场景出现在屏幕上时才跑动画：一页有七八个场景，全开会拖慢手机
let raf = 0
let last = 0
let visible = false
function frame(now: number) {
  raf = 0
  if (!visible || !playing.value || !scene.value?.flows?.length) { last = 0; return }
  if (last) clock.value += Math.min(0.05, (now - last) / 1000)
  last = now
  raf = requestAnimationFrame(frame)
}
function kick() { if (!raf && visible && playing.value) raf = requestAnimationFrame(frame) }
watch(playing, kick)

// ---------- 缩放：场景太大时整体缩小以放进容器 ----------
let observer: ResizeObserver | null = null
let seen: IntersectionObserver | null = null
function fit() {
  const el = sceneEl.value
  if (!el) return
  const need = (bounds.value.span + 1.2) * CELL
  scale.value = Math.max(0.38, Math.min(1, (el.clientWidth - 20) / need, (el.clientHeight + 40) / (need * 0.78)))
}
onMounted(() => {
  fit()
  if (typeof ResizeObserver !== 'undefined' && sceneEl.value) {
    observer = new ResizeObserver(fit)
    observer.observe(sceneEl.value)
  }
  if (typeof IntersectionObserver !== 'undefined' && sceneEl.value) {
    seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick() })
    seen.observe(sceneEl.value)
  } else { visible = true; kick() }
})
onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf); observer?.disconnect(); seen?.disconnect() })
watch(bounds, fit)

// ---------- 拖动旋转 ----------
let start: { x: number; y: number; rx: number; rz: number } | null = null
let dragged = false
function pointerDown(event: PointerEvent) {
  start = { x: event.clientX, y: event.clientY, rx: rotateX.value, rz: rotateZ.value }
  dragged = false
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function pointerMove(event: PointerEvent) {
  if (!start) return
  const dx = event.clientX - start.x, dy = event.clientY - start.y
  if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true
  rotateZ.value = start.rz - dx * .45
  rotateX.value = Math.max(15, Math.min(85, start.rx + dy * .4))
}
function pointerUp() { start = null }
function blockClick(event: MouseEvent) { if (dragged) event.preventDefault() }

const counts = computed(() => {
  const map = new Map<string, { block: SceneBlock; count: number }>()
  for (const block of scene.value?.blocks ?? []) {
    if (block.decor) continue
    const key = block.id
    const row = map.get(key)
    if (row) row.count++
    else map.set(key, { block, count: 1 })
  }
  return [...map.values()]
})
</script>

<template>
  <figure v-if="scene" class="lm-tscene">
    <figcaption v-if="scene.title" class="lm-tscene-title">{{ scene.title }}</figcaption>
    <div ref="sceneEl" class="lm-scene lm-tscene-view" :style="{ height: `${scene.height ?? 330}px` }"
      @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp">
      <div class="lm-world" :style="{ transform: `scale(${scale}) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)` }">
        <a v-for="block in scene.blocks" :key="`${block.x},${block.y},${block.z}`" class="lm-cube"
          :class="{ 'lm-tscene-bad': block.bad, 'lm-tscene-ghost': block.ghost, 'lm-tscene-glass': isGlass(block), 'lm-tscene-chest': isChest(block), 'lm-tscene-lit': activeTag && block.tag === activeTag }"
          :href="entryHref(block.id)" :data-lm-item-id="entryById[block.id] ? block.id : undefined"
          :style="{ transform: place(block.x, block.y, block.z) }" :aria-label="name(block)"
          @mouseenter="hovered = block; activeTag = block.tag ?? null" @mouseleave="hovered = null; activeTag = null" @click="blockClick">
          <span v-for="face in ['front', 'back', 'left', 'right', 'top', 'bottom']" :key="face" class="lm-cube-face"
            :class="`lm-face-${face}`" :style="faceStyle(block, face)">
            <i v-if="face === 'front' && block.facing && arrowAngle[block.facing] !== undefined" class="lm-tscene-arrow"
              :style="{ transform: `rotate(${arrowAngle[block.facing]}deg)` }">▲</i>
            <i v-else-if="face === 'front' && (block.facing === 'up' || block.facing === 'down')" class="lm-tscene-arrow">{{ block.facing === 'up' ? '⊙' : '⊗' }}</i>
          </span>
        </a>
        <img v-for="sprite in sprites" :key="sprite.key" class="lm-tscene-sprite" :src="spriteUrl(sprite.icon)" alt=""
          :style="{ transform: billboard(sprite.x, sprite.y, sprite.z, 0.62) }" />
        <span v-for="block in scene.blocks.filter(b => b.tag)" :key="`tag-${block.x},${block.y},${block.z}`"
          class="lm-tscene-tag" :class="{ 'lm-tscene-tag-bad': block.bad, 'lm-tscene-lit': activeTag === block.tag }"
          :style="{ transform: billboard(block.x, block.y, block.z, 0.95) }">{{ block.bad ? '✗' : block.tag }}</span>
      </div>
      <div class="lm-tscene-controls" @pointerdown.stop>
        <button v-if="scene.flows?.length" type="button" @click="playing = !playing">{{ playing ? '暂停' : '播放' }}</button>
        <button type="button" @click="resetView">重置视角</button>
      </div>
    </div>
    <div class="lm-scene-caption">{{ hovered ? `${name(hovered)}${hovered.note ? ' · ' + hovered.note : ''} · 点击查看资料` : '拖动旋转 · 悬停方块看说明 · 点击方块打开资料页' }}</div>
    <ol v-if="scene.notes?.length" class="lm-tscene-notes">
      <li v-for="note in scene.notes" :key="note.tag" :class="{ 'lm-tscene-lit': activeTag === note.tag, 'lm-tscene-note-bad': note.bad }"
        @mouseenter="activeTag = note.tag" @mouseleave="activeTag = null">
        <b>{{ note.bad ? '✗' : note.tag }}</b><span v-html="note.text"></span>
      </li>
    </ol>
    <div v-if="!scene.hideCounts" class="lm-tscene-counts">
      <a v-for="row in counts" :key="row.block.id" :href="entryHref(row.block.id)" :data-lm-item-id="entryById[row.block.id] ? row.block.id : undefined">
        <AtlasIcon :id="row.block.id" :texture="entryById[row.block.id] ? undefined : `block/${material(row.block)}`" :size="26" />
        <span>{{ kindName(row.block) }}</span><strong>×{{ row.count }}</strong>
      </a>
    </div>
  </figure>
</template>
