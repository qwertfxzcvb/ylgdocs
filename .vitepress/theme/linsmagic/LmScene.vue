<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { entryById, entryHref, textureUrl } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'
import { tutorialScenes, type SceneBlock } from './tutorialScenes'
import { aimAt, cutter, grindstoneModel, mirror, mul, shaft, steamEngine, turbine, windmill, type Face, type Part } from './displayParts'

/**
 * 教程用的 3D 示意场景：场景数据写在 tutorialScenes.ts，正文里 <LmScene id="pipe-basic" /> 引用。
 * 与百科的 AtlasStructure 同一套方块渲染（拖动旋转、悬停看名称、点击进资料页），另外支持：
 *  - axis：原木类方块的年轮面朝向（阀门的方向就靠它看）
 *  - facing：顶面画箭头（单向运输器、物品流向）
 *  - tag：方块上方的编号气泡，对应下方的步骤说明
 *  - bad：标红的错误示范
 *  - flows：沿路径移动的物品，演示运输过程
 *  - 发电方块（风车、传动器、切削发电机、聚光镜、透平机、蒸汽机）按插件的展示实体画出外形和动画，见 displayParts.ts
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
/** 滚轮缩放倍数（乘在自动适配的 scale 上） */
const zoom = ref(1)
const sceneEl = ref<HTMLElement | null>(null)
const figureEl = ref<HTMLElement | null>(null)
const fullscreen = ref(false)

watch(() => props.id, () => resetView())
function resetView() {
  rotateX.value = scene.value?.view?.rx ?? 58
  rotateZ.value = scene.value?.view?.rz ?? -35
  zoom.value = 1
}
function onWheel(event: WheelEvent) {
  zoom.value = Math.max(0.4, Math.min(4, zoom.value * (event.deltaY < 0 ? 1.12 : 1 / 1.12)))
}
/**
 * 全屏：先把场景铺满整个网页窗口（任何浏览器、手机都能用），浏览器允许时再顺带进入系统全屏。
 * 按 Esc 或再点一次按钮退出。
 */
function toggleFullscreen() {
  fullscreen.value = !fullscreen.value
  if (fullscreen.value) {
    figureEl.value?.requestFullscreen?.()?.catch(() => {})
  } else if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
  requestAnimationFrame(fit)
}
function onFullscreenChange() {
  // 系统全屏被 Esc 退出时，网页内的铺满也一起退出
  if (!document.fullscreenElement && fullscreen.value) fullscreen.value = false
  requestAnimationFrame(fit)
}
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && fullscreen.value) toggleFullscreen()
}
resetView()

