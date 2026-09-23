<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { entryById, textureCandidates } from './atlasData'

const props = withDefaults(defineProps<{ id?: string; texture?: string; size?: number }>(), { id: '', size: 44 })
const entry = computed(() => entryById[props.id])
const candidates = computed(() => textureCandidates(props.texture ?? entry.value?.icon ?? 'item/book'))
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
    <span v-else aria-hidden="true">?</span>
  </span>
</template>
