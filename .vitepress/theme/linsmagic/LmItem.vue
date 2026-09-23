<script setup lang="ts">
import { computed } from 'vue'
import { entryById, entryHref } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'

/**
 * 教程正文里的行内物品：图标 + 名称，点击进资料页，悬停出游戏内样式的提示框。
 * 用法：<LmItem id="传出阀" />、<LmItem id="minecraft:chest" n="2" />、<LmItem id="管道玻璃-A型" label="A 型管道" />
 */
const props = defineProps<{ id: string; n?: string | number; label?: string }>()
const entry = computed(() => entryById[props.id])
const name = computed(() => props.label ?? entry.value?.name ?? props.id.replace(/^minecraft:/, ''))
</script>

<template>
  <a class="lm-inline-item" :class="{ 'lm-inline-missing': !entry }" :href="entryHref(id)" :data-lm-item-id="entry ? id : undefined"><AtlasIcon :id="id" :size="22" /><span>{{ name }}</span><small v-if="n">×{{ n }}</small></a>
</template>
