<script setup lang="ts">
import { computed } from 'vue'
import { entryById, entryHref, type AtlasRecipe } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'

export interface CraftNode {
  key: string
  id: string
  count: number
  recipe?: AtlasRecipe
  batches?: number
  options: AtlasRecipe[]
  children: CraftNode[]
  stopped?: boolean
}

const props = defineProps<{ node: CraftNode; selected: Record<string, string>; collapsed: Record<string, boolean> }>()
const emit = defineEmits<{ choose: [key: string, recipeId: string]; toggle: [key: string] }>()
const itemName = computed(() => entryById[props.node.id]?.name ?? props.node.id.replace(/^minecraft:/, ''))
</script>

<template>
  <div class="lm-tree-branch">
    <div class="lm-tree-item" :data-lm-item-id="node.id">
      <a class="lm-tree-item-link" :href="entryHref(node.id)" :title="`打开${itemName}的资料页`">
        <AtlasIcon :id="node.id" :size="44" />
        <strong>{{ itemName }}</strong>
        <span class="lm-tree-amount">×{{ node.count }}</span>
      </a>
      <span v-if="node.recipe" class="lm-tree-station" :title="`${node.recipe.station}，制作 ${node.batches} 次`">{{ node.recipe.station }} · {{ node.batches }} 次</span>
      <span v-else class="lm-tree-station">末端材料</span>
      <select v-if="node.options.length && !node.stopped" class="lm-tree-recipe-select"
        :aria-label="`${itemName}的制作路线`" :value="selected[node.key] ?? node.recipe?.id ?? '__raw__'"
        @change="emit('choose', node.key, ($event.target as HTMLSelectElement).value)">
        <option v-for="option in node.options" :key="option.id" :value="option.id">{{ option.name }} · {{ option.station }}</option>
        <option value="__raw__">作为末端材料</option>
      </select>
      <button v-if="node.children.length" type="button" class="lm-tree-collapse"
        :aria-label="`${collapsed[node.key] ? '展开' : '收起'}${itemName}的材料分支`"
        @click="emit('toggle', node.key)">{{ collapsed[node.key] ? `展开 ${node.children.length} 项 ↓` : '收起分支 ↑' }}</button>
    </div>
    <div v-if="node.children.length && !collapsed[node.key]" class="lm-tree-children">
      <AtlasCraftNode v-for="child in node.children" :key="child.key" :node="child" :selected="selected" :collapsed="collapsed"
        @choose="(key, recipeId) => emit('choose', key, recipeId)" @toggle="key => emit('toggle', key)" />
    </div>
  </div>
</template>
