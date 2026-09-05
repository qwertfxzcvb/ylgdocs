<script setup>
import { useData } from 'vitepress'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

const { theme } = useData()

const activity = computed(() => theme.value.commitActivity || {})

const WEEKDAY_LABELS = ['', '一', '', '三', '', '五', '']
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// 格子目标宽度（含间距），用于按容器宽度决定显示多少周
const TARGET_CELL = 17
const MAX_WEEKS = 53
const MIN_WEEKS = 14

const cardRef = ref(null)
const gridRef = ref(null)
const weekCount = ref(MAX_WEEKS)

function updateWeekCount() {
  const el = gridRef.value
  if (!el) return
  const width = el.clientWidth
  if (!width) return
  const n = Math.floor(width / TARGET_CELL)
  weekCount.value = Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, n))
}

let observer = null

onMounted(() => {
  updateWeekCount()
  if (typeof ResizeObserver !== 'undefined' && gridRef.value) {
    observer = new ResizeObserver(updateWeekCount)
    observer.observe(gridRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

function toDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function today() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// 构建最近 weekCount 周（含本周）的日期矩阵，列 = 周，行 = 星期日~星期六
const weeks = computed(() => {
  const end = today()
  // 对齐到本周的周六，保证最后一列完整
  const endAligned = new Date(end)
  endAligned.setDate(end.getDate() + (6 - end.getDay()))

  const totalDays = weekCount.value * 7
  const start = new Date(endAligned)
  start.setDate(endAligned.getDate() - totalDays + 1)

  const cols = []
  const cursor = new Date(start)
  for (let w = 0; w < weekCount.value; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const dateKey = toDateKey(cursor)
      const isFuture = cursor > end
      col.push({
        date: new Date(cursor),
        key: dateKey,
        count: isFuture ? -1 : activity.value[dateKey] || 0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    cols.push(col)
  }
  return cols
})

// 每列第一天所在月份变化时，标注月份（按百分比定位，跟随格子宽度自适应）
const monthMarkers = computed(() => {
  const markers = []
  let lastMonth = -1
  let lastIndex = -99
  weeks.value.forEach((col, i) => {
    // 以该列包含日期最多的月份为准（列跨月时取后一个月的起始列）
    const month = col[0].date.getMonth()
    // 与上一个标记至少间隔 2 列，避免文字重叠
    if (month !== lastMonth && i - lastIndex >= 2) {
      markers.push({ index: i, label: MONTH_LABELS[month], left: (i / weeks.value.length) * 100 })
      lastIndex = i
    }
    lastMonth = month
  })
  return markers
})

const maxCount = computed(() => {
  let max = 0
  for (const col of weeks.value) {
    for (const cell of col) {
      if (cell.count > max) max = cell.count
    }
  }
  return max
})

function levelOf(count) {
  if (count < 0) return -1
  if (count === 0) return 0
  const max = maxCount.value || 1
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

const totalCount = computed(() => {
  let sum = 0
  for (const col of weeks.value) {
    for (const cell of col) {
      if (cell.count > 0) sum += cell.count
    }
  }
  return sum
})

// 悬浮提示：只显示日期，当天有提交时补上次数
const tip = ref(null)
const tipRef = ref(null)

function tipText(cell) {
  const d = cell.date
  const date = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  return cell.count > 0 ? `${date} · ${cell.count} 次更新` : date
}

function showTip(cell, event) {
  if (cell.count < 0) return
  const card = cardRef.value
  if (!card) return
  const cardBox = card.getBoundingClientRect()
  const cellBox = event.currentTarget.getBoundingClientRect()
  // 格子中心相对卡片的位置，箭头始终对准这里
  const anchorX = cellBox.left - cardBox.left + cellBox.width / 2

  tip.value = {
    text: tipText(cell),
    x: anchorX,
    y: cellBox.top - cardBox.top,
    arrow: 0,
    ready: false,
  }

  // 渲染后按实际宽度纠正位置，贴边时平移气泡并让箭头补偿回来
  nextTick(() => {
    if (!tip.value || !tipRef.value) return
    const half = tipRef.value.offsetWidth / 2
    const min = half + 2
    const max = cardBox.width - half - 2
    const x = max < min ? cardBox.width / 2 : Math.min(Math.max(anchorX, min), max)
    const arrowLimit = Math.max(half - 10, 0)
    tip.value = {
      ...tip.value,
      x,
      arrow: Math.min(Math.max(anchorX - x, -arrowLimit), arrowLimit),
      ready: true,
    }
  })
}

function hideTip() {
  tip.value = null
}
</script>

<template>
  <div class="heatmap-card" ref="cardRef">
    <div class="heatmap-header">
      <span class="heatmap-icon">📅</span>
      <span class="heatmap-title">文档更新</span>
      <span class="heatmap-total">最近 {{ weekCount }} 周共 {{ totalCount }} 次更新</span>
    </div>

    <div class="heatmap-body">
      <div class="weekday-labels">
        <span v-for="(label, i) in WEEKDAY_LABELS" :key="i">{{ label }}</span>
      </div>

      <div class="heatmap-main">
        <div class="month-labels">
          <span
            v-for="marker in monthMarkers"
            :key="marker.index"
            class="month-label"
            :style="{ left: marker.left + '%' }"
          >
            {{ marker.label }}
          </span>
        </div>

        <div class="weeks-grid" ref="gridRef">
          <div class="week-col" v-for="(col, i) in weeks" :key="i">
            <div
              v-for="cell in col"
              :key="cell.key"
              class="day-cell"
              :class="[`level-${levelOf(cell.count)}`]"
              @mouseenter="showTip(cell, $event)"
              @mouseleave="hideTip"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="heatmap-legend">
      <span>少</span>
      <span class="legend-cell level-0" />
      <span class="legend-cell level-1" />
      <span class="legend-cell level-2" />
      <span class="legend-cell level-3" />
      <span class="legend-cell level-4" />
      <span>多</span>
    </div>

    <div
      v-if="tip"
      ref="tipRef"
      class="heatmap-tip"
      :style="{
        left: tip.x + 'px',
        top: tip.y + 'px',
        '--arrow-x': tip.arrow + 'px',
        visibility: tip.ready ? 'visible' : 'hidden',
      }"
    >
      {{ tip.text }}
    </div>
  </div>
</template>

<style scoped>
.heatmap-card {
  position: relative;
  margin: 1.2rem 0 1.8rem;
  padding: 18px 22px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  animation: fadeSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.dark .heatmap-card {
  background: rgba(40, 40, 40, 0.5);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.heatmap-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.heatmap-icon {
  font-size: 1.05rem;
}

.heatmap-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.heatmap-total {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

/* 整体自适应容器宽度，不出现横向滚动 */
.heatmap-body {
  display: flex;
  align-items: stretch;
  gap: 8px;
  width: 100%;
}

.weekday-labels {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 18px;
  flex: 0 0 auto;
}

/* 每个标签与一行格子等高，随格子尺寸自适应 */
.weekday-labels span {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  font-size: 10px;
  line-height: 1;
  color: var(--vp-c-text-3);
}

.heatmap-main {
  position: relative;
  padding-top: 18px;
  flex: 1 1 auto;
  min-width: 0;
}

.month-labels {
  position: absolute;
  top: 0;
  left: 0;
  height: 16px;
  width: 100%;
}

.month-label {
  position: absolute;
  font-size: 10px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.weeks-grid {
  display: flex;
  gap: 4px;
  width: 100%;
}

/* 列宽平分容器，格子随之变大 */
.week-col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-cell {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease;
}

.day-cell:hover {
  transform: scale(1.2);
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
}

.dark .day-cell,
.dark .legend-cell {
  background: rgba(255, 255, 255, 0.06);
}

.level-0 {
  background: rgba(0, 0, 0, 0.06);
}

.level-1 {
  background: rgba(66, 133, 244, 0.3);
}

.level-2 {
  background: rgba(66, 133, 244, 0.55);
}

.level-3 {
  background: rgba(66, 133, 244, 0.78);
}

.level-4 {
  background: linear-gradient(135deg, #4285f4, #9c27b0);
}

.dark .level-0 {
  background: rgba(255, 255, 255, 0.06);
}

/* 悬浮提示 */
.heatmap-tip {
  position: absolute;
  transform: translate(-50%, -100%);
  margin-top: -8px;
  padding: 5px 10px;
  border-radius: 7px;
  background: rgba(28, 28, 30, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  animation: tipIn 0.15s ease both;
}

.heatmap-tip::after {
  content: '';
  position: absolute;
  left: calc(50% + var(--arrow-x, 0px));
  bottom: -4px;
  width: 8px;
  height: 8px;
  transform: translateX(-50%) rotate(45deg);
  background: rgba(28, 28, 30, 0.92);
  border-radius: 1px;
}

.dark .heatmap-tip,
.dark .heatmap-tip::after {
  background: rgba(58, 58, 62, 0.95);
}

@keyframes tipIn {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-100% + 4px));
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 12px;
  font-size: 10px;
  color: var(--vp-c-text-3);
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .heatmap-card {
    padding: 14px 16px;
  }
  .heatmap-total {
    margin-left: 0;
    width: 100%;
  }
}
</style>
