<script setup lang="ts">
import { computed } from 'vue'
import { entryById, entryHref, recipeHref, recipes } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'

const props = defineProps<{ id: string; compact?: boolean }>()
const recipe = computed(() => recipes.find(value => value.id === props.id))
function name(id: string) { return entryById[id]?.name ?? id }
</script>

<template>
  <div v-if="recipe" class="lm-recipe" :class="{ 'lm-recipe-compact': compact }">
    <div class="lm-recipe-header">
      <a :href="recipeHref(recipe.id)">{{ recipe.name }}</a>
      <span>{{ recipe.station }}<template v-if="recipe.guiOnly"> · 专用界面</template></span>
    </div>
    <div class="lm-recipe-content">
      <div v-if="recipe.type === 'crafting'" class="lm-recipe-grid" :aria-label="`${recipe.name}的九宫格配方`">
        <template v-for="(slot, index) in recipe.slots" :key="index">
          <a v-if="slot" class="lm-recipe-slot" :href="entryHref(slot.id)" :title="name(slot.id)">
            <AtlasIcon :id="slot.id" :size="34" />
            <small v-if="slot.count && slot.count > 1">{{ slot.count }}</small>
          </a>
          <span v-else class="lm-recipe-slot lm-recipe-empty"></span>
        </template>
      </div>
      <div v-else class="lm-recipe-inputs">
        <a v-for="input in recipe.inputs" :key="input.id" :href="entryHref(input.id)" class="lm-recipe-input">
          <AtlasIcon :id="input.id" :size="36" />
          <span>{{ name(input.id) }} ×{{ input.count ?? 1 }}</span>
        </a>
      </div>
      <span class="lm-recipe-arrow" aria-hidden="true">➜</span>
      <div class="lm-recipe-outputs">
        <a v-for="result in recipe.result" :key="result.id" :href="entryHref(result.id)" class="lm-recipe-output">
          <AtlasIcon :id="result.id" :size="48" />
          <span>{{ name(result.id) }} <small>×{{ result.count ?? 1 }}</small></span>
        </a>
      </div>
    </div>
    <p v-if="recipe.note" class="lm-recipe-note">{{ recipe.note }}</p>
  </div>
</template>
