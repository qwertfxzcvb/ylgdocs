<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { entryById, entryHref, recipeHref, recipes } from './atlasData'
import AtlasIcon from './AtlasIcon.vue'
import AtlasRecipe from './AtlasRecipe.vue'
import AtlasStructure from './AtlasStructure.vue'
import AtlasCraftTree from './AtlasCraftTree.vue'

const props = defineProps<{ id: string }>()
const entry = computed(() => entryById[props.id])
const madeBy = computed(() => recipes.filter(recipe => recipe.result.some(result => result.id === props.id)))
const usedIn = computed(() => recipes.filter(recipe => recipe.slots?.some(slot => slot?.id === props.id)
  || recipe.inputs?.some(input => input.id === props.id)))
const processing = computed(() => entry.value?.kind === 'machine'
  ? recipes.filter(recipe => recipe.type === 'machine' && recipe.station === entry.value?.name)
  : [])
const showAllMadeBy = ref(false)
const showAllUses = ref(false)
const showAllRelated = ref(false)
watch(() => props.id, () => { showAllMadeBy.value = false; showAllUses.value = false; showAllRelated.value = false })
const visibleMadeBy = computed(() => showAllMadeBy.value ? madeBy.value : madeBy.value.slice(0, 6))
const visibleUses = computed(() => showAllUses.value ? usedIn.value : usedIn.value.slice(0, 24))
const visibleRelated = computed(() => showAllRelated.value ? entry.value?.related ?? [] : entry.value?.related?.slice(0, 24) ?? [])
function roman(value: number) {
  let result = ''
  for (const [number, digit] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']] as const) {
    while (value >= number) { result += digit; value -= number }
  }
  return result
}
const guide = computed(() => {
  const name = entry.value?.name
  if (name === '芸集知识之书') return { title: '芸集知识之书使用指南', href: '/linsmagic/atlas/guide/book' }
  if (name === '异界行商联络器') return { title: '异界行商交易指南', href: '/linsmagic/atlas/guide/merchant' }
  if (name === '次元枢纽传送单元') return { title: '次元枢纽使用指南', href: '/linsmagic/atlas/guide/hub' }
  if (entry.value?.category === '应用能源') return { title: '应用能源教程', href: '/linsmagic/atlas/tutorials/systems/applied-energistics' }
  if (entry.value?.structureId === 'mining_rig') return { title: '工业矿机组使用指南', href: '/linsmagic/atlas/guide/mineral' }
  if (name?.startsWith('附魔注魔器-')) return { title: '查看附魔注魔器组结构', href: '/linsmagic/atlas/machines/infuser-array' }
  if (name?.startsWith('填充机输出口')) {
    const core = entryById[name.replace('填充机输出口', '填充机核心')]
    if (core) return { title: '查看同型号填充机群结构', href: core.href }
  }
  if (['矿机基座', '基础挖掘模块', '标准挖掘模块', '光海通灵器', '渊底探针', '虚空凝晶镜',
    '星辉共鸣器', '混沌萃取仪', '创世催化器', '终焉解码器', '恒温箱', '致密温室箱'].includes(name ?? ''))
    return { title: '查看工业矿机组结构', href: '/linsmagic/atlas/machines/mining-rig' }
  return null
})
function name(id: string) { return entryById[id]?.name ?? id }
</script>

