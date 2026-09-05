/// <reference types="vite/client" />
import type { EnhanceAppContext } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import AutoNav from './AutoNav.vue'
import DocStats from './DocStats.vue'
import ContributionHeatmap from './ContributionHeatmap.vue'
import { setupSidebarPersist } from './sidebarPersist'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }: EnhanceAppContext) {
        app.component('AutoNav', AutoNav)
        app.component('DocStats', DocStats)
        app.component('ContributionHeatmap', ContributionHeatmap)

        if (!import.meta.env.SSR) {
            setupSidebarPersist()
        }
    }
}
