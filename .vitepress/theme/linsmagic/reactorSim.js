// 核反应堆模拟：与插件 ae/machine/NuclearReactor.java 的每秒结算逐行对应。
// 改插件规则时这里要同步修改，否则文档里的摆法数值会和游戏对不上。
//
// 摆法用 6 行字符串描述，每行最多 9 个字符：
//   .  空    1 铀燃料棒   2 双联铀燃料棒   4 四联铀燃料棒
//   V  散热片   R 反应堆散热片   E 热交换器   C 冷却单元   F 中子反射板

export const PART_IDS = {
  '1': '铀燃料棒', '2': '双联铀燃料棒', '4': '四联铀燃料棒',
  V: '散热片', R: '反应堆散热片', E: '热交换器', C: '冷却单元', F: '中子反射板'
}
const CELLS = { '1': 1, '2': 2, '4': 4 }
const CAPACITY = { '1': 20000, '2': 20000, '4': 20000, V: 1000, R: 1000, E: 2500, C: 10000, F: 30000 }
const STORES_HEAT = new Set(['V', 'R', 'E', 'C'])
export const HULL_MAX = 10000
const COLS = 9, ROWS = 6

/** 摆法字符串 → 54 格（行 × 9 + 列） */
export function parseLayout(rows) {
  const slots = new Array(COLS * ROWS).fill(null)
  rows.forEach((row, r) => {
    for (let c = 0; c < Math.min(COLS, row.length); c++) {
      const ch = row[c]
      if (PART_IDS[ch]) slots[r * COLS + c] = { kind: ch, used: 0 }
    }
  })
  return slots
}

function neighbors(i, cols) {
  const row = Math.floor(i / COLS), col = i % COLS, out = []
  if (col > 0) out.push(i - 1)
  if (col + 1 < cols) out.push(i + 1)
  if (row > 0) out.push(i - COLS)
  if (row + 1 < ROWS) out.push(i + COLS)
  return out
}

/**
 * 模拟运行。返回：每秒发电（第 1 秒）、稳定运行时的堆温、熔毁时间（秒，没熔毁为 null）、
 * 第一次有元件烧毁 / 耗尽的时间，以及模拟结束时堆温。
 */
export function simulate(rows, cols, seconds = 3600) {
  const s = parseLayout(rows)
  const st = { hull: 0 }
  let firstOutput = null, meltdownAt = null, firstBurnAt = null, lastOutput = 0
  const active = i => i % COLS < cols
  const cap = it => CAPACITY[it.kind]

  function addHeat(idx, heat, t) {
    const it = s[idx]
    if (!it || heat <= 0) return
    const now = it.used + heat
    if (now >= cap(it)) {
      s[idx] = null
      st.hull += now - cap(it)
      if (firstBurnAt === null) firstBurnAt = t
    } else it.used = now
  }
  function setUsed(it, v) { it.used = Math.max(0, v) }
  function balance(a, b, limit, t) {
    const x = s[a], y = s[b]
    if (!x || !y) return
    const hx = x.used, hy = y.used, cx = cap(x), cy = cap(y)
    const targetX = Math.round((hx + hy) * cx / (cx + cy))
    const move = Math.max(-limit, Math.min(limit, hx - targetX))
    if (move > 0) { setUsed(x, hx - move); addHeat(b, move, t) }
    else if (move < 0) { setUsed(y, hy + move); addHeat(a, -move, t) }
  }
  function balanceHull(a, limit, t) {
    const x = s[a]
    if (!x) return
    const px = x.used / cap(x), ph = st.hull / HULL_MAX
    if (px > ph) {
      const move = Math.min(limit, Math.round((px - ph) * cap(x) / 2))
      setUsed(x, x.used - move); st.hull += move
    } else if (ph > px) {
      const move = Math.min(limit, Math.min(st.hull, Math.round((ph - px) * cap(x) / 2)))
      st.hull -= move; addHeat(a, move, t)
    }
  }

  for (let t = 1; t <= seconds; t++) {
    let energy = 0
    // 1) 燃料棒
    for (let i = 0; i < s.length; i++) {
      if (!active(i) || !s[i] || !CELLS[s[i].kind]) continue
      const cells = CELLS[s[i].kind]
      let pulse = 1 + Math.floor(cells / 2)
      const acceptors = []
      for (const n of neighbors(i, cols)) {
        const q = s[n]
        if (!q) continue
        if (CELLS[q.kind]) pulse++
        else if (q.kind === 'F') {
          pulse++
          setUsed(q, q.used + cells)
          if (q.used >= cap(q)) { s[n] = null; if (firstBurnAt === null) firstBurnAt = t }
        }
        if (STORES_HEAT.has(q.kind)) acceptors.push(n)
      }
      energy += cells * pulse * 50
      const heat = cells * 2 * pulse * (pulse + 1)
      if (!acceptors.length) st.hull += heat
      else {
        const share = Math.floor(heat / acceptors.length), rem = heat % acceptors.length
        acceptors.forEach((n, k) => addHeat(n, share + (k < rem ? 1 : 0), t))
      }
      setUsed(s[i], s[i].used + 1)
      if (s[i].used >= cap(s[i])) s[i] = null
    }
    // 2) 热交换器
    for (let i = 0; i < s.length; i++) {
      if (!active(i) || !s[i] || s[i].kind !== 'E') continue
      for (const n of neighbors(i, cols)) {
        if (!s[n] || !s[i]) continue
        if (!STORES_HEAT.has(s[n].kind)) continue
        balance(i, n, 12, t)
      }
      if (s[i]) balanceHull(i, 4, t)
    }
    // 3) 散热
    for (let i = 0; i < s.length; i++) {
      if (!active(i) || !s[i]) continue
      if (s[i].kind === 'R') {
        const take = Math.min(5, st.hull)
        st.hull -= take
        addHeat(i, Math.round(take), t)
        if (s[i]) setUsed(s[i], s[i].used - 5)
      } else if (s[i].kind === 'V') {
        setUsed(s[i], s[i].used - 6)
      }
    }
    st.hull = Math.max(0, st.hull)
    if (firstOutput === null) firstOutput = energy
    lastOutput = energy
    if (st.hull >= HULL_MAX) { meltdownAt = t; break }
  }
  return { output: firstOutput ?? 0, lastOutput, hull: st.hull, hullPercent: st.hull / HULL_MAX, meltdownAt, firstBurnAt }
}
