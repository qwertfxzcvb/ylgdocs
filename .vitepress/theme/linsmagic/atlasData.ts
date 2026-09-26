import catalog from './catalog.generated.json'
import localTextureList from './textures.generated.json'

export type AtlasKind = 'machine' | 'weapon' | 'tool' | 'material' | 'enchant' | 'event' | 'boss' | 'vanilla'
export type AtlasCategoryId = 'recipes' | 'machines' | 'weapons' | 'items' | 'materials' | 'ae' | 'enchants' | 'events' | 'bosses' | 'vanilla'

export interface AtlasEntry {
  id: string
  name: string
  kind: AtlasKind
  category: string
  group: string
  icon: string
  description: string
  details: string[]
  enchantments?: string[]
  levelEffects?: string[]
  obtain: string
  glint: boolean
  href: string
  structureId?: string
  related?: string[]
}

export interface RecipeIngredient { id: string; count: number }
export interface AtlasRecipe {
  id: string
  name: string
  station: string
  type: 'crafting' | 'shapeless' | 'machine'
  result: RecipeIngredient[]
  slots?: Array<RecipeIngredient | null>
  inputs?: RecipeIngredient[]
  group: string
  href: string
  note: string
  guiOnly: boolean
}

export interface AtlasBlock {
  x: number; y: number; z: number
  id: string; name: string; description: string; texture: string
  options?: Array<{ id: string; name: string; texture: string }>
}
export interface AtlasStructure {
  id: string; name: string; variants: AtlasBlock[][]; note?: string
}

const verified: Record<string, Partial<AtlasEntry>> = {
  'blood-moon-scythe': {
    description: '以腐心血珀与尸潮裹布淬炼的血月收割之镰。',
    details: ['命中时有 30% 概率恢复 1❤，并使目标获得 2 秒迟缓 II。', '血月之夜额外有 10% 概率触发凋零。', '自带锋利 III、耐久 III。'],
    glint: true
  },
  'core-smelter': {
    description: '高压挤压、重组熔岩物质分子的熔融炉。',
    details: ['以熔岩块为中心，四个水平方向各放置黑曜石。', '中心下方放置木桶，并把原料放入木桶。', '每次消耗 1 个岩浆桶与 4 个煤炭，产出 1 个地核炽粉并退还空桶。']
  },
  'magic-mirror': { description: '一面神奇的镜子，右键打开意象提取合成菜单。' },
}

export const entries: AtlasEntry[] = (catalog.entries as AtlasEntry[]).map(entry => ({ ...entry, ...verified[entry.id] }))
export const recipes = catalog.recipes as AtlasRecipe[]
export const structures = catalog.structures as AtlasStructure[]
export const categoryGroups = catalog.categoryGroups as Array<{ id: AtlasCategoryId; title: string; icon: string; description: string }>
export const recipeSubgroups = catalog.recipeSubgroups as Array<{ id: string; title: string }>
export const stats = catalog.stats
export const entryById = Object.fromEntries(entries.map(entry => [entry.id, entry])) as Record<string, AtlasEntry>
export const recipeById = Object.fromEntries(recipes.map(recipe => [recipe.id, recipe])) as Record<string, AtlasRecipe>
export const structureById = Object.fromEntries(structures.map(structure => [structure.id, structure])) as Record<string, AtlasStructure>

export function categoryHref(category: AtlasCategoryId): string { return `/linsmagic/atlas/${category}/` }
export function entryHref(id: string): string { return entryById[id]?.href ?? '/linsmagic/atlas' }
export function recipeHref(id: string): string { return recipeById[id]?.href ?? categoryHref('recipes') }
export function categoryEntries(category: AtlasCategoryId): AtlasEntry[] {
  return entries.filter(entry => category === 'recipes' ? false : entry.href.startsWith(`${categoryHref(category)}`))
}

