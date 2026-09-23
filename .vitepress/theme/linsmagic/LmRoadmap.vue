<script setup lang="ts">
import AtlasIcon from './AtlasIcon.vue'

/**
 * 教程顶部的路线图卡片。
 * 用法：<LmRoadmap :steps="[{ href: '#s1', title: '领书', detail: '…', icon: '芸集知识之书' }]" />
 * icon 可以是百科物品 id，也可以是 'item/xxx' 这类贴图路径。
 */
defineProps<{ steps: Array<{ href: string; title: string; detail?: string; icon?: string; stage?: string }> }>()
</script>

<template>
  <nav class="lm-roadmap" aria-label="路线图">
    <a v-for="(step, index) in steps" :key="step.href" :href="step.href">
      <AtlasIcon v-if="step.icon" :id="step.icon.includes('/') ? '' : step.icon" :texture="step.icon.includes('/') ? step.icon : undefined" :size="30" />
      <em>{{ step.stage ?? `第 ${index + 1} 步` }}</em>
      <strong>{{ step.title }}</strong>
      <small v-if="step.detail">{{ step.detail }}</small>
    </a>
  </nav>
</template>