const bounds = computed(() => {
  const blocks = scene.value?.blocks ?? []
  const xs = blocks.map(b => b.x), ys = blocks.map(b => b.y), zs = blocks.map(b => b.z)
  // 风机扇叶伸出机舱约 3.3 格，也要算进画面范围
  for (const r of scene.value?.rotors ?? []) {
    const alongX = r.facing === 'north' || r.facing === 'south'
    xs.push(r.x + (alongX ? 3.3 : 0), r.x - (alongX ? 3.3 : 0))
    zs.push(r.z + (alongX ? 0 : 3.3), r.z - (alongX ? 0 : 3.3))
    ys.push(r.y + 3.3, r.y - 3.3)
  }
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
  dropper: 'block/dropper_front', observer: 'block/observer_front', loom: 'block/loom_front',
  daylight_detector: 'block/daylight_detector_top', smooth_red_sandstone: 'block/red_sandstone_top',
  // 太阳能透平机：方块是沉重核心，游戏里外面罩着一层宝库外壳的展示实体
  heavy_core: 'block/vault_side_off', polished_blackstone_wall: 'block/polished_blackstone'
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
  if (m === 'heavy_core') return textureUrl('block/vault_top')
  if (LOG_LIKE.test(m)) return textureUrl(`block/${m}_top`)
  return sideTexture(block)
}
/**
 * CSS 面与世界坐标的对应：world x ↔ left/right，world z ↔ top/bottom（CSS 的 Y），world y（高度）↔ front/back。
 * axis 指定哪一对面画年轮（端面）；没写 axis 的原木类默认竖放（上下是端面），与游戏里直接放在地上一致。
 */
function faceTexture(block: SceneBlock, face: string) {
  const m = material(block)
  const axis = block.axis ?? (LOG_LIKE.test(m) || m === 'barrel' || m === 'piston' || m === 'heavy_core' ? 'y' : null)
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
  // 栏杆类（ME线缆）贴图大部分透明，不垫底色会露出方块的白底
  else if (/_bars$/.test(material(block))) style.backgroundColor = 'transparent'
  // 草方块顶面贴图是灰度的，游戏里按生物群系染绿，这里用平原的草色
  // 水的贴图是灰度的，游戏里按生物群系染蓝
  else if (material(block) === 'water' || block.texture === 'block/water_still') {
    style.backgroundColor = '#3f76e4'
    style.backgroundBlendMode = 'multiply'
    style.backgroundSize = '100% auto'
  }
  else if (material(block) === 'grass_block' || block.texture === 'block/grass_block_top') {
    style.backgroundColor = '#79c05a'
    style.backgroundBlendMode = 'multiply'
  }
  return style
}
function isChest(block: SceneBlock) { return /^minecraft:(chest|trapped_chest)$/.test(block.id) }
/** 栏杆类（ME线缆是铜栏杆）：按相邻方块连成竖直的栏杆片，而不是六面贴图的方块 */
function isBars(block: SceneBlock) { return /_bars$/.test(material(block)) }
/** 拉杆：墙上的圆石底座 + 斜着的木柄 */
function isLever(block: SceneBlock) { return material(block) === 'lever' }
const occupied = computed(() => new Set((scene.value?.blocks ?? []).map(b => `${b.x},${b.y},${b.z}`)))
/**
 * 栏杆的朝向：和游戏一样，东西方向有相邻方块就沿东西连成一片，南北同理；
 * 两个方向都有，或者都没有（孤立 / 竖直一根），画成十字。
 */
function barsPlanes(block: SceneBlock) {
  const has = (dx: number, dz: number) => occupied.value.has(`${block.x + dx},${block.y},${block.z + dz}`)
  const alongX = has(1, 0) || has(-1, 0)
  const alongZ = has(0, 1) || has(0, -1)
  if (alongX && !alongZ) return ['x']
  if (alongZ && !alongX) return ['y']
  return ['x', 'y']
}
/** 阳光传感器（ME光伏板）：6/16 格高的薄板 */
function isPlate(block: SceneBlock) { return material(block) === 'daylight_detector' }
function blockTransform(block: SceneBlock) {
  const base = place(block.x, block.y, block.z)
  // 立方体高 60px（CSS 的 Z 轴是高度）；压扁到 6/16 后再下移，让底面贴着原来的底面
  return isPlate(block) ? `${base} translateZ(-18.75px) scaleZ(0.375)` : base
}
function plateFaceStyle(block: SceneBlock, face: string) {
  if (face === 'front') return { backgroundImage: `url(${textureUrl('block/daylight_detector_top')})` }
  if (face === 'back') return { backgroundImage: `url(${textureUrl('block/daylight_detector_side')})` }
  return { backgroundImage: `url(${textureUrl('block/daylight_detector_side')})`, backgroundSize: '100% 100%' }
}

interface Box { key: string; transform: string; w: number; d: number; h: number; texture: string }

// ---------- 发电方块的展示实体（外形与动画移植自插件，见 displayParts.ts） ----------
const PART_UNIT = 60 // 零件按方块的实际画法（60px 一格）缩放
/** 插件坐标（x 东、y 上、z 南）→ 场景 CSS（X、Y = z、Z = 高度），再把 100px 的立方体缩成单位立方体 */
const TO_CSS = [PART_UNIT, 0, 0, 0, 0, 0, PART_UNIT, 0, 0, PART_UNIT, 0, 0, 0, 0, 0, 1]
const FROM_BOX = [0.01, 0, 0, 0, 0, 0.01, 0, 0, 0, 0, 0.01, 0, 0, 0, 0, 1]
const KINETIC_POWER: Record<string, number> = { 'ME蒸汽机': 12, '太阳能透平机': 16 }
function isPartBlock(block: SceneBlock) {
  return ['机械传动器', 'ME切削发电机', '太阳能聚光镜', '太阳能透平机', 'ME蒸汽机'].includes(block.id)
}
/** 切削发电机正下方的红石块由零件画（会被磨矮），方块本身不画 */
function hiddenCube(block: SceneBlock) {
  if (block.id !== 'minecraft:redstone_block') return false
  return (scene.value?.blocks ?? []).some(b => b.id === 'ME切削发电机' && b.x === block.x && b.y === block.y + 1 && b.z === block.z)
}
const parts = computed<Array<Part & { transform: string }>>(() => {
  const blocks = scene.value?.blocks ?? []
  const rotors = scene.value?.rotors ?? []
  const t = clock.value
  // 场景里的动力源都接在同一个传动网上：总动力平分给切削发电机（和插件的 Kinetic.share 一样）
  let total = 0
  for (const b of blocks) total += b.power ?? KINETIC_POWER[b.id] ?? 0
  for (const r of rotors) total += r.power ?? 16
  const cutters = blocks.filter(b => b.id === 'ME切削发电机').length
  const share = cutters ? total / cutters : 0
  const turbines = blocks.filter(b => b.id === '太阳能透平机')
  const out: Array<Part & { transform: string }> = []
  const push = (prefix: string, list: Part[]) => {
    for (const p of list) {
      const m = mul(mul(TO_CSS, p.m), FROM_BOX)
      out.push({ ...p, key: `${prefix}-${p.key}`, transform: `${place(p.anchor[0], p.anchor[1], p.anchor[2])} matrix3d(${m.join(',')})` })
    }
  }
  for (const b of blocks) {
    const id = `${b.x},${b.y},${b.z}`
    const f = b.facing as Face | undefined
    if (b.id === '机械传动器') push(id, [...grindstoneModel(b.x, b.y, b.z, f), ...shaft(b.x, b.y, b.z, f, total, t)])
    else if (b.id === 'ME切削发电机') push(id, cutter(b.x, b.y, b.z, f, share, t))
    else if (b.id === '太阳能透平机') push(id, turbine(b.x, b.y, b.z, f, b.power ?? 16, t))
    else if (b.id === 'ME蒸汽机') push(id, steamEngine(b.x, b.y, b.z, f, b.power ?? 12, t))
    else if (b.id === '太阳能聚光镜') {
      // 镜面对准最近的透平机
      const from: [number, number, number] = [b.x, b.y + 1.25, b.z]
      let best: SceneBlock | null = null, bestD = Infinity
      for (const tb of turbines) {
        const d = Math.hypot(tb.x - b.x, tb.y - b.y, tb.z - b.z)
        if (d < bestD) { bestD = d; best = tb }
      }
      const aim = best ? aimAt(from, [best.x, best.y, best.z]) : { yaw: 0, pitch: 30 }
      push(id, mirror(b.x, b.y, b.z, aim.yaw, aim.pitch))
    }
  }
  for (const [ri, r] of rotors.entries()) push(`rotor${ri}`, windmill(r.x, r.y, r.z, r.facing, r.power ?? 16, t))
  return out
})
const PART_FACES = ['translateZ(0)', 'translateZ(100px)', 'rotateY(-90deg)', 'translateX(100px) rotateY(-90deg)',
  'rotateX(90deg)', 'translateY(100px) rotateX(90deg)']
const hasMotion = computed(() => !!(scene.value?.flows?.length || scene.value?.rotors?.length || scene.value?.blocks.some(isPartBlock)))

/**
 * 拉杆按游戏里的模型画：底座 6×8×3（像素，1 格 = 16 像素）贴在墙上，木柄 2×2×10 斜 45°。
 * facing 是拉杆朝外的方向（挂在对面那堵墙上），默认朝上（放在地上）。
 */
const LEVER_DIR: Record<string, [number, number, number]> = {
  east: [1, 0, 0], west: [-1, 0, 0], south: [0, 1, 0], north: [0, -1, 0], up: [0, 0, 1]
}
const leverBoxes = computed<Box[]>(() => {
  const out: Box[] = []
  const U = 60 / 16 // 一个像素在方块里的尺寸（方块画成 60px）
  for (const b of scene.value?.blocks ?? []) {
    if (!isLever(b)) continue
    const f = b.facing && LEVER_DIR[b.facing] ? b.facing : 'up'
    const [dx, dy, dz] = LEVER_DIR[f]
    const base = place(b.x, b.y, b.z)
    // 底座中心：贴着墙，离方块中心 (8 - 1.5) 像素
    const off = (8 - 1.5) * U
    const baseAt = `translate3d(${-dx * off}px, ${-dy * off}px, ${-dz * off}px)`
    // 底座：沿朝向方向厚 3 像素；竖挂时宽 6、高 8，放地上时 6×8 平铺
    const thick = 3 * U, w = 6 * U, h = 8 * U
    const baseDims = f === 'up' ? { w, d: h, h: thick } : dx !== 0 ? { w: thick, d: w, h } : { w, d: thick, h }
    out.push({ key: `lever-base-${b.x},${b.y},${b.z}`, transform: `${base} ${baseAt}`, ...baseDims, texture: textureUrl('block/cobblestone') })
    // 木柄：从底座伸出，朝「外 + 上」斜 45°（放地上时朝东斜）
    const len = 10 * U
    const tilt = f === 'east' ? 'rotateY(45deg)' : f === 'west' ? 'rotateY(-45deg)' : f === 'south' ? 'rotateX(-45deg)'
      : f === 'north' ? 'rotateX(45deg)' : 'rotateY(35deg)'
    out.push({ key: `lever-stick-${b.x},${b.y},${b.z}`, transform: `${base} ${baseAt} ${tilt} translateZ(${len / 2}px)`,
      w: 2 * U, d: 2 * U, h: len, texture: textureUrl('block/oak_planks') })
  }
  return out
})

function boxFaces(b: Box) {
  const px = (v: number) => `${v}px`
  const face = (w: number, h: number, t: string) => ({ width: px(w), height: px(h), transform: `translate(-50%, -50%) ${t}`, backgroundImage: `url(${b.texture})` })
  return [
    face(b.w, b.d, `translateZ(${b.h / 2}px)`),
    face(b.w, b.d, `rotateY(180deg) translateZ(${b.h / 2}px)`),
    face(b.h, b.d, `rotateY(90deg) translateZ(${b.w / 2}px)`),
    face(b.h, b.d, `rotateY(-90deg) translateZ(${b.w / 2}px)`),
    face(b.w, b.h, `rotateX(90deg) translateZ(${b.d / 2}px)`),
    face(b.w, b.h, `rotateX(-90deg) translateZ(${b.d / 2}px)`)
  ]
}
function isGlass(block: SceneBlock) { return /stained_glass$|_bars$/.test(material(block)) }

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
  if (!visible || !playing.value || !hasMotion.value) { last = 0; return }
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
  const limit = fullscreen.value ? 2.2 : 1
  // 全屏时按整个场景的高度留足余量（高塔类场景顶端不被裁掉）
  const tall = fullscreen.value ? 1.05 : 0.78
  scale.value = Math.max(0.38, Math.min(limit, (el.clientWidth - 20) / need, (el.clientHeight + 40) / (need * tall)))
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
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  observer?.disconnect()
  seen?.disconnect()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('keydown', onKey)
})
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
  <!-- 全屏时挪到 body 下：文档内容区自成层叠上下文，留在原处会被顶栏和侧栏盖住 -->
  <Teleport to="body" :disabled="!fullscreen">
  <figure v-if="scene" ref="figureEl" class="lm-tscene" :class="{ 'lm-tscene-full': fullscreen }">
    <figcaption v-if="scene.title" class="lm-tscene-title">{{ scene.title }}</figcaption>
    <div ref="sceneEl" class="lm-scene lm-tscene-view" :style="{ height: `${scene.height ?? 330}px` }"
      @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" @wheel.prevent="onWheel">
      <div class="lm-world" :style="{ transform: `scale(${scale * zoom}) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)` }">
        <a v-for="block in scene.blocks" :key="`${block.x},${block.y},${block.z}`" class="lm-cube"
          :class="{ 'lm-tscene-invisible': block.id === '机械传动器', 'lm-tscene-bad': block.bad, 'lm-tscene-ghost': block.ghost, 'lm-tscene-glass': isGlass(block), 'lm-tscene-chest': isChest(block), 'lm-tscene-lit': activeTag && block.tag === activeTag }"
          :href="entryHref(block.id)" :data-lm-item-id="entryById[block.id] ? block.id : undefined"
          :style="{ transform: blockTransform(block) }" :aria-label="name(block)"
          @mouseenter="hovered = block; activeTag = block.tag ?? null" @mouseleave="hovered = null; activeTag = null" @click="blockClick">
          <template v-if="isBars(block)">
            <span v-for="plane in barsPlanes(block)" :key="plane" class="lm-tscene-bars" :class="`lm-tscene-bars-${plane}`"
              :style="{ backgroundImage: `url(${sideTexture(block)})` }"></span>
          </template>
          <span v-for="face in (isBars(block) || isLever(block) || hiddenCube(block) ? [] : ['front', 'back', 'left', 'right', 'top', 'bottom'])" :key="face" class="lm-cube-face"
            :class="`lm-face-${face}`" :style="isPlate(block) ? plateFaceStyle(block, face) : faceStyle(block, face)">
            <i v-if="face === 'front' && block.facing && arrowAngle[block.facing] !== undefined && (!isPartBlock(block) || block.id === '机械传动器')" class="lm-tscene-arrow"
              :style="{ transform: `rotate(${arrowAngle[block.facing]}deg)` }">▲</i>
            <i v-else-if="face === 'front' && (block.facing === 'up' || block.facing === 'down')" class="lm-tscene-arrow">{{ block.facing === 'up' ? '⊙' : '⊗' }}</i>
          </span>
        </a>
        <div v-for="box in leverBoxes" :key="box.key" class="lm-tscene-box" :style="{ transform: box.transform }">
          <span v-for="(f, fi) in boxFaces(box)" :key="fi" class="lm-tscene-box-face" :class="`lm-tscene-box-face-${fi}`" :style="f"></span>
        </div>
        <div v-for="part in parts" :key="part.key" class="lm-tscene-part" :style="{ transform: part.transform }">
          <span v-for="(ft, fi) in PART_FACES" :key="fi" class="lm-tscene-part-face" :class="`lm-tscene-part-face-${fi}`"
            :style="{ transform: ft, backgroundImage: `url(${textureUrl(part.faces?.[fi] ?? part.texture)})` }"></span>
        </div>
        <img v-for="sprite in sprites" :key="sprite.key" class="lm-tscene-sprite" :src="spriteUrl(sprite.icon)" alt=""
          :style="{ transform: billboard(sprite.x, sprite.y, sprite.z, 0.62) }" />
        <span v-for="block in scene.blocks.filter(b => b.tag)" :key="`tag-${block.x},${block.y},${block.z}`"
          class="lm-tscene-tag" :class="{ 'lm-tscene-tag-bad': block.bad, 'lm-tscene-lit': activeTag === block.tag }"
          :style="{ transform: billboard(block.x, block.y, block.z, 0.95) }">{{ block.bad ? '✗' : block.tag }}</span>
      </div>
      <div class="lm-tscene-controls" @pointerdown.stop>
        <button v-if="hasMotion" type="button" @click="playing = !playing">{{ playing ? '暂停' : '播放' }}</button>
        <button type="button" @click="resetView">重置视角</button>
        <button type="button" @click="toggleFullscreen">{{ fullscreen ? '退出全屏' : '全屏' }}</button>
      </div>
    </div>
    <div class="lm-scene-caption">{{ hovered ? `${name(hovered)}${hovered.note ? ' · ' + hovered.note : ''} · 点击查看资料` : '拖动旋转 · 滚轮缩放 · 悬停方块看说明 · 点击方块打开资料页' }}</div>
    <ol v-if="scene.notes?.length" class="lm-tscene-notes">
      <li v-for="note in scene.notes" :key="note.tag" :class="{ 'lm-tscene-lit': activeTag === note.tag, 'lm-tscene-note-bad': note.bad }"
        @mouseenter="activeTag = note.tag" @mouseleave="activeTag = null">
        <b>{{ note.bad ? '✗' : note.tag }}</b><span v-html="note.text"></span>
      </li>
    </ol>
    <div v-if="!scene.hideCounts" class="lm-tscene-counts">
      <a v-for="row in counts" :key="row.block.id" :href="entryHref(row.block.id)" :data-lm-item-id="entryById[row.block.id] ? row.block.id : undefined">
        <AtlasIcon :id="row.block.id" :texture="entryById[row.block.id] ? undefined : (row.block.texture ?? `block/${material(row.block)}`)" :size="26" />
        <span>{{ kindName(row.block) }}</span><strong>×{{ row.count }}</strong>
      </a>
    </div>
  </figure>
  </Teleport>
</template>
