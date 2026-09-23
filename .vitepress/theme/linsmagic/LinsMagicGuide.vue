<script setup lang="ts">
import AtlasIcon from './AtlasIcon.vue'

const props = withDefaults(defineProps<{ mode?: 'guides' | 'systems' }>(), { mode: 'guides' })

const guides = [
  { id: 'book', title: '芸集知识之书', icon: 'item/book', detail: '图鉴入口、常用菜单与设置。' },
  { id: 'merchant', title: '异界行商联络器', icon: 'item/emerald', detail: '矿砂与特殊物品的交易。' },
  { id: 'hub', title: '次元枢纽传送单元', icon: 'item/ender_pearl', detail: '世界与维度之间的传送。' },
  { id: 'enchant', title: '魔法附魔玩法', icon: 'item/enchanted_book', detail: '注魔与高级附魔的获取。' },
  { id: 'guild', title: '公会', icon: 'item/shield', detail: '创建、加入与公会排名。' },
  { id: 'special', title: '特殊事件指南', icon: 'item/bell', detail: '精英怪及服务器事件。' },
  { id: 'night', title: '特殊夜晚指南', icon: 'item/nether_star', detail: '各类特殊夜晚的触发与效果。' },
  { id: 'mineral', title: '工业矿机组指南', icon: 'block/basalt_side', detail: '搭建、燃料、探针与矿砂存储。' }
]

const systems = [
  { id: 'pipeline', title: '管道系统', icon: 'block/black_stained_glass', detail: '箱子到箱子的第一条线、阀门方向、分流分拣、给机器自动进出料、末影传送与填充机仓库。' },
  { id: 'multiblock', title: '多方块机器', icon: 'block/piston_top', detail: '看懂 3D 结构图；原石粉碎机、7 台原版矿机、工业矿机组手把手；四十多台机器一览。' },
  { id: 'enchanting', title: '附魔体系', icon: 'item/enchanted_book', detail: '30 级抽高阶附魔的概率、6 系注魔器怎么摆、铁砧合并规则、词条刻刀与附魔结晶。' },
  { id: 'events-bosses', title: '夜间事件与首领', icon: 'item/nether_star', detail: '六种特殊夜晚的危险与收获、催化剂召唤、精英怪、召唤祭坛与 18 个首领。' },
  { id: 'web-machines', title: '网页机器', icon: 'item/map', detail: '用绘制台-WE 把任意图片变成挂在墙上的地图画。' }
]
</script>

<template>
  <div class="lm-category lm-folder-grid">
    <a v-for="guide in props.mode === 'systems' ? systems : guides" :key="guide.id" class="lm-folder"
      :href="props.mode === 'systems' ? `/linsmagic/atlas/tutorials/systems/${guide.id}` : `/linsmagic/atlas/guide/${guide.id}`">
      <AtlasIcon :texture="guide.icon" :size="48" />
      <span><strong>{{ guide.title }}</strong><small>{{ guide.detail }}</small></span>
      <span class="lm-folder-arrow" aria-hidden="true">↗</span>
    </a>
  </div>
</template>