const textureAliases: Record<string, string[]> = {
  'item/glass_pane': ['block/glass'],
  'item/magma_block': ['block/magma'],
  'item/barrel': ['block/barrel_side'],
  'item/crafting_table': ['block/crafting_table_front'],
  'item/grass_block': ['block/grass_block_top'],
  'item/knowledge_book': ['item/book'],
  'item/iron_block': ['block/iron_block'],
  'item/piston': ['block/piston_top'],
  'item/piston_top': ['block/piston_top'],
  'item/basalt': ['block/basalt_side'],
  'item/quartz_block': ['block/quartz_block_side'],
  'item/enchanting_table': ['block/enchanting_table_top'],
  'item/daylight_detector': ['block/daylight_detector_top'],
  'item/blast_furnace': ['block/blast_furnace_front'],
  'item/prismarine_wall': ['block/prismarine'],
  'item/waxed_exposed_copper': ['block/exposed_copper'],
  'item/waxed_weathered_copper': ['block/weathered_copper'],
  'item/waxed_oxidized_copper': ['block/oxidized_copper'],
  // 1.21.5 资源里这些方块没有 item 贴图（物品用的是 3D 模型），换成能代表它的方块面，否则会退回知识之书
  'item/air': ['item/barrier'],
  'item/ancient_debris': ['block/ancient_debris_side'],
  'item/big_dripleaf': ['block/big_dripleaf_top'],
  'item/black_stained_glass_pane': ['block/black_stained_glass'],
  'item/blackstone_slab': ['block/blackstone'],
  'item/bone_block': ['block/bone_block_side'],
  'item/cartography_table': ['block/cartography_table_top'],
  'item/chest': ['block/oak_planks'],
  'item/trapped_chest': ['block/oak_planks'],
  'item/ender_chest': ['block/obsidian'],
  'item/clock': ['item/clock_00'],
  'item/compass': ['item/compass_00'],
  'item/recovery_compass': ['item/recovery_compass_00'],
  'item/composter': ['block/composter_side'],
  'item/crimson_hyphae': ['block/crimson_stem'],
  'item/dispenser': ['block/dispenser_front'],
  'item/dropper': ['block/dropper_front'],
  'item/dried_kelp_block': ['block/dried_kelp_side'],
  'item/enchanted_golden_apple': ['item/golden_apple'],
  'item/fletching_table': ['block/fletching_table_front'],
  'item/furnace': ['block/furnace_front'],
  'item/grindstone': ['block/grindstone_side'],
  'item/hay_block': ['block/hay_block_side'],
  'item/heavy_weighted_pressure_plate': ['block/iron_block'],
  'item/light_weighted_pressure_plate': ['block/gold_block'],
  'item/honey_block': ['block/honey_block_side'],
  'item/iron_chain': ['item/chain'],
  'item/lectern': ['block/lectern_front'],
  'item/lodestone': ['block/lodestone_side'],
  'item/loom': ['block/loom_front'],
  'item/moss_carpet': ['block/moss_block'],
  'item/observer': ['block/observer_front'],
  'item/polished_basalt': ['block/polished_basalt_side'],
  'item/polished_blackstone_slab': ['block/polished_blackstone'],
  'item/polished_diorite_slab': ['block/polished_diorite'],
  'item/pumpkin': ['block/pumpkin_side'],
  'item/purpur_slab': ['block/purpur_block'],
  'item/respawn_anchor': ['block/respawn_anchor_side0'],
  'item/sculk_catalyst': ['block/sculk_catalyst_side'],
  'item/smithing_table': ['block/smithing_table_front'],
  'item/smoker': ['block/smoker_front'],
  'item/smooth_stone_slab': ['block/smooth_stone'],
  'item/snow_block': ['block/snow'],
  'item/sticky_piston': ['block/piston_top_sticky'],
  'item/stone_slab': ['block/stone'],
  'item/stripped_oak_wood': ['block/stripped_oak_log'],
  'item/sunflower': ['block/sunflower_front'],
  'item/tnt': ['block/tnt_side'],
  'item/copper_bulb': ['block/copper_bulb'],
  // 应用能源方块的外观
  'item/polished_blackstone_pressure_plate': ['block/polished_blackstone'],
  'item/stone_pressure_plate': ['block/stone'],
  'item/copper_bars': ['block/copper_bars'],
  'item/target': ['block/target_side'],
  'item/verdant_froglight': ['block/verdant_froglight_side'],
  'item/ochre_froglight': ['block/ochre_froglight_side'],
  'item/pearlescent_froglight': ['block/pearlescent_froglight_side'],
  'item/oxidized_lightning_rod': ['block/lightning_rod'],
  'item/skeleton_skull': ['item/bone'],
  'item/wither_skeleton_skull': ['item/coal'],
  'item/zombie_head': ['item/rotten_flesh'],
  'item/creeper_head': ['item/gunpowder'],
  'item/dragon_head': ['item/dragon_breath']
}

