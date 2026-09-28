/**
 * 教程 3D 示意场景数据，由 <LmScene id="..." /> 引用。
 *
 * 坐标：x 向东为正，z 向南为正，y 向上为正（与游戏一致）。方块 id 用百科条目 id：
 * 插件物品写物品名（如 '传出阀'），原版方块写 'minecraft:xxx'。
 * 这些场景只是示意摆法，机制以插件代码为准；改插件的管道/机器逻辑时记得回来核对。
 */
export type Facing = 'north' | 'south' | 'east' | 'west' | 'up' | 'down'

export interface SceneBlock {
  x: number; y: number; z: number
  id: string
  /** 覆盖显示名 */
  label?: string
  /** 悬停时的补充说明 */
  note?: string
  /** 原木类方块的年轮面所在轴 */
  axis?: 'x' | 'y' | 'z'
  /** 顶面画一个箭头：阀门认准的方向 / 运输器的输出方向 */
  facing?: Facing
  /** 编号气泡，对应 notes 里同 tag 的说明 */
  tag?: string
  /** 错误示范（标红） */
  bad?: boolean
  /** 半透明显示（示意"任意容器"之类） */
  ghost?: boolean
  /** 不计入下方的方块清单 */
  decor?: boolean
  texture?: string
  endTexture?: string
  /** 动力源（蒸汽机 / 透平机）的机械动力，决定动画转速；不写按满额算 */
  power?: number
}

export interface SceneFlow {
  /** 路径折点（方块坐标，可带小数） */
  path: Array<[number, number, number]>
  /** 物品贴图：'item/diamond'、'block/cobblestone' 或百科物品 id */
  item: string
  /** 多种物品轮流出现 */
  items?: string[]
  speed?: number
  count?: number
}

/** 风车的转子（轮毂 + 三片扇叶），按游戏里展示实体的尺寸画，并随动画转动 */
export interface SceneRotor {
  /** 机舱方块坐标 */
  x: number; y: number; z: number
  /** 扇叶所在的一面 */
  facing: 'north' | 'south' | 'east' | 'west'
  /** 机械动力（离地高度决定），决定转速；不写按 16 */
  power?: number
}

export interface TutorialScene {
  title?: string
  height?: number
  view?: { rx: number; rz: number }
  blocks: SceneBlock[]
  rotors?: SceneRotor[]
  flows?: SceneFlow[]
  notes?: Array<{ tag: string; text: string; bad?: boolean }>
  hideCounts?: boolean
}

const CHEST = 'minecraft:chest'
const BARREL = 'minecraft:barrel'
const PIPE = '管道玻璃-A型'
const OUT = '传出阀'
const IN = '传入阀'

/** 一段直管：from..to（含两端），沿 x 或 z */
function run(id: string, a: [number, number, number], b: [number, number, number], extra: Partial<SceneBlock> = {}): SceneBlock[] {
  const out: SceneBlock[] = []
  const [dx, dy, dz] = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1]), Math.sign(b[2] - a[2])]
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2]))
  for (let i = 0; i <= n; i++) out.push({ x: a[0] + dx * i, y: a[1] + dy * i, z: a[2] + dz * i, id, ...extra })
  return out
}

