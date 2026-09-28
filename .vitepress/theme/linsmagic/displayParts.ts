/**
 * 发电方块的展示实体外形与动画：逐行移植自插件的 BlockDisplay 代码，数值和变换顺序保持一致，
 * 这样教程场景里看到的外形、转速和游戏里一样。改插件的外形 / 动画时回来同步：
 *  - 风车扇叶        ae/machine/Generators.spawnRotor / bladeMatrix
 *  - 机械传动器砂轮  ae/machine/Kinetic.spawn / barMatrix / animate
 *  - 切削发电机      ae/machine/Cutters.render / bladeMatrix / rodMatrix / moveBlade
 *  - 聚光镜 / 透平机 ae/machine/Solar.spawnMirror / plateMatrix / spawnMill / bladeMatrix / spin
 *  - 蒸汽机          ae/machine/Steam.spawn / spin 及各 xxxMatrix
 *
 * 矩阵是 JOML 的约定（列向量、右乘：m.translate(...) = m × T），数组按列存，可直接给 CSS matrix3d。
 * 每个零件是一个单位立方体 [0,1]³，经 m 变换后相对于实体位置（anchor，世界坐标）摆放。
 */

export type M4 = number[]

export function ident(): M4 { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }

export function mul(a: M4, b: M4): M4 {
  const out = new Array(16).fill(0)
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]
    out[c * 4 + r] = s
  }
  return out
}

/** 仿 JOML Matrix4f 的链式写法 */
class Mat {
  m: M4 = ident()
  private apply(b: M4) { this.m = mul(this.m, b); return this }
  translate(x: number, y: number, z: number) { return this.apply([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]) }
  scale(x: number, y: number, z: number) { return this.apply([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]) }
  rotateX(a: number) { const c = Math.cos(a), s = Math.sin(a); return this.apply([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]) }
  rotateY(a: number) { const c = Math.cos(a), s = Math.sin(a); return this.apply([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]) }
  rotateZ(a: number) { const c = Math.cos(a), s = Math.sin(a); return this.apply([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) }
}
const M = () => new Mat()

export type Face = 'north' | 'south' | 'east' | 'west' | 'up' | 'down'

export interface Part {
  key: string
  /** 实体位置（世界坐标，方块中心 = x, y, z） */
  anchor: [number, number, number]
  m: M4
  texture: string
  /** 六个面各自的贴图（z=0、z=1、x=0、x=1、y=0、y=1），不写就都用 texture */
  faces?: string[]
}

const rad = (deg: number) => deg * Math.PI / 180
const DIR: Record<Face, [number, number, number]> = {
  north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0], up: [0, 1, 0], down: [0, -1, 0]
}
function yawOf(face: Face) {
  return face === 'south' ? 0 : face === 'north' ? Math.PI : face === 'east' ? Math.PI / 2 : -Math.PI / 2
}
/** 水平朝向：朝上 / 朝下 / 没写时按北 */
function horizontal(face?: Face): Face {
  return face && face !== 'up' && face !== 'down' ? face : 'north'
}
/** 插件每 5 tick 转 step 度并插值 5 tick，折成连续转动：每秒 4 × step 度 */
function angleAt(t: number, stepDeg: number) { return rad(stepDeg * 4 * t) % (Math.PI * 2) }

// ================== 风车 ==================

/** Generators：轮毂在机舱正前方 0.75 格；三片扇叶长 3.1、宽 0.34、厚 0.07，扭角 12° */
export function windmill(x: number, y: number, z: number, facing: Face, power: number, t: number): Part[] {
  const face = horizontal(facing), [dx, , dz] = DIR[face], yaw = yawOf(face)
  const at: [number, number, number] = [x + dx * 0.75, y, z + dz * 0.75]
  const out: Part[] = [{ key: 'hub', anchor: at, texture: 'block/iron_block',
    m: M().rotateY(yaw).translate(-0.22, -0.22, -0.3).scale(0.44, 0.44, 0.5).m }]
  const rot = power > 0 ? angleAt(t, Math.min(35, 6 + power * 1.6)) : 0
  for (let i = 0; i < 3; i++) {
    out.push({ key: `blade${i}`, anchor: at, texture: 'block/white_concrete',
      m: M().rotateY(yaw).rotateZ(rot + Math.PI * 2 / 3 * i).rotateY(rad(12))
        .translate(-0.34 / 2, 0.15, -0.07 / 2).scale(0.34, 3.1, 0.07).m })
  }
  return out
}

// ================== 机械传动器 ==================

