<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { entries, entryById, type AtlasEntry } from './atlasData'

const hovered = ref<AtlasEntry | null>(null)
const position = ref({ left: 0, top: 0 })
const byPath = new Map(entries.map(entry => [entry.href.replace(/\/$/, ''), entry]))
const lines = computed(() => hovered.value?.details.filter(line => line !== hovered.value?.description) ?? [])

function targetEntry(target: EventTarget | null): AtlasEntry | null {
  if (!(target instanceof Element) || !location.pathname.startsWith('/linsmagic')) return null
  const marker = target.closest<HTMLElement>('[data-lm-item-id]')
  const id = marker?.dataset.lmItemId
  if (id && entryById[id]) return entryById[id]
  const link = target.closest<HTMLAnchorElement>('a[href]')
  if (!link) return null
  try {
    const url = new URL(link.href)
    if (url.origin !== location.origin) return null
    return byPath.get(url.pathname.replace(/\.html$/, '').replace(/\/$/, '')) ?? null
  } catch { return null }
}
function move(x: number, y: number) {
  const width = 340
  const height = Math.min(520, 95 + (hovered.value?.description ? 42 : 0) + lines.value.length * 34)
  position.value = {
    left: Math.max(8, Math.min(x + 18, window.innerWidth - width - 8)),
    top: Math.max(8, Math.min(y + 20, window.innerHeight - height - 8))
  }
}
function onPointer(event: PointerEvent) {
  const entry = targetEntry(event.target)
  hovered.value = entry && entry.kind !== 'event' && entry.kind !== 'boss' ? entry : null
  if (hovered.value) move(event.clientX, event.clientY)
}
function onFocus(event: FocusEvent) {
  const entry = targetEntry(event.target)
  hovered.value = entry && entry.kind !== 'event' && entry.kind !== 'boss' ? entry : null
  if (hovered.value && event.target instanceof Element) {
    const rect = event.target.getBoundingClientRect()
    move(rect.left + rect.width / 2, rect.bottom)
  }
}
function hide() { hovered.value = null }
onMounted(() => {
  document.addEventListener('pointerover', onPointer, true)
  document.addEventListener('pointermove', onPointer, true)
  document.addEventListener('pointerout', hide, true)
  document.addEventListener('focusin', onFocus, true)
  document.addEventListener('focusout', hide, true)
  window.addEventListener('scroll', hide, true)
})
onUnmounted(() => {
  document.removeEventListener('pointerover', onPointer, true)
  document.removeEventListener('pointermove', onPointer, true)
  document.removeEventListener('pointerout', hide, true)
  document.removeEventListener('focusin', onFocus, true)
  document.removeEventListener('focusout', hide, true)
  window.removeEventListener('scroll', hide, true)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="hovered" class="lm-mc-tooltip" :style="{ left: `${position.left}px`, top: `${position.top}px` }" role="tooltip">
      <div class="lm-mc-tooltip-inner">
        <strong :class="{ 'lm-tip-glint': hovered.glint, 'lm-tip-enchant': hovered.kind === 'enchant' }">{{ hovered.name }}</strong>
        <p v-if="hovered.description && hovered.kind !== 'vanilla'">{{ hovered.description }}</p>
        <div v-if="lines.length" class="lm-tip-lines">
          <p v-for="(line, index) in lines" :key="index" :class="{ 'lm-tip-property': /^(适用|最高等级|稀有度|属性|效果)/.test(line) }">{{ line }}</p>
        </div>
        <div v-if="hovered.enchantments?.length" class="lm-tip-enchantments">
          <p v-for="line in hovered.enchantments" :key="line">{{ line }}</p>
        </div>
        <em>{{ hovered.kind === 'vanilla' ? 'Minecraft' : 'LinsMagic' }}</em>
      </div>
    </div>
  </Teleport>
</template>
