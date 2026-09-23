/// <reference types="vite/client" />
import type { EnhanceAppContext } from 'vitepress'
import { defineAsyncComponent, h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import './linsmagic/atlas.css'
import './linsmagic/tutorial.css'
import AutoNav from './AutoNav.vue'
import DocStats from './DocStats.vue'
import ContributionHeatmap from './ContributionHeatmap.vue'
import { setupSidebarPersist } from './sidebarPersist'
import AtlasTooltip from './linsmagic/AtlasTooltip.vue'

export default {
    extends: DefaultTheme,
    Layout: () => h(DefaultTheme.Layout, null, { 'layout-bottom': () => h(AtlasTooltip) }),
    enhanceApp({ app }: EnhanceAppContext) {
        app.component('AutoNav', AutoNav)
        app.component('DocStats', DocStats)
        app.component('ContributionHeatmap', ContributionHeatmap)
        app.component('LinsMagicCategory', defineAsyncComponent(() => import('./linsmagic/LinsMagicCategory.vue')))
        app.component('LinsMagicEntry', defineAsyncComponent(() => import('./linsmagic/LinsMagicEntry.vue')))
        app.component('LinsMagicRecipePage', defineAsyncComponent(() => import('./linsmagic/LinsMagicRecipePage.vue')))
        app.component('LinsMagicGuide', defineAsyncComponent(() => import('./linsmagic/LinsMagicGuide.vue')))
        // 教程页用：行内物品、3D 示意场景、路线图，以及直接嵌入百科的配方和多方块结构
        app.component('LmItem', defineAsyncComponent(() => import('./linsmagic/LmItem.vue')))
        app.component('LmScene', defineAsyncComponent(() => import('./linsmagic/LmScene.vue')))
        app.component('LmRoadmap', defineAsyncComponent(() => import('./linsmagic/LmRoadmap.vue')))
        app.component('AtlasRecipe', defineAsyncComponent(() => import('./linsmagic/AtlasRecipe.vue')))
        app.component('AtlasStructure', defineAsyncComponent(() => import('./linsmagic/AtlasStructure.vue')))

        if (!import.meta.env.SSR) {
            setupSidebarPersist()
        }
    }
}
