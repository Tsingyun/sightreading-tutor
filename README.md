# 识谱大师 · 五线谱识谱训练

> **[在线体验 →](https://tsingyun.github.io/sightreading-tutor/)**

基于 Web MIDI API + VexFlow 构建的互动式五线谱识谱教学程序，面向音乐初学者。支持 MIDI 键盘实时输入，无需安装，打开浏览器即可练习。

---

## 功能特性

### 四大练习模式

| 模式 | 说明 |
|------|------|
| **🎵 识谱训练** | 单音/和弦出题，5 级渐进难度，实时判定对错，支持提示系统 |
| **🎹 自由弹奏** | 实时显示音符，自动识别和弦名称与转位，支持三和弦/七和弦/挂留和弦 |
| **🥁 节奏训练** | Web Audio 节拍器，练习/挑战双模式，±100ms 精准评分 |
| **🎼 乐曲练习** | 内置 6 首经典曲目 + MIDI 文件导入，跟弹模式 + 速度调节 |

### 核心功能

- **调号训练**：9 个调号（C/G/D/A/E/F/♭B/♭E/♭A），五线谱自动渲染调号
- **渐进式难度**：从 C-D-E 三个音到双谱表 + 升降号，5 级递进
- **新手引导**：5 步互动教程，零基础也能快速上手
- **和弦识别**：实时识别和弦类型、根音、转位（基于最低音判定）
- **MIDI 输入**：连接 MIDI 键盘实时练习，无设备时可用虚拟键盘
- **PWA 离线**：可安装到桌面/手机主屏，离线使用全部功能
- **训练统计**：正确率、连击数、反应时间、历史最高记录
- **本地存储**：所有设置和统计数据自动保存在浏览器中

### 内置乐曲库

| 曲目 | 作曲家 | 难度 |
|------|--------|:----:|
| 欢乐颂 | 贝多芬 | ★☆☆☆☆ |
| 小星星 | 传统民谣 | ★☆☆☆☆ |
| 玛丽有只小羊羔 | 传统民谣 | ★☆☆☆☆ |
| 送别 | 约翰·奥德威 | ★★☆☆☆ |
| 致爱丽丝（简化版） | 贝多芬 | ★★★☆☆ |
| 卡农 D 大调（简化版） | 帕赫贝尔 | ★★★★☆ |

## 技术栈

| 技术 | 用途 |
|------|------|
| React 19 + TypeScript | 前端框架 |
| Vite | 构建工具 |
| VexFlow | 五线谱渲染引擎 |
| Web MIDI API | MIDI 键盘输入 |
| Web Audio API | 节拍器 + 节奏训练 |
| @tonejs/midi | MIDI 文件解析 |
| vite-plugin-pwa | PWA 离线支持 |
| Newsprint 设计系统 | 报纸风格 UI（Playfair Display + Lora + Inter + JetBrains Mono） |

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