/** Kinetic：地上的砂轮轮心在 10/16 高；两根 1.0 × 0.14 的铁条交叉，绕水平轮轴转 */
export function shaft(x: number, y: number, z: number, facing: Face | undefined, power: number, t: number): Part[] {
  // 轮轴与砂轮朝向垂直：沿东西放的传动器轮轴朝北，沿南北放的朝东，竖着的按北
  const f = facing ?? 'north'
  const axle: Face = DIR[f][0] !== 0 ? 'north' : DIR[f][2] !== 0 ? 'east' : 'north'
  const at: [number, number, number] = [x, y + 0.125, z]
  const angle = power > 0 ? angleAt(t, Math.min(52, 8 + power * 1.2)) : 0
  const out: Part[] = []
  for (let i = 0; i < 2; i++) {
    const m = M()
    if (axle === 'east') m.rotateY(Math.PI / 2)
    m.rotateZ(angle + Math.PI / 2 * i).translate(-0.5, -0.07, -0.07).scale(1, 0.14, 0.14)
    out.push({ key: `bar${i}`, anchor: at, texture: 'block/iron_block', m: m.m })
  }
  return out
}

/**
 * 原版砂轮的方块模型（传动器的方块本身）：中间 8×12×12 像素的轮子，两侧轴头和两条腿。
 * 轮子的平面朝向与插件里砂轮铁条的转轴一致（沿东西放的传动器轮面朝南北）。
 */
export function grindstoneModel(x: number, y: number, z: number, facing: Face | undefined): Part[] {
  const f = facing ?? 'north'
  // 轮轴沿 Z（北）时，把按「轮轴沿 X」画的模型绕竖轴转 90°
  const axisZ = !(DIR[f][2] !== 0)
  const at: [number, number, number] = [x, y, z]
  const box = (key: string, from: number[], to: number[], faces: string[]): Part => {
    const m = M()
    if (axisZ) m.rotateY(Math.PI / 2)
    m.translate(-0.5, -0.5, -0.5).translate(from[0] / 16, from[1] / 16, from[2] / 16)
      .scale((to[0] - from[0]) / 16, (to[1] - from[1]) / 16, (to[2] - from[2]) / 16)
    return { key, anchor: at, m: m.m, texture: faces[0], faces }
  }
  const SIDE = 'block/grindstone_side', ROUND = 'block/grindstone_round', PIVOT = 'block/grindstone_pivot', LEG = 'block/dark_oak_log'
  return [
    box('wheel', [4, 4, 2], [12, 16, 14], [ROUND, ROUND, SIDE, SIDE, ROUND, ROUND]),
    box('pivot1', [2, 7, 5], [4, 13, 11], Array(6).fill(PIVOT)),
    box('pivot2', [12, 7, 5], [14, 13, 11], Array(6).fill(PIVOT)),
    box('leg1', [2, 0, 6], [4, 7, 10], Array(6).fill(LEG)),
    box('leg2', [12, 0, 6], [14, 7, 10], Array(6).fill(LEG))
  ]
}

// ================== 切削发电机 ==================

/**
 * Cutters：正下方的红石块（1.0 → 0.1 高）、刀头（0.66 × 0.1 × 0.16，沿朝向 ±0.28 往返）、
 * 苍白橡木活塞杆（0.14 粗，接在刀面上、顶到机器内顶）。实体在正下方那格的中心。
 * 游戏里磨一块红石要几分钟，这里把磨损压成 30 秒一轮，方便看清。
 */
export function cutter(x: number, y: number, z: number, facing: Face | undefined, power: number, t: number): Part[] {
  const at: [number, number, number] = [x, y - 1, z]
  const yaw = yawOf(horizontal(facing))
  const wear = power > 0 ? 1 - ((t / 30) % 1) : 1
  const s = 0.1 + 0.9 * wear
  // 刀头每 5 tick 走 0.035 + 0.028 × 动力，碰到 ±0.28 折返
  const LIMIT = 0.28
  const travel = power > 0 ? (0.035 + 0.028 * power) * 4 * t : 0
  const phase = travel % (LIMIT * 4)
  const off = phase < LIMIT * 2 ? -LIMIT + phase : 3 * LIMIT - phase
  const bladeTop = s - 0.5 - 0.01 + 0.1
  const bottom = bladeTop - 0.01
  const len = Math.max(0.02, Math.min(1.5, 1.45 - bottom))
  return [
    { key: 'block', anchor: at, texture: 'block/redstone_block', m: M().translate(-0.5, -0.5, -0.5).scale(1, s, 1).m },
    { key: 'blade', anchor: at, texture: 'block/iron_block',
      m: M().rotateY(yaw).translate(-0.33, s - 0.5 - 0.01, off - 0.08).scale(0.66, 0.1, 0.16).m },
    { key: 'rod', anchor: at, texture: 'block/pale_oak_log',
      m: M().rotateY(yaw).translate(-0.07, bottom, off - 0.07).scale(0.14, len, 0.14).m }
  ]
}

