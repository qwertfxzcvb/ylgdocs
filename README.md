# YLG 烟翎阁 · 服务器文档

烟翎阁 Minecraft 服务器的玩家文档，涵盖入服流程、账号绑定、玩法教程、经济系统等内容

**文档站**：<https://docs.ylg.net.cn>
 
**服务器官网**：<https://www.ylg.net.cn>
 
 
## 技术栈

基于 [VitePress](https://vitepress.dev/) 构建的静态文档站，增加了毛玻璃样式、首页自动目录和字数统计等

## 本地开发

需要 Node.js 18 以上

```bash
npm install
npm run docs:dev
```

浏览器打开 <http://localhost:5173>


## 目录结构

| 路径 | 内容 |
|------|------|
| `guide/` | 新手指南：入服、菜单、规则、客户端、常见问题 |
| `account/` | 账号相关：注册、绑定、密码 |
| `gameplay/` | 玩法教程 |
| `economy/` | 经济系统 |
| `servermechanics/` | 服务器机制 |
| `socialfeatures/` | 社交功能 |
| `linsmagic/` | 魔法插件 |
| `tips/` | 其他技巧 |
| `public/` | 图片等静态资源，页面中以 `/xxx.png` 引用 |
| `.vitepress/config.mts` | 站点配置：标题、导航栏、侧边栏 |
| `.vitepress/theme/` | 自定义主题：样式、自动目录、字数统计 |

## 新增一篇文档

1. 在对应目录下新建 `.md` 文件
2. 在 `.vitepress/config.mts` 的 `sidebar` 中加一条，例如
   `{ text: '传送系统', link: '/gameplay/tpa' }`（链接不带 `.md` 后缀）
3. 侧边栏和首页的目录卡片会自动更新，不需要另外改首页

## 参与改进

发现错别字、过时内容或步骤有误，欢迎通过以下任意方式告诉我们：

- 提 [Issue](https://github.com/qwertfxzcvb/ylgdocs/issues)
- Pull Request
- 联系管理员：QQ `1444001949` · 邮箱 <ylg-net-cn@qq.com>

## 许可

文档内容与自定义主题代码采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans) 许可，详见 [LICENSE](LICENSE)

转载或引用请注明来源为「YLG 烟翎阁服务器文档」并附上本站链接，不得用于商业用途

以下部分不在本许可范围内：`node_modules/` 下的第三方依赖遵循各自的许可协议，VitePress 框架遵循 MIT 许可，Minecraft 及相关商标归 Mojang Studios 所有

---

# YLG Minecraft 26.2 特色生存服务器

YLG 是一个基于 **Minecraft Java 26.2 / Paper 26.2** 的特色生存服务器，以经典生存为基础，融合 **魔法、工业、自动化、管道、能量系统、多方块机器、特殊附魔、特色物品与上千种配方**。

服务器适合喜欢 **长期生存、建筑、养老、工业发展、魔法玩法、自动化生产、大型基地建设** 的玩家，并会持续跟进 Minecraft 新版本更新。

## 服务器特色

- Minecraft Java 26.2
- Paper 26.2
- 经典生存
- 魔法系统
- 工业系统
- 自动化系统
- 管道与物流运输
- 能量系统
- 多方块机器
- 特殊附魔与特效
- 上千种物品与配方
- 长期更新
- 公平管理
- AI 自动审核入服

## 技术维护

服务器由拥有 **10 年 Java 开发经验** 的技术人员负责开发与维护，并有多名管理员提供日常支持。

服务器持续进行插件开发、性能优化、新版本适配、Bug 修复和玩法更新。

## 管理理念

管理团队坚持 **友善、公平、平等**，不搞熟人特权，希望为玩家提供一个长期、稳定、舒适的 Minecraft 生存环境。

## 新玩家审核

新玩家首次进入服务器前需要填写简单问卷。

- 通过率高
- AI 自动审核
- 通常 1 分钟内完成

## 服务器信息

**服务器名称：** YLG 烟翎阁

**服务器地址：** `ylg.net.cn`

**官方网站：** https://www.ylg.net.cn/

**文档站：** https://docs.ylg.net.cn/

**QQ群：** `490130958`

**版本：** Minecraft Java 26.2

**核心：** Paper 26.2

## 相关 Minecraft 服务器关键词

YLG 属于 Minecraft Java 生存服务器、Minecraft 26.2 服务器、Paper 生存服、特色生存服、插件服务器、工业服务器、魔法服务器、自动化服务器、长期生存服和建筑养老服。

适合正在寻找“我的世界服务器”“Minecraft Java 服务器”“我的世界 26.2 服务器”“Minecraft 生存服务器”“我的世界工业服”“Minecraft 魔法服务器”“Minecraft 自动化服务器”“我的世界长期生存服”等内容的玩家。

## FAQ

### YLG 是什么类型的 Minecraft 服务器？

YLG 是一个 Minecraft Java 26.2 特色生存服务器，以经典生存为基础，融合魔法、工业、自动化、管道、能源、多方块机器和大量特色物品。

### YLG 是模组服务器吗？

服务器主要基于 Paper 与插件实现特色玩法，玩家无需安装大型整合包。

### 服务器适合长期玩吗？

适合。服务器按照长期生存方向设计，并持续开发新玩法和更新内容。

### 有工业和自动化吗？

有。服务器包含工业、能源、物流、管道、多方块机器和自动化生产等内容。

### 有魔法玩法吗？

有。服务器包含魔法、特殊附魔、特殊效果和相关特色内容。

### 如何加入服务器？

完成简单的入服问卷，通过 AI 自动审核后即可加入。

### 服务器地址是什么？

`ylg.net.cn`

---

## 加入 YLG

如果你正在寻找一个 **Minecraft Java 26.2 特色生存服务器**，并且喜欢 **经典生存、魔法、工业、自动化、建筑或长期发展**，欢迎加入 YLG 烟翎阁。

**服务器地址：`ylg.net.cn`**