/** 涂蜡铜与未涂蜡外观相同，资源包里只有未涂蜡的贴图 */
function unwaxed(texture: string): string {
  return texture.replace(/\/waxed_/, '/')
}

/** 1.21.5 之后才加入的方块贴图，从较新的资源版本取 */
const newerTextures = new Set(['block/copper_bars'])

/** 已下载到 public/textures/ 的贴图（scripts/sync-linsmagic-textures.mjs 生成）；本地有就不走外部图库 */
const localTextures = new Set<string>(localTextureList as string[])

function remoteTextureUrl(texture: string, version = newerTextures.has(texture) ? '1.21.10' : '1.21.5'): string {
  return `https://assets.mcasset.cloud/${version}/assets/minecraft/textures/${texture}.png`
}

export function textureUrl(texture: string): string {
  return localTextures.has(texture) ? `/textures/${texture}.png` : remoteTextureUrl(texture)
}

/** 默认资源版本里找不到时再试的新版本（服务器所用版本），新加入原版的物品（铜马铠、鹦鹉螺铠甲等）从这里取 */
const LATEST_ASSET_VERSION = '26.1'

export function textureCandidates(texture: string): string[] {
  const plain = unwaxed(texture)
  const base = [plain, ...(textureAliases[plain] ?? [])]
  if (plain.startsWith('item/')) base.push(`block/${plain.slice(5)}`)
  if (plain.startsWith('block/')) base.push(`item/${plain.slice(6)}`)
  const names = [...new Set(base)]
  // 本地已有的排最前；本地没有的才去外部图库（先默认版本、再新版本），最后退回书本
  const local = names.filter(name => localTextures.has(name)).map(name => `/textures/${name}.png`)
  const remote = names.filter(name => !localTextures.has(name))
  return [...new Set([...local, ...remote.map(name => remoteTextureUrl(name)),
    ...remote.map(name => remoteTextureUrl(name, LATEST_ASSET_VERSION)), textureUrl('item/book')])]
}

const cubeTextureAliases: Record<string, string> = {
  magma_block: 'block/magma', barrel: 'block/barrel_side', chest: 'block/oak_planks',
  trapped_chest: 'block/oak_planks', campfire: 'block/oak_log', soul_campfire: 'block/oak_log',
  glass_pane: 'block/glass', grass_block: 'block/grass_block_top',
  basalt: 'block/basalt_side', quartz_block: 'block/quartz_block_side',
  enchanting_table: 'block/enchanting_table_top', daylight_detector: 'block/daylight_detector_top',
  blast_furnace: 'block/blast_furnace_front', prismarine_wall: 'block/prismarine',
  // 以下方块没有同名的 block 贴图（或 3D 预览里用正面更好认）
  ender_chest: 'block/obsidian', dispenser: 'block/dispenser_front', dropper: 'block/dropper_front',
  furnace: 'block/furnace_front', smoker: 'block/smoker_front', observer: 'block/observer_front',
  loom: 'block/loom_front', lodestone: 'block/lodestone_side', composter: 'block/composter_side',
  respawn_anchor: 'block/respawn_anchor_side0', hay_block: 'block/hay_block_side', bone_block: 'block/bone_block_side',
  ancient_debris: 'block/ancient_debris_side', pumpkin: 'block/pumpkin_side', tnt: 'block/tnt_side',
  crafting_table: 'block/crafting_table_front', smithing_table: 'block/smithing_table_front',
  polished_basalt: 'block/polished_basalt_side', piston: 'block/piston_side', sticky_piston: 'block/piston_side',
  snow_block: 'block/snow', oxidized_lightning_rod: 'block/oxidized_copper', lightning_rod: 'block/copper_block',
  sculk_catalyst: 'block/sculk_catalyst_side', honey_block: 'block/honey_block_side', lectern: 'block/lectern_front',
  target: 'block/target_side', verdant_froglight: 'block/verdant_froglight_side', ochre_froglight: 'block/ochre_froglight_side',
  pearlescent_froglight: 'block/pearlescent_froglight_side'
}

export function blockTextureUrl(block: AtlasBlock): string {
  const material = (block.id.startsWith('minecraft:')
    ? block.id.slice('minecraft:'.length)
    : entryById[block.id]?.icon.replace(/^(item|block)\//, '') ?? 'stone').replace(/^waxed_/, '')
  return textureUrl(cubeTextureAliases[material] ?? `block/${material}`)
}