// ================== 太阳能 ==================

/** Solar：铁立柱接到方块上方 1.25 的枢轴，镜板是 2.22 × 1.48 的薄干海带块，法线 = 光的方向 */
export function mirror(x: number, y: number, z: number, yawDeg: number, pitchDeg: number): Part[] {
  const at: [number, number, number] = [x, y, z]
  const PIVOT = 1.25
  return [
    { key: 'post', anchor: at, texture: 'block/iron_block', m: M().translate(-0.05, 0.5, -0.05).scale(0.1, PIVOT - 0.5, 0.1).m },
    { key: 'hinge', anchor: at, texture: 'block/iron_block', m: M().translate(-0.09, PIVOT - 0.09, -0.09).scale(0.18, 0.18, 0.18).m },
    { key: 'plate', anchor: at, texture: 'block/dried_kelp_top',
      m: M().translate(0, PIVOT, 0).rotateY(-rad(yawDeg)).rotateX(Math.PI / 2 - rad(pitchDeg))
        .translate(-2.22 / 2, -0.07 / 2, -1.48 / 2).scale(2.22, 0.07, 1.48).m }
  ]
}

/** 让镜面法线指向目标（和插件界面里「对准」的算法一致：yaw 0 = 南、90 = 西；仰角最低 -45°） */
export function aimAt(from: [number, number, number], to: [number, number, number]) {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2]
  const len = Math.hypot(dx, dy, dz) || 1
  const pitch = Math.max(-45, Math.min(90, Math.asin(dy / len) * 180 / Math.PI))
  const yaw = ((Math.atan2(-dx, dz) * 180 / Math.PI) + 360) % 360
  return { yaw, pitch }
}

/** Solar：顶上的集热板（烤热后是岩浆块）、朝向那一面探出 0.62 的轮毂和四片叶片 */
export function turbine(x: number, y: number, z: number, facing: Face | undefined, power: number, t: number): Part[] {
  const face = horizontal(facing), [dx, , dz] = DIR[face], yaw = yawOf(face)
  const hub: [number, number, number] = [x + dx * 0.62, y, z + dz * 0.62]
  const out: Part[] = [
    { key: 'receiver', anchor: [x, y + 0.5 + 0.05, z], texture: power > 0 ? 'block/magma' : 'block/iron_block',
      m: M().translate(-0.45, -0.05, -0.45).scale(0.9, 0.1, 0.9).m },
    { key: 'hub', anchor: hub, texture: 'block/iron_block', m: M().rotateY(yaw).translate(-0.18, -0.18, -0.3).scale(0.36, 0.36, 0.6).m }
  ]
  const rot = power > 0 ? angleAt(t, Math.min(35, 6 + power * 1.8)) : 0
  for (let i = 0; i < 4; i++) {
    out.push({ key: `blade${i}`, anchor: hub, texture: 'block/light_gray_concrete',
      m: M().rotateY(yaw).rotateZ(rot + Math.PI / 2 * i).translate(-0.1, 0.1, -0.03).scale(0.2, 0.62, 0.06).m })
  }
  return out
}

// ================== 蒸汽机 ==================

const BED_Y = 0.44, BED_T = 0.18, BED_HALF = 0.30, BED_BACK = -0.75, BED_FRONT = 1.05
const PIVOT_Y = 1.60, ARM_PISTON = 0.62, ARM_WHEEL = 0.80, BEAM_W = 0.20, BEAM_T = 0.16
const WHEEL_Y = 1.02, WHEEL_Z = 0.80, WHEEL_R = 0.40, WHEEL_T = 0.12, CRANK_R = 0.21
const CYL_Y = 0.86, CYL_Z = -0.62, CYL_W = 0.42, CYL_H = 0.48
const PISTON_T = 0.10, PISTON_LEN = 0.70, ROD_T = 0.09, PIN_W = 0.10, PIN_D = 0.26

