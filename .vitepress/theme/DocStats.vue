<script setup>
import { useData } from 'vitepress'
import { ref, computed, onMounted } from 'vue'

const { theme } = useData()

const wordCounts = computed(() => theme.value.wordCounts || {})

const totalWords = computed(() => {
  const counts = wordCounts.value
  return Object.values(counts).reduce((sum, c) => sum + c, 0)
})

// 数字动画
const displayTotal = ref(0)

function animateNumber(from, to, duration, callback) {
  const start = performance.now()
  function tick(now) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(2, -10 * progress)
    callback(Math.floor(from + (to - from) * eased))
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  animateNumber(0, totalWords.value, 1400, v => { displayTotal.value = v })
})

function formatNumber(n) {
  return n.toLocaleString('zh-CN')
}

// 计数器地址在 config.mts 的 themeConfig.counterUrl 里配置（自建 Moe-Counter）
const counterUrl = computed(() => theme.value.counterUrl || '')
</script>

<template>
  <div class="doc-stats">
    <!-- 字数统计：水平紧凑 -->
    <div class="word-count-row">
      <span class="wc-icon">📝</span>
      <span class="wc-label">文档总字数</span>
      <span class="wc-value">{{ formatNumber(displayTotal) }}</span>
      <span class="wc-unit">字</span>
    </div>

    <!-- 访问次数：简单边框 -->
    <div v-if="counterUrl" class="visit-box">
      <span class="visit-label">👀 访问次数</span>
      <div class="moe-counter">
        <img :src="counterUrl" alt="访问次数" loading="lazy" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.doc-stats {
  margin: 1.2rem 0 1.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

/* ===== 字数行 ===== */
.word-count-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 22px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
  animation: fadeSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.wc-icon {
  font-size: 1.05rem;
}

.wc-label {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.wc-value {
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4285f4, #9c27b0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.wc-unit {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  font-weight: 500;
}

/* ===== 访问计数 ===== */
.visit-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 18px 28px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  animation: fadeSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
}

.visit-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.moe-counter img {
  height: 80px;
  image-rendering: pixelated;
}

/* ===== Animations ===== */
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 暗色模式 ===== */
.dark .word-count-row {
  background: rgba(40, 40, 40, 0.5);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.dark .visit-box {
  border-color: rgba(255, 255, 255, 0.1);
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .wc-value {
    font-size: 1.2rem;
  }
  .moe-counter img {
    height: 60px;
  }
}
</style>
