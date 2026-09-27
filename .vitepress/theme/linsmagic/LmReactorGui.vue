<script setup lang="ts">
import { computed } from 'vue'
import { entryHref } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'
import { PART_IDS, simulate } from './reactorSim.js'

/**
 * 核反应堆界面示意：按游戏里的箱子界面画 9×6 元件格，标题和游戏里一样显示运行状态 / 堆温 / 发电。
 * 数值不是手写的：用 reactorSim.js（与插件 NuclearReactor.java 同一套规则）模拟一整根燃料棒的寿命算出来。
 *
 * 用法：<LmReactorGui :cols="3" :layout="['.V.', 'V2V', '.V.', '.V.', 'V2V', '.V.']" title="示例 1" />
 */
const props = withDefaults(defineProps<{ layout: string[]; cols?: number; title?: string }>(), { cols: 3 })

const COLS = 9, ROWS = 6
const result = computed(() => simulate(props.layout, props.cols, 20000))
const slots = computed(() => {
  const out: Array<{ key: number; id: string | null; locked: boolean }> = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = props.layout[r]?.[c]
      out.push({ key: r * COLS + c, id: ch && (PART_IDS as Record<string, string>)[ch] ? (PART_IDS as Record<string, string>)[ch] : null, locked: c >= props.cols })
    }
  }
  return out
})
const counts = computed(() => {
  const map = new Map<string, number>()
  for (const s of slots.value) if (s.id && !s.locked) map.set(s.id, (map.get(s.id) ?? 0) + 1)
  return [...map.entries()]
})
/** 游戏里的界面标题（稳定运行时堆温 0%） */
const guiTitle = computed(() => {
  const r = result.value
  const pct = r.meltdownAt !== null ? 100 : Math.round(r.hullPercent * 100)
  return `核反应堆 运行 · 堆温 ${pct}% · ${Math.round(r.output)} AE/秒`
})
function duration(sec: number) {
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)} 小时`
  if (sec >= 60) return `${Math.floor(sec / 60)} 分 ${sec % 60} 秒`
  return `${sec} 秒`
}
const verdict = computed(() => {
  const r = result.value
  if (r.meltdownAt !== null) return { bad: true, text: `约 ${duration(r.meltdownAt)} 后堆芯熔毁` }
  if (r.firstBurnAt !== null) return { bad: true, text: `约 ${duration(r.firstBurnAt)} 后有元件烧毁` }
  return { bad: false, text: '堆温稳定，可以一直运行到燃料耗尽（约 5.5 小时）' }
})
</script>

<template>
  <figure class="lm-rgui">
    <figcaption v-if="title" class="lm-rgui-caption">{{ title }}</figcaption>
    <div class="lm-rgui-window">
      <div class="lm-rgui-title">{{ guiTitle }}</div>
      <div class="lm-rgui-grid">
        <template v-for="s in slots" :key="s.key">
          <a v-if="s.id" class="lm-rgui-slot" :class="{ 'lm-rgui-locked': s.locked }" :href="entryHref(s.id)" :data-lm-item-id="s.id">
            <AtlasIcon :id="s.id" :size="30" />
          </a>
          <span v-else-if="s.locked" class="lm-rgui-slot lm-rgui-locked" title="未解锁：再贴一个反应堆仓室">
            <AtlasIcon texture="item/gray_stained_glass_pane" :size="30" />
          </span>
          <span v-else class="lm-rgui-slot"></span>
        </template>
      </div>
    </div>
    <div class="lm-rgui-stats">
      <span class="lm-rgui-chip">{{ cols }} 列（{{ cols - 3 }} 个仓室）</span>
      <span class="lm-rgui-chip lm-rgui-power">发电 {{ Math.round(result.output) }} AE/秒</span>
      <span class="lm-rgui-chip" :class="verdict.bad ? 'lm-rgui-bad' : 'lm-rgui-ok'">{{ verdict.text }}</span>
    </div>
    <div class="lm-rgui-counts">
      <a v-for="[id, n] in counts" :key="id" :href="entryHref(id)" :data-lm-item-id="id">
        <AtlasIcon :id="id" :size="22" /><span>{{ id }}</span><strong>×{{ n }}</strong>
      </a>
    </div>
  </figure>
</template>

<style scoped>
.lm-rgui{margin:18px 0;padding:0}
.lm-rgui-caption{font-weight:600;font-size:14px;margin-bottom:8px;color:var(--vp-c-text-1)}
/* 仿 Minecraft 箱子界面：浅灰底 + 凸起描边，格子凹陷 */
.lm-rgui-window{display:inline-block;background:#c6c6c6;padding:8px 10px 10px;border-radius:4px;
  box-shadow:inset 3px 3px 0 #fff,inset -3px -3px 0 #555,0 0 0 2px #000;max-width:100%;overflow-x:auto}
.lm-rgui-title{font-size:13px;color:#404040;margin:0 0 6px 2px;white-space:nowrap}
.lm-rgui-grid{display:grid;grid-template-columns:repeat(9,36px);grid-auto-rows:36px}
.lm-rgui-slot{display:grid;place-items:center;background:#8b8b8b;box-shadow:inset 2px 2px 0 #373737,inset -2px -2px 0 #fff;text-decoration:none}
a.lm-rgui-slot:hover{background:#a6a6a6}
.lm-rgui-locked{opacity:.9}
.lm-rgui-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.lm-rgui-chip{font-size:13px;padding:3px 10px;border-radius:999px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft)}
.lm-rgui-power{border-color:var(--vp-c-brand-1);color:var(--vp-c-brand-1);font-weight:600}
.lm-rgui-ok{border-color:#3fa66b;color:#2e8b57}
.lm-rgui-bad{border-color:#e5484d;color:#e5484d;font-weight:600}
.lm-rgui-counts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.lm-rgui-counts a{display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:2px 8px 2px 4px;border:1px solid var(--vp-c-divider);border-radius:8px;text-decoration:none;color:var(--vp-c-text-2)}
.lm-rgui-counts strong{color:var(--vp-c-brand-1);font-weight:600}
</style>
