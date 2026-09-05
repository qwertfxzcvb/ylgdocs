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