export const tutorialScenes: Record<string, TutorialScene> = {
  'power-overview': {
    title: '机械动力发电：蒸汽机的动力经传动器送到切削发电机，切削发电机把电送进网络',
    height: 380,
    view: { rx: 62, rz: -35 },
    blocks: [
      { x: -1, y: 0, z: 0, id: 'minecraft:water', label: '水', texture: 'block/water_still', tag: '1', note: '贴着水才烧得动，水不消耗' },
      { x: 0, y: 0, z: 0, id: 'ME蒸汽机', facing: 'north', tag: '1', note: '烧煤，输出 12 动力；游梁和飞轮向北伸出' },
      { x: 1, y: 0, z: 0, id: '机械传动器', facing: 'east', tag: '2', note: '轴沿东西方向' },
      { x: 2, y: 0, z: 0, id: '机械传动器', facing: 'east' },
      { x: 3, y: 0, z: 0, id: 'ME切削发电机', facing: 'east', tag: '3', note: '把动力变成 AE 电' },
      { x: 3, y: -1, z: 0, id: 'minecraft:redstone_block', label: '红石块（被磨的料）', tag: '4' },
      { x: 4, y: 0, z: 0, id: 'ME线缆' },
      { x: 5, y: 0, z: 0, id: 'ME能源接收器', tag: '5', note: '网络的储能' },
      { x: 5, y: 0, z: 1, id: '压印器' },
      { x: 5, y: 1, z: 0, id: 'ME驱动器' }
    ],
    flows: [{ path: [[3, 0, 0], [5, 0, 0], [5, 0, 1]], item: 'item/glowstone_dust', speed: 2.5, count: 3 }],
    notes: [
      { tag: '1', text: '<b>ME蒸汽机</b>：燃料格放煤炭 / 木炭 / 煤炭块，贴着水就能持续输出 12 动力。没有机器在用动力时自动停火。' },
      { tag: '2', text: '<b>机械传动器</b>：只传机械动力，不导通 AE。放下时轴沿你的视线方向；相邻两根只要有一根的轴对着它们之间的连线就会相连。' },
      { tag: '3', text: '<b>ME切削发电机</b>：从除下方以外的五个面接收动力（传动器的轴要对准它），同时它本身是 AE 方块，贴着网络即可把电送进去。' },
      { tag: '4', text: '<b>红石块</b>：放在切削发电机正下方，会被收进去慢慢磨平，一块共发 20,000 AE。磨完后需要再放一块。' },
      { tag: '5', text: '<b>储能</b>：网络里要有能源接收器或能源元件存电，否则切削发电机无处送电。网络满电时切削发电机暂停，不消耗红石块。' }
    ]
  },

  'power-grid': {
    title: '独立电网：远处的发电站用能源导线送电，同时供两个 ME 网络',
    height: 400,
    view: { rx: 60, rz: -30 },
    blocks: [
      { x: -1, y: 0, z: 0, id: 'minecraft:water', label: '水', texture: 'block/water_still' },
      { x: 0, y: 0, z: 0, id: 'ME蒸汽机', facing: 'north' },
      { x: 1, y: 0, z: 0, id: '机械传动器', facing: 'east' },
      { x: 2, y: 0, z: 0, id: '机械传动器', facing: 'east' },
      { x: 3, y: 0, z: 0, id: 'ME切削发电机', facing: 'east', tag: '1', note: '贴着导线，发的电送进电网' },
      { x: 3, y: -1, z: 0, id: 'minecraft:redstone_block', label: '红石块' },
      { x: 4, y: 0, z: 0, id: '能源导线' },
      { x: 5, y: 0, z: 0, id: '能源导线', tag: '2', note: '只传电，不导通 AE' },
      ...run('能源导线', [6, 0, 0], [8, 0, 0]),
      { x: 6, y: 0, z: 1, id: '能源元件', tag: '3', note: '电网的电池' },
      { x: 9, y: 0, z: 0, id: 'ME能源接收器', tag: '4', note: '把电网接到网络 A' },
      { x: 10, y: 0, z: 0, id: 'ME驱动器' },
      { x: 10, y: 1, z: 0, id: 'ME终端' },
      ...run('能源导线', [8, 0, 1], [8, 0, 2]),
      { x: 8, y: 0, z: 3, id: 'ME能源接收器', note: '把电网接到网络 B' },
      { x: 9, y: 0, z: 3, id: 'ME驱动器' }
    ],
    flows: [
      { path: [[3, 0, 0], [8, 0, 0], [9, 0, 0]], item: 'item/glowstone_dust', speed: 2.5, count: 3 },
      { path: [[8, 0, 0], [8, 0, 3]], item: 'item/glowstone_dust', speed: 2.5, count: 2 }
    ],
    notes: [
      { tag: '1', text: '<b>发电方块</b>贴着能源导线就接入电网。它不必再和仓库网络连在一起，发电站可以建在远处。' },
      { tag: '2', text: '<b>能源导线</b>：只传电，不导通 AE，所以两端的网络不会合并。电网里没有传输损耗。' },
      { tag: '3', text: '<b>能源元件</b>贴着导线就成为电网的电池，发电站多出来的电先存在这里。' },
      { tag: '4', text: '<b>能源接收器</b>一面贴导线、一面贴 ME 网络，把电网的电送进这个网络。接几个接收器，就能同时给几个网络供电。' }
    ]
  },

  'power-solar': {
    title: '太阳能：四面聚光镜把光打到透平机上，透平机烤热后输出动力',
    height: 400,
    view: { rx: 60, rz: -30 },
    blocks: [
      { x: 0, y: 0, z: 0, id: '太阳能透平机', facing: 'south', tag: '2', note: '150 °C 起转，600 °C 满 16 动力' },
      { x: -3, y: 0, z: -3, id: '太阳能聚光镜', tag: '1', note: '镜面对准透平机' },
      { x: 3, y: 0, z: -3, id: '太阳能聚光镜' },
      { x: -3, y: 0, z: 3, id: '太阳能聚光镜' },
      { x: 0, y: 0, z: -4, id: '太阳能聚光镜' },
      { x: 1, y: 0, z: 0, id: '机械传动器', facing: 'east', tag: '3' },
      { x: 2, y: 0, z: 0, id: '机械传动器', facing: 'east' },
      { x: 3, y: 0, z: 0, id: 'ME切削发电机' },
      { x: 3, y: -1, z: 0, id: 'minecraft:redstone_block', label: '红石块' },
      { x: 4, y: 0, z: 0, id: 'ME线缆' },
      { x: 5, y: 0, z: 0, id: 'ME能源接收器' }
    ],
    flows: [
      { path: [[-3, 1.25, -3], [0, 0.5, 0]], item: 'item/glowstone_dust', speed: 3, count: 2 },
      { path: [[3, 1.25, -3], [0, 0.5, 0]], item: 'item/glowstone_dust', speed: 3, count: 2 },
      { path: [[-3, 1.25, 3], [0, 0.5, 0]], item: 'item/glowstone_dust', speed: 3, count: 2 },
      { path: [[0, 1.25, -4], [0, 0.5, 0]], item: 'item/glowstone_dust', speed: 3, count: 2 }
    ],
    notes: [
      { tag: '1', text: '<b>太阳能聚光镜</b>：光从镜板中心沿镜面法线射出，最远 24 格，中途被方块挡住就作废。右键打开界面用按钮转动镜面，界面会提示该对准哪里。' },
      { tag: '2', text: '<b>太阳能透平机</b>：被照热后才转动。离镜子 4 格左右时，4 面镜子即可把它烤到 600 °C 以上，输出满额 16 动力。' },
      { tag: '3', text: '<b>接到切削发电机</b>：透平机是动力源，贴哪一面都能接传动器，后面的接法与蒸汽机相同。只有主世界白天、不下雨时有阳光。' }
    ]
  },

  'power-wind': {
    title: '风车：用机械传动器竖成塔身，离地 12 格；动力沿塔身传到地面的切削发电机',
    height: 480,
    view: { rx: 70, rz: -30 },
    rotors: [{ x: 0, y: 12, z: 0, facing: 'south', power: 6 }],
    blocks: [
      ...run('minecraft:grass_block', [-3, 0, -1], [3, 0, -1], { decor: true, texture: 'block/grass_block_top' }),
      ...run('minecraft:grass_block', [-3, 0, 1], [3, 0, 1], { decor: true, texture: 'block/grass_block_top' }),
      ...run('minecraft:grass_block', [-3, 0, 0], [-1, 0, 0], { decor: true, texture: 'block/grass_block_top' }),
      ...run('minecraft:grass_block', [1, 0, 0], [3, 0, 0], { decor: true, texture: 'block/grass_block_top' }),
      { x: 0, y: 0, z: 0, id: 'minecraft:redstone_block', label: '红石块' },
      { x: 0, y: 1, z: 0, id: 'ME切削发电机', tag: '3', note: '从上方接收塔身传下来的动力' },
      ...run('机械传动器', [0, 2, 0], [0, 11, 0], { facing: 'up' }),
      { x: 0, y: 12, z: 0, id: 'ME风车', tag: '1', note: '扇叶朝南（面对放置者的一侧）' },
      { x: 1, y: 1, z: 0, id: 'ME线缆' },
      { x: 2, y: 1, z: 0, id: 'ME能源接收器' }
    ],
    notes: [
      { tag: '1', text: '<b>离地高度</b>按风车周围 5 格一圈的地面平均高度计算，塔身不算地面。离地 8 格起有动力（4），32 格以上 16。' },
      { tag: '2', text: '<b>扇叶</b>在机舱正前方一格，半径 3 格。这个圆面里有方块扇叶就停转；8 格内另有风车时互相挡风，动力减半。' },
      { tag: '3', text: '<b>塔身</b>：抬头放置的传动器轴朝上，一根接一根竖起来，把风车撑高的同时把动力传到地面。传动器不导通 AE，切削发电机旁边用线缆接网络。' }
    ]
  },

  'power-reactor': {
    title: '核反应堆：主机 + 仓室，拉杆控制启停，线缆接入网络',
    height: 380,
    blocks: [
      { x: 0, y: 0, z: 0, id: 'ME核反应堆', tag: '1', note: '右键打开元件格' },
      { x: 1, y: 0, z: 0, id: '反应堆仓室', tag: '2', note: '每个多解锁 1 列' },
      { x: -1, y: 0, z: 0, id: '反应堆仓室' },
      { x: 0, y: 0, z: -1, id: '反应堆仓室' },
      { x: 0, y: 1, z: 0, id: '反应堆仓室' },
      { x: 0, y: 0, z: 1, id: 'ME线缆', tag: '3' },
      ...run('ME线缆', [0, 0, 2], [0, 0, 4]),
      { x: 0, y: 0, z: 5, id: 'ME驱动器' },
      { x: 1, y: 0, z: 5, id: '致密能源元件' },
      { x: 2, y: 0, z: 0, id: 'minecraft:lever', label: '拉杆', texture: 'block/lever', facing: 'east', tag: '4', note: '拉下 = 运行，拉起 = 停机' }
    ],
    notes: [
      { tag: '1', text: '<b>ME核反应堆</b>：基础 3 列 × 6 行元件格，界面标题实时显示运行状态、堆温和发电量。' },
      { tag: '2', text: '<b>反应堆仓室</b>：贴在反应堆的任意一面（包括上下），每个多 1 列，最多 6 个（9 × 6）。图中 4 个仓室 = 7 列。' },
      { tag: '3', text: '反应堆和仓室都是 AE 方块，<b>任意一个贴着线缆或其他 AE 方块</b>就能接入网络，发出的电直接进网络。' },
      { tag: '4', text: '<b>红石开关</b>：给反应堆或任意一个仓室红石信号才会运行。<b>一定要留一个随手能关的开关</b>，堆温上涨时立刻断开。' }
    ]
  },
  'pipe-basic': {
    title: '最小链路：箱子 → 传出阀 → 管道 → 传入阀 → 箱子',
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST, tag: '1', note: '存放需要运走的物品' },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west', tag: '2', note: '对着左侧箱子右键放置' },
      { x: 2, y: 0, z: 0, id: PIPE },
      { x: 3, y: 0, z: 0, id: PIPE, tag: '3', note: '同一型号连接成一条线路' },
      { x: 4, y: 0, z: 0, id: PIPE },
      { x: 5, y: 0, z: 0, id: IN, axis: 'x', facing: 'east', tag: '4', note: '对着右侧箱子右键放置' },
      { x: 6, y: 0, z: 0, id: CHEST, tag: '5', note: '物品最终进入此处' }
    ],
    flows: [{ path: [[1, 0, 0], [5.6, 0, 0]], item: 'block/cobblestone', items: ['block/cobblestone', 'item/iron_ingot', 'item/coal'], speed: 1.8 }],
    notes: [
      { tag: '1', text: '<b>起点箱子</b>：放入需要运走的物品。' },
      { tag: '2', text: '<b>传出阀</b>：手持传出阀<b>对准起点箱子的侧面右键</b>放置。箭头即为阀门的朝向，阀门每 0.5 秒从该方向的箱子中抽取 1 个物品。' },
      { tag: '3', text: '<b>管道玻璃</b>：接在阀门另一侧，长度不限（普通管道单程最多 64 格）。' },
      { tag: '4', text: '<b>传入阀</b>：同样<b>对准终点箱子右键</b>放置，物品到达后会被送入箱子。' },
      { tag: '5', text: '<b>终点箱子</b>：箱子已满时，到达的物品会从传入阀处掉落，请预留空位。' }
    ]
  },

  'valve-right-wrong': {
    title: '阀门的正确与错误放置：外观几乎相同，区别在于放置时点击的方块',
    height: 360,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west', tag: '1', note: '对着箱子右键放置：正确' },
      ...run(PIPE, [2, 0, 0], [3, 0, 0]),
      { x: 0, y: 0, z: 2, id: CHEST },
      { x: 1, y: 0, z: 2, id: OUT, axis: 'x', facing: 'east', bad: true, tag: '2', note: '对着管道右键放置：阀门朝向管道，无法抽取物品' },
      ...run(PIPE, [2, 0, 2], [3, 0, 2]),
      { x: 0, y: 0, z: 4, id: CHEST },
      { x: 1, y: 0, z: 4, id: OUT, axis: 'y', facing: 'down', bad: true, tag: '3', note: '对着地面放置：阀门朝向脚下的方块' },
      ...run(PIPE, [2, 0, 4], [3, 0, 4])
    ],
    flows: [{ path: [[1, 0, 0], [3.4, 0, 0]], item: 'item/iron_ingot', speed: 1.5 }],
    notes: [
      { tag: '1', text: '正确：手持阀门，准星对准<b>箱子</b>的侧面右键。阀门朝向箱子，开始抽取。' },
      { tag: '2', bad: true, text: '错误：先铺好管道，再对着<b>管道</b>右键放置阀门。原木两端均有年轮，外观与正确放置完全相同，但阀门朝向管道一侧，永远不会抽取物品。<b>拆除后重新对着箱子放置</b>即可。' },
      { tag: '3', bad: true, text: '错误：对着<b>地面</b>放置，年轮朝上，阀门朝向脚下的方块。' }
    ]
  },

  'pipe-split': {
    title: '分流：6向分流器将物品依次送往每个出口',
    height: 360,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      { x: 2, y: 0, z: 0, id: PIPE },
      { x: 3, y: 0, z: 0, id: '6向分流器', tag: '1', note: '收到的物品依次发往每个接有管道的方向' },
      { x: 4, y: 0, z: 0, id: PIPE },
      { x: 5, y: 0, z: 0, id: IN, axis: 'x', facing: 'east' },
      { x: 6, y: 0, z: 0, id: CHEST, label: '箱子 A' },
      { x: 3, y: 0, z: 1, id: PIPE },
      { x: 3, y: 0, z: 2, id: IN, axis: 'z', facing: 'south' },
      { x: 3, y: 0, z: 3, id: CHEST, label: '箱子 B' },
      { x: 3, y: 0, z: -1, id: PIPE },
      { x: 3, y: 0, z: -2, id: IN, axis: 'z', facing: 'north' },
      { x: 3, y: 0, z: -3, id: CHEST, label: '箱子 C' }
    ],
    flows: [
      { path: [[1, 0, 0], [3, 0, 0], [5.6, 0, 0]], item: 'item/iron_ingot', count: 2, speed: 1.6 },
      { path: [[1, 0, 0], [3, 0, 0], [3, 0, 2.6]], item: 'item/gold_ingot', count: 2, speed: 1.6 },
      { path: [[1, 0, 0], [3, 0, 0], [3, 0, -2.6]], item: 'item/diamond', count: 2, speed: 1.6 }
    ],
    notes: [
      { tag: '1', text: '<b>6向分流器</b>：除来路外，物品会依次送往接有管道的各个面。更换为<b>均分分流器</b>时，一整组物品会被平均分配（64 个、3 个出口 → 22/21/21）；更换为<b>平衡分流器</b>时，会优先送往剩余空间最多的箱子。' }
    ]
  },

  'pipe-filter': {
    title: '分拣：过滤-放行器将圆石送入一个箱子，其他杂物转入另一个箱子',
    height: 360,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST, label: '混合物品箱' },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      { x: 2, y: 0, z: 0, id: PIPE },
      { x: 3, y: 0, z: 0, id: '过滤-放行器', tag: '1', note: '右键设置：放入一块圆石' },
      { x: 4, y: 0, z: 0, id: PIPE },
      { x: 5, y: 0, z: 0, id: IN, axis: 'x', facing: 'east' },
      { x: 6, y: 0, z: 0, id: CHEST, label: '圆石箱', tag: '2' },
      { x: 3, y: 0, z: 1, id: PIPE },
      { x: 3, y: 0, z: 2, id: IN, axis: 'z', facing: 'south' },
      { x: 3, y: 0, z: 3, id: CHEST, label: '杂物箱', tag: '3' }
    ],
    flows: [
      { path: [[1, 0, 0], [5.6, 0, 0]], item: 'block/cobblestone', count: 3, speed: 1.6 },
      { path: [[1, 0, 0], [3, 0, 0], [3, 0, 2.6]], item: 'item/iron_ingot', items: ['item/iron_ingot', 'item/bone', 'item/string'], count: 3, speed: 1.6 }
    ],
    notes: [
      { tag: '1', text: '<b>过滤-放行器</b>：右键打开 5 格设置界面，放入样品（不消耗）。<b>与样品相同的物品直行</b>，不同的物品转向两侧接有管道的方向。' },
      { tag: '2', text: '直行方向：仅接收圆石。' },
      { tag: '3', text: '侧面：其余所有物品。<b>过滤-调转器</b>的逻辑正好相反：相同的物品转向，不同的物品直行。' }
    ]
  },

  'crusher-auto': {
    title: '实例：为原石粉碎机接入自动进料与出料',
    height: 380,
    view: { rx: 55, rz: -25 },
    blocks: [
      { x: -5, y: 0, z: 0, id: CHEST, label: '圆石仓库', tag: '1' },
      { x: -4, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      { x: -3, y: 0, z: 0, id: PIPE },
      { x: -2, y: 0, z: 0, id: IN, axis: 'x', facing: 'east', tag: '2', note: '对着粉碎机的输入箱右键放置' },
      { x: -1, y: 0, z: 0, id: CHEST, label: '粉碎机输入箱' },
      { x: 0, y: 0, z: 0, id: '原石粉碎机核心', tag: '3' },
      { x: -1, y: 0, z: -1, id: 'minecraft:cobblestone' },
      { x: 1, y: 0, z: -1, id: 'minecraft:cobblestone' },
      { x: -1, y: 0, z: 1, id: 'minecraft:cobblestone' },
      { x: 1, y: 0, z: 1, id: 'minecraft:cobblestone' },
      { x: 1, y: 0, z: 0, id: BARREL, label: '粉碎机输出桶' },
      { x: 2, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west', tag: '4', note: '对着输出木桶右键放置' },
      { x: 3, y: 0, z: 0, id: PIPE },
      { x: 4, y: 0, z: 0, id: IN, axis: 'x', facing: 'east' },
      { x: 5, y: 0, z: 0, id: CHEST, label: '成品箱', tag: '5' }
    ],
    flows: [
      { path: [[-4, 0, 0], [-1.4, 0, 0]], item: 'block/cobblestone', count: 2, speed: 1.2 },
      { path: [[2, 0, 0], [4.6, 0, 0]], item: 'block/gravel', items: ['block/gravel', 'block/sand'], count: 2, speed: 1.2 }
    ],
    notes: [
      { tag: '1', text: '圆石仓库：刷石机或挖矿获得的圆石均存放于此。' },
      { tag: '2', text: '传入阀对准粉碎机<b>左侧的输入箱</b>，将圆石送入。' },
      { tag: '3', text: '粉碎机本体：四角为圆石，一侧为箱子，一侧为木桶，中间为核心（活塞）。每 3 秒将 1 个圆石转化为沙砾，或将 1 个沙砾转化为沙子。' },
      { tag: '4', text: '传出阀对准粉碎机<b>右侧的输出木桶</b>，将成品抽出。' },
      { tag: '5', text: '成品箱：沙砾与沙子最终进入此处。' }
    ]
  },

  'ender-link': {
    title: '末影发送口 / 接收口：无需管道，隔空传输至 50 格内的箱子',
    height: 330,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST, label: '矿场出货箱' },
      { x: 1, y: 0, z: 0, id: '末影发送口', tag: '1', note: '贴着箱子放置，右键设置频道名' },
      { x: 6, y: 0, z: 0, id: '末影接收口', tag: '2', note: '贴着箱子放置，设置相同的频道名' },
      { x: 7, y: 0, z: 0, id: CHEST, label: '仓库箱' }
    ],
    flows: [{ path: [[1, 0, 0], [1.6, 1.1, 0], [5.4, 1.1, 0], [6, 0, 0]], item: 'item/diamond', items: ['item/diamond', 'item/raw_iron', 'item/emerald'], speed: 3.2, count: 3 }],
    notes: [
      { tag: '1', text: '<b>末影发送口</b>：贴着一个箱子放置，右键 → 点击「进行命名」→ 在聊天框输入频道名（例如 <code>矿场</code>）。发送口每 0.5 秒从相邻箱子中取出 1 个物品。' },
      { tag: '2', text: '<b>末影接收口</b>：贴着目标箱子放置，设置<b>完全相同</b>的频道名。两端必须位于同一世界，直线距离在 50 格以内。' }
    ]
  },

  'filler-group': {
    title: '填充机群：一根管道装满一整排箱子，从最低处开始装填',
    height: 380,
    view: { rx: 62, rz: -40 },
    blocks: [
      { x: -4, y: 0, z: 0, id: CHEST, label: '输入箱' },
      { x: -3, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      ...run(PIPE, [-2, 0, 0], [-1, 0, 0]),
      { x: 0, y: 0, z: 0, id: '填充机核心', tag: '1', note: '管道直接连接核心，无需传入阀' },
      { x: 0, y: 1, z: 0, id: '填充机输出口', tag: '2' },
      { x: 0, y: 2, z: 0, id: '填充机输出口' },
      { x: 1, y: 0, z: 0, id: CHEST, tag: '3', note: '最先装满' },
      { x: 1, y: 1, z: 0, id: CHEST },
      { x: 1, y: 2, z: 0, id: CHEST, note: '最后装填' },
      { x: 0, y: 0, z: -1, id: CHEST },
      { x: 0, y: 1, z: -1, id: CHEST },
      { x: 0, y: 2, z: -1, id: CHEST }
    ],
    flows: [{ path: [[-3, 0, 0], [0, 0, 0], [0.8, 0, 0]], item: 'item/wheat', items: ['item/wheat', 'item/carrot', 'item/potato'], speed: 1.6 }],
    notes: [
      { tag: '1', text: '<b>填充机核心</b>：管道直接连接核心，核心会将物品送入「整个群」旁边的箱子。' },
      { tag: '2', text: '<b>填充机输出口</b>：与核心（或另一个输出口）相邻即属于同一个群，其旁边的箱子也会成为装填目标。一个群最多包含 16 个核心与输出口，超出后整个群失效。' },
      { tag: '3', text: '优先装填<b>高度最低</b>的未满箱子，装满后再向上装填。全部装满（或核心受红石充能）时，物品改走核心上其他相连的管道，若无其他管道则弹出至地面。' }
    ]
  },

  'redstone-stop': {
    title: '红石控制：充能的管道格会拦住物品',
    height: 300,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      ...run(PIPE, [2, 0, 0], [5, 0, 0]),
      { x: 4, y: 1, z: 0, id: 'minecraft:redstone_block', tag: '1', note: '为下方的管道格充能' },
      { x: 6, y: 0, z: 0, id: IN, axis: 'x', facing: 'east' },
      { x: 7, y: 0, z: 0, id: CHEST }
    ],
    flows: [{ path: [[1, 0, 0], [3.9, 0, 0]], item: 'item/iron_ingot', speed: 1.5, count: 2 }],
    notes: [
      { tag: '1', text: '受红石充能的管道格会将物品拦在其前方排队，断电后继续移动。队伍排至阀门处时，传出阀会暂停抽取，因此不会持续堵塞，也不会掉落物品。' }
    ]
  },

  // ---------------- 应用能源 ----------------
  'ae-first-network': {
    title: '第一个 ME 网络：能源接收器 + 线缆 + 驱动器 + 终端，旁边接一台压印器',
    height: 360,
    blocks: [
      { x: 0, y: 0, z: 0, id: 'ME能源接收器', tag: '1', note: '右键放入燃料，为整个网络供电' },
      { x: 0, y: 0, z: -1, id: '压印器', tag: '5', note: '与能源接收器相邻即接入网络' },
      { x: 1, y: 0, z: 0, id: 'ME线缆', tag: '2', note: '相邻的 AE 方块自动连成一个网络' },
      ...run('ME线缆', [2, 0, 0], [3, 0, 0]),
      { x: 4, y: 0, z: 0, id: 'ME驱动器', tag: '3', note: '放入 ME存储元件-1k' },
      { x: 4, y: 1, z: 0, id: 'ME终端', tag: '4', note: '右键打开，存取网络中的物品' }
    ],
    notes: [
      { tag: '1', text: '<b>ME能源接收器</b>：右键放入燃料（红石、煤炭、积聚的魔素等），燃料转化为 AE 能量供整个网络使用。' },
      { tag: '2', text: '<b>ME线缆</b>：成本最低的导体。所有 AE 方块<b>六面相邻即相连</b>，线缆仅用于拉开距离。' },
      { tag: '3', text: '<b>ME驱动器</b>：可放入 10 个存储元件，网络中的物品存放在元件中。' },
      { tag: '4', text: '<b>ME终端</b>：右键打开，查看并存取网络中的全部物品。放在驱动器上方同样属于相邻，即已接入网络。' },
      { tag: '5', text: '<b>压印器</b>：需要有电的网络才能工作，与能源接收器相邻即可。开荒阶段仅放置能源接收器与压印器，也可压制电路板。' }
    ]
  },

  'ae-pipe-bridge': {
    title: 'ME接口与管道对接：管道中的物品直接存入 ME 网络',
    height: 320,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST, label: '农场出货箱' },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west', tag: '1', note: '对着出货箱右键放置' },
      ...run(PIPE, [2, 0, 0], [3, 0, 0]),
      { x: 4, y: 0, z: 0, id: IN, axis: 'x', facing: 'east', tag: '2', note: '对着 ME接口右键放置' },
      { x: 5, y: 0, z: 0, id: 'ME接口', tag: '3', note: '网络与管道之间的桥梁' },
      { x: 6, y: 0, z: 0, id: 'ME线缆' },
      { x: 7, y: 0, z: 0, id: 'ME驱动器' },
      { x: 7, y: 0, z: 1, id: 'ME能源接收器' }
    ],
    flows: [{ path: [[1, 0, 0], [5, 0, 0]], item: 'item/wheat', items: ['item/wheat', 'item/carrot', 'item/potato'], speed: 2, count: 3 }],
    notes: [
      { tag: '1', text: '<b>传出阀</b>：按管道教程的方法，对着出货箱右键放置。' },
      { tag: '2', text: '<b>传入阀</b>：<b>对着 ME接口右键放置</b>，管道中的物品会直接存入网络，无需经过箱子。' },
      { tag: '3', text: '<b>ME接口</b>：反之，传出阀或单向运输器对准接口时，可取出接口中「备好的货」（右键接口设置备货）。' }
    ]
  },

  'ae-autocraft': {
    title: '自动合成：样板供应器 + 分子装配室 + 合成 CPU（形状不限）',
    height: 380,
    blocks: [
      { x: 0, y: 0, z: 0, id: 'ME控制器', tag: '1', note: '每个控制器方块 +32 台设备名额' },
      { x: 0, y: 0, z: 1, id: 'ME能源接收器' },
      ...run('ME线缆', [1, 0, 0], [5, 0, 0]),
      { x: 1, y: 1, z: 0, id: 'ME样板编码终端', tag: '2', note: '将配方写入空白样板' },
      { x: 2, y: 1, z: 0, id: 'ME终端', note: '对可合成物品 Shift+右键下单' },
      { x: 3, y: 0, z: -1, id: 'ME样板供应器', tag: '3', note: '放入已编码样板' },
      { x: 3, y: 0, z: -2, id: 'minecraft:furnace', tag: '4', note: '处理样板的目标机器，需贴着供应器' },
      { x: 5, y: 0, z: 1, id: '分子装配室', tag: '5', note: '接入网络即可，不必贴着供应器' },
      { x: 6, y: 0, z: 0, id: '合成单元', tag: '6', note: '合成 CPU 的基础构件' },
      { x: 7, y: 0, z: 0, id: '1k合成存储器', note: '一台 CPU 至少需要一个合成存储器' },
      { x: 7, y: 0, z: 1, id: '并行处理单元', note: '每个使 CPU 每轮多执行 2 步' },
      { x: 7, y: 1, z: 0, id: '合成单元', note: 'CPU 形状不限' }
    ],
    notes: [
      { tag: '1', text: '<b>ME控制器</b>：没有控制器时网络最多接入 8 台设备；设备较多的自动合成网络建议放置控制器。' },
      { tag: '2', text: '<b>ME样板编码终端</b>：在界面中写入合成样板（3×3 工作台配方）或处理样板（任意输入 → 输出）。' },
      { tag: '3', text: '<b>ME样板供应器</b>：放入已编码样板后，网络即可自动合成样板中的产物。' },
      { tag: '4', text: '<b>处理样板的目标机器</b>：供应器会将原料推入<b>贴着它</b>的容器或机器。熔炉、高炉、烟熏炉烧好的产物会被供应器自动收回。' },
      { tag: '5', text: '<b>分子装配室</b>：执行合成样板，接入网络即可，<b>不必贴着供应器</b>；放置多台可并行合成。' },
      { tag: '6', text: '<b>合成 CPU</b>：相连的合成单元、合成存储器与并行处理单元组成一台 CPU，<b>形状不限</b>，但至少需要一个合成存储器。' }
    ]
  }
}
