<script setup lang="ts">
import { computed } from 'vue'
import { entryById, entryHref, recipes } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'
import AtlasRecipe from './AtlasRecipe.vue'
import AtlasCraftTree from './AtlasCraftTree.vue'

const props = defineProps<{ id: string }>()
const recipe = computed(() => recipes.find(value => value.id === props.id))
const ingredients = computed(() => {
  const values = recipe.value?.type === 'crafting' ? recipe.value.slots : recipe.value?.inputs
  const counts = new Map<string, number>()
  for (const ingredient of values ?? []) {
    if (ingredient) counts.set(ingredient.id, (counts.get(ingredient.id) ?? 0) + (ingredient.count ?? 1))
  }
  return [...counts].map(([id, count]) => ({ id, count, name: entryById[id]?.name ?? id }))
})
</script>

<template>
  <div v-if="recipe" class="lm-recipe-page">
    <p class="lm-intro">使用 {{ recipe.station }}。点击任意材料或产物，可打开独立资料页并继续查找相关配方。</p>
    <AtlasRecipe :id="recipe.id" />
    <AtlasCraftTree v-if="recipe.result[0]" :id="recipe.result[0].id" :recipe-id="recipe.id" />
    <h2>所需材料</h2>
    <div class="lm-link-list"><a v-for="item in ingredients" :key="item.id" :href="entryHref(item.id)">
      <AtlasIcon :id="item.id" :size="40" /><span><strong>{{ item.name }} ×{{ item.count }}</strong><small>查看获取方法和其他用途</small></span><span aria-hidden="true">↗</span>
    </a></div>
    <h2>产物</h2>
    <div class="lm-link-list"><a v-for="item in recipe.result" :key="item.id" :href="entryHref(item.id)">
      <AtlasIcon :id="item.id" :size="40" /><span><strong>{{ entryById[item.id]?.name ?? item.id }} ×{{ item.count ?? 1 }}</strong><small>查看完整资料</small></span><span aria-hidden="true">↗</span>
    </a></div>
    <p v-if="recipe.guiOnly" class="lm-footnote">此配方使用插件自定义合成界面；游戏内打开方式以工作站说明为准。</p>
  </div>
</template>