<template>
  <div v-if="entry" class="lm-entry">
    <div class="lm-entry-lead">
      <AtlasIcon :id="entry.id" :size="88" />
      <div><p>{{ entry.description || '查看物品的获取、用途和关联资料。' }}</p><a v-if="guide" :href="guide.href">{{ guide.title }} ↗</a></div>
    </div>

    <nav class="lm-entry-jumps" aria-label="本页目录">
      <a v-if="entry.levelEffects?.length" href="#等级效果">等级效果</a>
      <a v-if="entry.obtain || entry.details.length" href="#资料与获取">资料与获取</a>
      <a v-if="entry.structureId" href="#多方块结构">多方块结构</a>
      <a v-if="madeBy.length" href="#如何获得">如何获得 ({{ madeBy.length }})</a>
      <a v-if="madeBy.length" href="#合成树">合成树</a>
      <a v-if="processing.length" href="#机器加工">机器加工 ({{ processing.length }})</a>
      <a v-if="usedIn.length" href="#作为材料的用途">作为材料的用途 ({{ usedIn.length }})</a>
      <a v-if="entry.related?.length" href="#相关资料">相关资料 ({{ entry.related.length }})</a>
    </nav>

    <section v-if="entry.levelEffects?.length">
      <h2 id="等级效果">等级效果</h2>
      <div class="lm-enchant-levels">
        <div v-for="(effect, index) in entry.levelEffects" :key="index" class="lm-enchant-level">
          <strong>{{ roman(index + 1) }} 级</strong><span>{{ effect }}</span>
        </div>
      </div>
    </section>

    <section v-if="entry.obtain || entry.details.length">
      <h2 id="资料与获取">资料与获取</h2>
      <p v-if="entry.obtain" class="lm-obtain"><strong>获取方式</strong>{{ entry.obtain }}</p>
      <ul v-if="entry.details.length"><li v-for="line in entry.details" :key="line">{{ line }}</li></ul>
    </section>

    <section v-if="entry.structureId">
      <h2 id="多方块结构">多方块结构</h2>
      <AtlasStructure :id="entry.structureId" />
    </section>

    <section v-if="madeBy.length">
      <h2 id="如何获得">如何获得 <small>{{ madeBy.length }} 种配方</small></h2>
      <div class="lm-stack"><AtlasRecipe v-for="recipe in visibleMadeBy" :key="recipe.id" :id="recipe.id" /></div>
      <button v-if="madeBy.length > 6" class="lm-more" type="button" @click="showAllMadeBy = !showAllMadeBy">{{ showAllMadeBy ? '收起配方' : `展开全部 ${madeBy.length} 种配方` }}</button>
    </section>

    <section v-if="madeBy.length">
      <h2 id="合成树">合成树</h2>
      <AtlasCraftTree :id="entry.id" />
    </section>

    <section v-if="processing.length">
      <h2 id="机器加工">机器加工</h2>
      <div class="lm-stack"><AtlasRecipe v-for="recipe in processing" :key="recipe.id" :id="recipe.id" /></div>
    </section>

    <section v-if="usedIn.length">
      <h2 id="作为材料的用途">作为材料的用途 <small>{{ usedIn.length }} 种配方</small></h2>
      <div v-if="usedIn.length" class="lm-link-list">
        <a v-for="recipe in visibleUses" :key="recipe.id" :href="recipeHref(recipe.id)">
          <AtlasIcon :id="recipe.result[0]?.id" :size="40" />
          <span><strong>{{ name(recipe.result[0]?.id) }}</strong><small>{{ recipe.station }} · {{ recipe.name }}</small></span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <button v-if="usedIn.length > 24" class="lm-more" type="button" @click="showAllUses = !showAllUses">{{ showAllUses ? '收起用途' : `展开全部 ${usedIn.length} 种用途` }}</button>
    </section>

    <section v-if="entry.related?.length">
      <h2 id="相关资料">相关资料 <small>{{ entry.related.length }} 项</small></h2>
      <div class="lm-related">
        <a v-for="id in visibleRelated" :key="id" :href="entryHref(id)"><AtlasIcon :id="id" :size="32" />{{ name(id) }} <span aria-hidden="true">↗</span></a>
      </div>
      <button v-if="entry.related.length > 24" class="lm-more" type="button" @click="showAllRelated = !showAllRelated">{{ showAllRelated ? '收起相关资料' : `展开全部 ${entry.related.length} 项` }}</button>
    </section>

  </div>
</template>
