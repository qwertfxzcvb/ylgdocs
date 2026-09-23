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

export interface TutorialScene {
  title?: string
  height?: number
  view?: { rx: number; rz: number }
  blocks: SceneBlock[]
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
  'pipe-basic': {
    title: '最小链路：箱子 → 传出阀 → 管道 → 传入阀 → 箱子',
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST, tag: '1', note: '放要运走的东西' },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west', tag: '2', note: '对着左边箱子右键放上去' },
      { x: 2, y: 0, z: 0, id: PIPE },
      { x: 3, y: 0, z: 0, id: PIPE, tag: '3', note: '同一型号连成一条线' },
      { x: 4, y: 0, z: 0, id: PIPE },
      { x: 5, y: 0, z: 0, id: IN, axis: 'x', facing: 'east', tag: '4', note: '对着右边箱子右键放上去' },
      { x: 6, y: 0, z: 0, id: CHEST, tag: '5', note: '物品最终进到这里' }
    ],
    flows: [{ path: [[1, 0, 0], [5.6, 0, 0]], item: 'block/cobblestone', items: ['block/cobblestone', 'item/iron_ingot', 'item/coal'], speed: 1.8 }],
    notes: [
      { tag: '1', text: '<b>起点箱子</b>：把要运走的物品放进去。' },
      { tag: '2', text: '<b>传出阀</b>：手持它<b>对准起点箱子的侧面右键</b>放上去。箭头就是阀门认准的方向，它每 0.5 秒从这个方向的箱子里抽 1 个物品。' },
      { tag: '3', text: '<b>管道玻璃</b>：接在阀门另一侧，中间多长都行（普通管道单程最多 64 格）。' },
      { tag: '4', text: '<b>传入阀</b>：同样<b>对准终点箱子右键</b>放，物品到这里就会被塞进箱子。' },
      { tag: '5', text: '<b>终点箱子</b>：满了以后，到达的物品会从传入阀处掉在地上，记得留空位。' }
    ]
  },

  'valve-right-wrong': {
    title: '阀门放对与放错：外观几乎一样，区别在放置时点的是哪个方块',
    height: 360,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west', tag: '1', note: '对着箱子右键放的：正确' },
      ...run(PIPE, [2, 0, 0], [3, 0, 0]),
      { x: 0, y: 0, z: 2, id: CHEST },
      { x: 1, y: 0, z: 2, id: OUT, axis: 'x', facing: 'east', bad: true, tag: '2', note: '对着管道右键放的：阀门认准的是管道，抽不到东西' },
      ...run(PIPE, [2, 0, 2], [3, 0, 2]),
      { x: 0, y: 0, z: 4, id: CHEST },
      { x: 1, y: 0, z: 4, id: OUT, axis: 'y', facing: 'down', bad: true, tag: '3', note: '对着地面放的：认准的是脚下的方块' },
      ...run(PIPE, [2, 0, 4], [3, 0, 4])
    ],
    flows: [{ path: [[1, 0, 0], [3.4, 0, 0]], item: 'item/iron_ingot', speed: 1.5 }],
    notes: [
      { tag: '1', text: '正确：手持阀门，准星对着<b>箱子</b>的侧面右键。阀门认准箱子，开始抽取。' },
      { tag: '2', bad: true, text: '错误：先铺好管道，再对着<b>管道</b>右键放阀门。原木两头都有年轮，看起来和正确的一模一样，但阀门认准的是管道那一侧，永远不会抽东西。<b>拆下来重新对着箱子放</b>即可。' },
      { tag: '3', bad: true, text: '错误：对着<b>地面</b>放，年轮朝上，阀门认准的是脚下的方块。' }
    ]
  },

  'pipe-split': {
    title: '分流：6向分流器轮流把物品送往每个出口',
    height: 360,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      { x: 2, y: 0, z: 0, id: PIPE },
      { x: 3, y: 0, z: 0, id: '6向分流器', tag: '1', note: '收到的物品轮流发往每个连着管道的方向' },
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
      { tag: '1', text: '<b>6向分流器</b>：除了来路，哪几个面接了管道，就轮流往哪几个面送。换成<b>均分分流器</b>会把一整组平分（64 个、3 个出口 → 22/21/21）；换成<b>平衡分流器</b>会优先送往剩余空间最多的那个箱子。' }
    ]
  },

  'pipe-filter': {
    title: '分拣：过滤-放行器把圆石送进一个箱子，其他杂物拐进另一个',
    height: 360,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST, label: '混合物品箱' },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      { x: 2, y: 0, z: 0, id: PIPE },
      { x: 3, y: 0, z: 0, id: '过滤-放行器', tag: '1', note: '右键设置：放一块圆石进去' },
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
      { tag: '1', text: '<b>过滤-放行器</b>：右键打开 5 格设置界面，放入样品（不消耗）。<b>和样品一样的物品直走</b>，不一样的拐向两侧接了管道的方向。' },
      { tag: '2', text: '直走方向：只收到圆石。' },
      { tag: '3', text: '侧面：其余所有物品。<b>过滤-调转器</b>正好相反：一样的拐弯，不一样的直走。' }
    ]
  },

  'crusher-auto': {
    title: '实战：给原石粉碎机接上自动进料和出料',
    height: 380,
    view: { rx: 55, rz: -25 },
    blocks: [
      { x: -5, y: 0, z: 0, id: CHEST, label: '圆石仓库', tag: '1' },
      { x: -4, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      { x: -3, y: 0, z: 0, id: PIPE },
      { x: -2, y: 0, z: 0, id: IN, axis: 'x', facing: 'east', tag: '2', note: '对着粉碎机的输入箱右键放' },
      { x: -1, y: 0, z: 0, id: CHEST, label: '粉碎机输入箱' },
      { x: 0, y: 0, z: 0, id: '原石粉碎机核心', tag: '3' },
      { x: -1, y: 0, z: -1, id: 'minecraft:cobblestone' },
      { x: 1, y: 0, z: -1, id: 'minecraft:cobblestone' },
      { x: -1, y: 0, z: 1, id: 'minecraft:cobblestone' },
      { x: 1, y: 0, z: 1, id: 'minecraft:cobblestone' },
      { x: 1, y: 0, z: 0, id: BARREL, label: '粉碎机输出桶' },
      { x: 2, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west', tag: '4', note: '对着输出木桶右键放' },
      { x: 3, y: 0, z: 0, id: PIPE },
      { x: 4, y: 0, z: 0, id: IN, axis: 'x', facing: 'east' },
      { x: 5, y: 0, z: 0, id: CHEST, label: '成品箱', tag: '5' }
    ],
    flows: [
      { path: [[-4, 0, 0], [-1.4, 0, 0]], item: 'block/cobblestone', count: 2, speed: 1.2 },
      { path: [[2, 0, 0], [4.6, 0, 0]], item: 'block/gravel', items: ['block/gravel', 'block/sand'], count: 2, speed: 1.2 }
    ],
    notes: [
      { tag: '1', text: '圆石仓库：刷石机或挖矿收来的圆石都倒进这里。' },
      { tag: '2', text: '传入阀对准粉碎机<b>左侧的输入箱</b>，把圆石送进去。' },
      { tag: '3', text: '粉碎机本体：四角圆石、一侧箱子、一侧木桶，中间是核心（活塞）。每 3 秒把 1 个圆石变成沙砾，或把 1 个沙砾变成沙子。' },
      { tag: '4', text: '传出阀对准粉碎机<b>右侧的输出木桶</b>，把成品抽出来。' },
      { tag: '5', text: '成品箱：沙砾和沙子最后都到这里。' }
    ]
  },

  'ender-link': {
    title: '末影发送口 / 接收口：不用管道，隔空传送到 50 格内的箱子',
    height: 330,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST, label: '矿场出货箱' },
      { x: 1, y: 0, z: 0, id: '末影发送口', tag: '1', note: '贴着箱子放，右键命名频道' },
      { x: 6, y: 0, z: 0, id: '末影接收口', tag: '2', note: '贴着箱子放，起同一个频道名' },
      { x: 7, y: 0, z: 0, id: CHEST, label: '仓库箱' }
    ],
    flows: [{ path: [[1, 0, 0], [1.6, 1.1, 0], [5.4, 1.1, 0], [6, 0, 0]], item: 'item/diamond', items: ['item/diamond', 'item/raw_iron', 'item/emerald'], speed: 3.2, count: 3 }],
    notes: [
      { tag: '1', text: '<b>末影发送口</b>：挨着一个箱子放下，右键 → 点「进行命名」→ 在聊天框输入频道名（例如 <code>矿场</code>）。它每 0.5 秒从旁边的箱子里取 1 个物品。' },
      { tag: '2', text: '<b>末影接收口</b>：挨着目标箱子放，起<b>完全相同</b>的频道名。两端必须在同一个世界、直线距离 50 格以内。' }
    ]
  },

  'filler-group': {
    title: '填充机群：一根管道喂满一整排箱子，从最低的开始装',
    height: 380,
    view: { rx: 62, rz: -40 },
    blocks: [
      { x: -4, y: 0, z: 0, id: CHEST, label: '输入箱' },
      { x: -3, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      ...run(PIPE, [-2, 0, 0], [-1, 0, 0]),
      { x: 0, y: 0, z: 0, id: '填充机核心', tag: '1', note: '管道直接接在核心上，不需要传入阀' },
      { x: 0, y: 1, z: 0, id: '填充机输出口', tag: '2' },
      { x: 0, y: 2, z: 0, id: '填充机输出口' },
      { x: 1, y: 0, z: 0, id: CHEST, tag: '3', note: '最先被装满' },
      { x: 1, y: 1, z: 0, id: CHEST },
      { x: 1, y: 2, z: 0, id: CHEST, note: '最后才装' },
      { x: 0, y: 0, z: -1, id: CHEST },
      { x: 0, y: 1, z: -1, id: CHEST },
      { x: 0, y: 2, z: -1, id: CHEST }
    ],
    flows: [{ path: [[-3, 0, 0], [0, 0, 0], [0.8, 0, 0]], item: 'item/wheat', items: ['item/wheat', 'item/carrot', 'item/potato'], speed: 1.6 }],
    notes: [
      { tag: '1', text: '<b>填充机核心</b>：管道直接连到核心上。核心把物品塞进「整个群」旁边的箱子。' },
      { tag: '2', text: '<b>填充机输出口</b>：与核心（或另一个输出口）贴在一起就算同一个群，让它旁边的箱子也成为目标。一个群最多 16 个核心+输出口，超过就整群失效。' },
      { tag: '3', text: '先装<b>高度最低</b>的未满箱子，满了再往上装。全部装满（或核心通了红石）时，物品改走核心上其它接着的管道，没有就弹到地上。' }
    ]
  },

  'redstone-stop': {
    title: '红石控制：通电的那一格管道会把物品拦住',
    height: 300,
    blocks: [
      { x: 0, y: 0, z: 0, id: CHEST },
      { x: 1, y: 0, z: 0, id: OUT, axis: 'x', facing: 'west' },
      ...run(PIPE, [2, 0, 0], [5, 0, 0]),
      { x: 4, y: 1, z: 0, id: 'minecraft:redstone_block', tag: '1', note: '给下面这格管道通电' },
      { x: 6, y: 0, z: 0, id: IN, axis: 'x', facing: 'east' },
      { x: 7, y: 0, z: 0, id: CHEST }
    ],
    flows: [{ path: [[1, 0, 0], [3.9, 0, 0]], item: 'item/iron_ingot', speed: 1.5, count: 2 }],
    notes: [
      { tag: '1', text: '被红石充能的管道格会把物品拦在它前面排队，断电后继续前进。队伍一直排到阀门口时，传出阀会暂停抽取，所以不会越堵越多，也不会掉东西。' }
    ]
  }
}