/** Steam：机座、立柱、轴承、汽缸、烟囱、炉门、飞轮支架是静止的；活塞杆、游梁、连杆、飞轮、辐条、曲柄销按曲柄角联动 */
export function steamEngine(x: number, y: number, z: number, facing: Face | undefined, power: number, t: number): Part[] {
  const at: [number, number, number] = [x, y, z]
  const yaw = yawOf(horizontal(facing))
  const running = power > 0
  const theta = running ? angleAt(t, Math.min(45, 8 + power * 1.8)) : 0
  const phi = Math.asin(Math.max(-1, Math.min(1, CRANK_R / ARM_WHEEL * Math.sin(theta))))
  const disc = Math.PI / 2 - theta
  const R = () => M().rotateY(yaw)
  const IRON = 'block/iron_block', SLATE = 'block/polished_deepslate'
  const door = running ? 'block/magma' : 'block/deepslate_tiles'
  const parts: Array<[string, string, M4]> = [
    ['bed', IRON, R().translate(-BED_HALF, BED_Y, BED_BACK).scale(BED_HALF * 2, BED_T, BED_FRONT - BED_BACK).m],
    ['post', IRON, R().translate(-0.08, BED_Y + BED_T, -0.15).scale(0.16, PIVOT_Y - (BED_Y + BED_T) - 0.08, 0.30).m],
    ['bear1', SLATE, R().translate(-0.12, PIVOT_Y - 0.12, 0.10).scale(0.24, 0.24, 0.12).m],
    ['bear2', SLATE, R().translate(-0.12, PIVOT_Y - 0.12, -0.22).scale(0.24, 0.24, 0.12).m],
    ['cyl', IRON, R().translate(-CYL_W / 2, CYL_Y - CYL_H / 2, CYL_Z - CYL_W / 2).scale(CYL_W, CYL_H, CYL_W).m],
    ['chimney', SLATE, R().translate(-0.30, BED_Y + BED_T, -0.42).scale(0.14, 0.50, 0.14).m],
    ['door1', door, R().translate(0.46, 0.25, -0.39).scale(0.06, 0.30, 0.34).m],
    ['door2', door, R().translate(-0.52, 0.25, -0.39).scale(0.06, 0.30, 0.34).m],
    ['wfoot1', IRON, R().translate(0.20, BED_Y + BED_T, WHEEL_Z - 0.10).scale(0.16, WHEEL_Y - (BED_Y + BED_T) + 0.08, 0.20).m],
    ['wfoot2', IRON, R().translate(-0.36, BED_Y + BED_T, WHEEL_Z - 0.10).scale(0.16, WHEEL_Y - (BED_Y + BED_T) + 0.08, 0.20).m],
    ['axle', IRON, R().translate(-0.34, WHEEL_Y - 0.07, WHEEL_Z - 0.07).scale(0.68, 0.14, 0.14).m]
  ]
  // 活塞杆：上端吊在游梁汽缸侧
  const topY = PIVOT_Y - ARM_PISTON * Math.sin(phi), pz = -ARM_PISTON * Math.cos(phi)
  parts.push(['piston', SLATE, R().translate(-PISTON_T / 2, topY - PISTON_LEN, pz - PISTON_T / 2).scale(PISTON_T, PISTON_LEN, PISTON_T).m])
  // 游梁
  parts.push(['beam', SLATE, R().translate(0, PIVOT_Y, 0).rotateX(-phi)
    .translate(-BEAM_W / 2, -BEAM_T / 2, -ARM_PISTON).scale(BEAM_W, BEAM_T, ARM_PISTON + ARM_WHEEL).m])
  // 连杆：游梁飞轮侧的端点 → 曲柄销
  const ez = ARM_WHEEL * Math.cos(phi), ey = PIVOT_Y + ARM_WHEEL * Math.sin(phi)
  const cz = WHEEL_Z + CRANK_R * Math.cos(theta), cy = WHEEL_Y + CRANK_R * Math.sin(theta)
  const len = Math.max(0.05, Math.hypot(ez - cz, ey - cy)), ang = Math.atan2(ez - cz, ey - cy)
  parts.push(['rod', IRON, R().translate(0, (ey + cy) / 2, (ez + cz) / 2).rotateX(ang)
    .translate(-ROD_T / 2, -len / 2, -ROD_T / 2).scale(ROD_T, len, ROD_T).m])
  // 飞轮、轮毂、两根辐条、曲柄销
  const W = () => R().translate(0, WHEEL_Y, WHEEL_Z).rotateX(disc)
  const spoke = WHEEL_R * 2 - 0.06
  parts.push(['wheel', IRON, W().translate(-WHEEL_T / 2, -WHEEL_R, -WHEEL_R).scale(WHEEL_T, WHEEL_R * 2, WHEEL_R * 2).m])
  parts.push(['hub', SLATE, W().translate(-0.09, -0.11, -0.11).scale(0.18, 0.22, 0.22).m])
  parts.push(['spoke1', SLATE, W().translate(-0.05, -spoke / 2, -0.05).scale(0.10, spoke, 0.10).m])
  parts.push(['spoke2', SLATE, W().translate(-0.05, -0.05, -spoke / 2).scale(0.10, 0.10, spoke).m])
  parts.push(['pin', SLATE, W().translate(-PIN_W / 2, CRANK_R - PIN_W / 2, -PIN_D / 2).scale(PIN_W, PIN_W, PIN_D).m])
  return parts.map(([key, texture, m]) => ({ key, anchor: at, texture, m }))
}
