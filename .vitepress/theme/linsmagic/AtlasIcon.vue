<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { entryById, textureCandidates } from './atlasData'

const props = withDefaults(defineProps<{ id?: string; texture?: string; size?: number }>(), { id: '', size: 44 })
const entry = computed(() => entryById[props.id])
const texture = computed(() => props.texture ?? entry.value?.icon ?? 'item/book')
const candidates = computed(() => textureCandidates(texture.value))
const leatherOverlays: Record<string, string> = {
  'item/leather_helmet': 'item/leather_helmet_overlay',
  'item/leather_chestplate': 'item/leather_chestplate_overlay',
  'item/leather_leggings': 'item/leather_leggings_overlay',
  'item/leather_boots': 'item/leather_boots_overlay',
  'item/leather_horse_armor': 'item/leather_horse_armor'
}
const leatherOverlay = computed(() => {
  const overlay = leatherOverlays[texture.value]
  return overlay && overlay !== texture.value ? textureCandidates(overlay)[0] : null
})
const leatherTinted = computed(() => texture.value in leatherOverlays)
const attempt = ref(0)
const animated = ref(false)
watch([() => props.id, () => props.texture], () => { attempt.value = 0; animated.value = false })
function nextTexture() { if (attempt.value < candidates.value.length - 1) { attempt.value++; animated.value = false } }
function onTextureLoad(event: Event) {
  const image = event.target as HTMLImageElement
  animated.value = image.naturalHeight > image.naturalWidth && image.naturalHeight % image.naturalWidth === 0
}
</script>

<template>
  <span class="lm-icon" :data-lm-item-id="entry ? id : undefined" :class="{ 'lm-icon-glint': entry?.glint, 'lm-icon-glass': id === 'minecraft:glass_pane' || texture === 'item/glass_pane' }" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="entry || texture" :class="{ 'lm-icon-animated': animated }" :src="candidates[attempt]" :alt="entry?.name ?? ''" @error="nextTexture" @load="onTextureLoad" />
    <span v-if="leatherTinted" class="lm-icon-leather-tint" :style="{ '--lm-leather-mask': `url(${candidates[attempt]})` }" aria-hidden="true" />
    <img v-if="leatherOverlay" class="lm-icon-leather-overlay" :src="leatherOverlay" alt="" aria-hidden="true" />
    <span v-else aria-hidden="true">?</span>
  </span>
</template>
