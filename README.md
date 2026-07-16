# 识谱大师 · 五线谱识谱训练

基于 Web MIDI API + VexFlow 构建的互动式五线谱识谱教学程序，面向音乐初学者。

## 功能特性

- **渐进式难度**：5 个难度等级，从 C-D-E-F-G 五个音到双谱表 + 升降号
- **新手引导**：5 步互动教程，零基础也能快速上手
- **音名提示**：可在五线谱上显示音名，帮助初学者建立音符与位置的对应关系
- **单音/和弦训练**：支持单音识别和多音和弦练习（2/3/4 音）
- **双谱表支持**：高音谱号、低音谱号、双谱表三种模式
- **MIDI 输入**：连接 MIDI 键盘实时练习，无设备时可用虚拟键盘
- **训练统计**：正确率、连击数、反应时间、历史最高记录
- **深色模式**：支持浅色/深色主题切换
- **本地存储**：所有设置和统计数据自动保存在浏览器中

## 技术栈

| 技术 | 用途 |
|------|------|
| React + TypeScript | 前端框架 |
| Vite | 构建工具 |
| VexFlow | 五线谱渲染引擎 |
| Web MIDI API | MIDI 键盘输入 |
| Noto Music 字体 | 音乐符号渲染（本地嵌入） |

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署到 GitHub Pages

本项目已配置 GitHub Actions 自动部署，推送到 `main` 分支即可自动构建发布。

### 首次部署步骤

1. **创建 GitHub 仓库**，将代码推送上去：
   ```bash
   git remote add origin https://github.com/<用户名>/<仓库名>.git
   git push -u origin main
   ```

2. **开启 GitHub Pages**：进入仓库 `Settings → Pages → Build and deployment → Source`，选择 **GitHub Actions**

3. 等待 Actions 运行完成后，访问 `https://<用户名>.github.io/<仓库名>/` 即可

### 部署配置说明

| 文件 | 作用 |
|------|------|
| `vite.config.ts` | `base: './'` 使用相对路径，兼容子路径部署 |
| `.github/workflows/deploy.yml` | GitHub Actions 自动构建部署工作流 |
| `public/.nojekyll` | 禁用 Jekyll 处理，确保资源正常加载 |
| `src/assets/fonts/` | Noto Music 字体本地嵌入，无需外部网络 |

> 无需额外配置，推送代码即可自动部署。
