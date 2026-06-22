<div align="center">

# Genesis — AI 微游戏生成器

**华为游戏中心 × 鸿蒙元服务**

[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Jest](https://img.shields.io/badge/Jest-29.7-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Coverage 83%+](https://img.shields.io/badge/Coverage-83.5%25-brightgreen)](./coverage)
[![Tests 1,057](https://img.shields.io/badge/Tests-1%2C057%20passed-success)](./src)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

---

## 📖 项目概述

**Genesis** 是一个面向华为游戏中心的 AI 驱动微游戏生成引擎，基于鸿蒙（HarmonyOS）元服务架构，能够在用户等待下载、通勤、情绪低落等场景下，智能推荐并即时生成 30 秒以内的轻量级小游戏。

### ✨ 核心特性

- 🧠 **智能触发** — 基于时间、行为、情绪、环境、社交等 9 种内置触发器，精准推送游戏时机
- 🎮 **25 个游戏模板** — 涵盖反应、益智、创造、感官、社交、治愈 6 大类型
- 👤 **个性化引擎** — 基于 6 维用户画像的实时推荐与难度自适应
- 🏆 **成就系统** — 15 个成就 + 每日挑战，支持稀有度分级
- 📊 **数据分析** — 完整的漏斗分析、留存队列、仪表盘指标
- 💰 **商业化引擎** — 虚拟货币、商店、广告、高级会员体系
- 🧪 **A/B 实验平台** — 多指标实验引擎，支持定向投放与统计显著性检验
- 🌍 **10 种语言国际化** — 内置文化规则引擎与 RTL 支持
- ☁️ **云端同步** — 多设备数据同步，支持冲突合并策略
- 🎭 **情绪引擎** — 行为情绪识别与自适应叙事
- 🛠️ **自制游戏工坊** — 可视化游戏创作器：选模板 · 调参数 · 实时预览 · 试玩保存
- 🎆 **全局特效引擎** — 粒子爆发、扩散光环、屏幕闪烁、连击计数器等沉浸式反馈
- 🏆 **最佳成绩持久化** — localStorage 记录每款游戏的最高分，菜单实时统计

---

## 🏗️ 功能架构

```
┌─────────────────────────────────────────────┐
│              HarmonyOS MetaAbility           │
├─────────────────────────────────────────────┤
│  GenesisService │ Widget │ EntryAbility      │
├─────────────────────────────────────────────┤
│ MicroGameEngine │ TriggerEngine │ Personalization │
├─────────────────────────────────────────────┤
│ Leaderboard │ Achievement │ Social │ Analytics │
├─────────────────────────────────────────────┤
│ Monetization │ Experiment │ Emotion │ Cloud │ I18n │
├─────────────────────────────────────────────┤
│ TemplateFactory │ TemplateSDK │ 25 Game Templates │
├─────────────────────────────────────────────┤
│  EventEmitter │ Vector2 │ GameLoop │ Types     │
└─────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 在线体验（推荐）

无需安装，**直接在浏览器打开** 即可体验全部 25 款游戏 + AI 个性化实验室：

```bash
# 方式一：直接用浏览器打开 demo/index.html
open demo/index.html        # macOS
xdg-open demo/index.html    # Linux
start demo/index.html       # Windows
```

> 💡 也可以用任意静态服务器：`npx serve demo` 或 `python -m http.server` 后访问 `http://localhost:8000`。
> 每款游戏卡片都有 **「玩法」按钮**，点开即可查看详细的操作说明、计分规则与实战技巧。

#### 🛠️ 自制游戏工坊（Game Maker Workshop）

菜单页点击 **「自制游戏工坊」** 横幅即可进入可视化游戏创作器：

| 步骤 | 功能 | 说明 |
|------|------|------|
| ① 选模板 | 4 种基础原型 | 点击靶心 / 接物躲避 / 反应计时 / 记忆序列 |
| ② 个性化 | 名称 · 图标 · 主题色 · 时长 | 12 款 emoji 图标 + 6 种霓虹主题色 |
| ②.5 调参数 | 每种原型独有参数滑块 | 靶心大小、下落速度、炸弹比例、按钮数量… |
| ③ 预览试玩 | 实时动画预览 + 全屏试玩 | 预览面板实时反映参数变化；点「试玩」全屏体验 |
| ④ 我的作品 | localStorage 持久保存 | 每个作品可播放 / 编辑 / 删除，独立记录最高分 |

> 🎲 点击「随机」按钮可一键生成随机组合，激发创作灵感！

### 安装与运行（开发者）

```bash
# 克隆项目
git clone <repo-url> genesis
cd genesis

# 安装依赖
npm install

# 运行测试（含覆盖率报告）
npm test

# 编译构建
npm run build

# 运行交互式 Demo
npx ts-node src/demo.ts
```

---

## 📊 项目统计

| 指标 | 数值 |
|:---|:---|
| 🎮 游戏模板 | **25** 个 |
| ⚙️ 引擎模块 | **15** 个 |
| 🧪 测试用例 | **1,057** 个（全部通过） |
| 📊 代码覆盖率 | **83.5%** 语句覆盖 |
| 🌍 支持语言 | **10** 种 |
| 🏆 成就数量 | **15** 个 + 9 个触发器 |
| 📦 源文件 | **52** 个 TypeScript 文件 |

---

## 🎮 游戏模板列表

> 完整玩法说明、操作指引、计分规则、实战技巧详见 **[📜 游戏玩法手册](./docs/GAMES_GUIDE.md)**

### 速查表（含核心机制 · 难度 · 时长）

| # | 模板名称 | 类型 | 分类 | 难度 | 时长 | 核心玩法 |
|:--|:---|:---|:---|:---|:---|:---|
| 1 | [Elimination](./docs/GAMES_GUIDE.md#1-elimination-消消乐)（消消乐） | PUZZLE | 益智 · 三消 | ★★ | 30s | 交换相邻方块凑 3+ 同色消除，连锁加分 |
| 2 | [RhythmTap](./docs/GAMES_GUIDE.md#2-rhythmtap-节奏点击)（节奏点击） | REACTION | 节奏 · 反应 | ★★ | 30s | 在脉动圆圈亮度峰值时点击，按精度计分 |
| 3 | [MemoryFlip](./docs/GAMES_GUIDE.md#3-memoryflip-记忆翻牌)（记忆翻牌） | SENSES | 记忆 · 配对 | ★ | 30s | 翻开 16 张卡片找出 8 对相同图案 |
| 4 | [Breathing](./docs/GAMES_GUIDE.md#4-breathing-呼吸放松)（呼吸放松） | HEALING | 治愈 · 减压 | ★ | 30s | 跟随圆圈缩放进行 4-4-4-2 呼吸法 |
| 5 | [Drawing](./docs/GAMES_GUIDE.md#5-drawing-连点绘画)（连点绘画） | CREATE | 创造 · 艺术 | ★ | 30s | 按编号 1→10 顺序连接散点成画 |
| 6 | [ColorMatch](./docs/GAMES_GUIDE.md#6-colormatch-颜色匹配)（颜色匹配） | REACTION | Stroop · 感知 | ★★ | 30s | 点选文字「颜色」而非「字义」的斯特鲁普测试 |
| 7 | [QuickMath](./docs/GAMES_GUIDE.md#7-quickmath-速算挑战)（速算挑战） | PUZZLE | 算术 · 益智 | ★★ | 30s | 快速解答加减乘，连对递增加分 |
| 8 | [BubblePop](./docs/GAMES_GUIDE.md#8-bubblepop-泡泡射击)（泡泡射击） | REACTION | 休闲 · 反应 | ★★ | 30s | 点击上升的泡泡，越小分越高 |
| 9 | [WordScramble](./docs/GAMES_GUIDE.md#9-wordscramble-单词拼图)（单词拼图） | PUZZLE | 文字 · 益智 | ★★ | 30s | 按正确顺序点击打乱字母拼出单词 |
| 10 | [ChaseLight](./docs/GAMES_GUIDE.md#10-chaselight-追光挑战)（追光挑战） | REACTION | 反应 · 注意力 | ★★★ | 30s | 限时内追点击亮格子，连击递增 |
| 11 | [Game2048](./docs/GAMES_GUIDE.md#11-game2048)（2048） | PUZZLE | 策略 · 数字 | ★★★ | 30s | 滑动合并相同数字，目标合成 2048 |
| 12 | [Snake](./docs/GAMES_GUIDE.md#12-snake-贪吃蛇)（贪吃蛇） | REACTION | 经典 · 策略 | ★★ | 30s | 控制蛇吃食变长，避开墙壁与自身 |
| 13 | [Breakout](./docs/GAMES_GUIDE.md#13-breakout-打砖块)（打砖块） | REACTION | 经典 · 反应 | ★★ | 30s | 挡板反弹小球击碎所有砖块 |
| 14 | [WhackAMole](./docs/GAMES_GUIDE.md#14-whackamole-打地鼠)（打地鼠） | REACTION | 反应 · 休闲 | ★ | 30s | 地鼠冒出时点击击中，空点扣分 |
| 15 | [CatchCoins](./docs/GAMES_GUIDE.md#15-catchcoins-接金币)（接金币） | REACTION | 休闲 · 反应 | ★★ | 30s | 移动篮子接金币，避开炸弹 |
| 16 | [TicTacToe](./docs/GAMES_GUIDE.md#16-tictactoe-井字棋)（井字棋） | PUZZLE | 策略 · 对弈 | ★★ | 不限 | 3×3 棋盘连成三子，与 AI 对弈 |
| 17 | [PianoTiles](./docs/GAMES_GUIDE.md#17-pianotiles-钢琴块)（钢琴块） | REACTION | 节奏 · 反应 | ★★★ | 30s | 黑块下滚时点击，漏点 / 点错结束 |
| 18 | [Maze](./docs/GAMES_GUIDE.md#18-maze-迷宫探索)（迷宫探索） | PUZZLE | 策略 · 探索 | ★★ | 30s | 在随机迷宫中找出口，步数越少分越高 |
| 19 | [Reflex](./docs/GAMES_GUIDE.md#19-reflex-反应测试)（反应测试） | REACTION | 纯反应 · 竞速 | ★ | 5 轮 | 屏幕变绿瞬间点击，测反应毫秒数 |
| 20 | [SimonSays](./docs/GAMES_GUIDE.md#20-simonsays-西蒙说)（西蒙说） | SENSES | 记忆 · 模仿 | ★★★ | 30s | 复现递增长序列，每轮 +1 步 |
| 21 | [DotsAndBoxes](./docs/GAMES_GUIDE.md#21-dotsandboxes-点格棋)（点格棋） | PUZZLE | 策略 · 对弈 | ★★★ | 不限 | 轮流画线闭合方格，与 AI 对弈 |
| 22 | [TileSlide](./docs/GAMES_GUIDE.md#22-tileslide-滑块拼图)（滑块拼图） | PUZZLE | 益智 · 空间 | ★★★ | 30s | 15 数字华容道，滑动还原 1-15 顺序 |
| 23 | [ReactionDual](./docs/GAMES_GUIDE.md#23-reactiondual-双线反应)（双线反应） | REACTION | 注意力 · 多任务 | ★★★★ | 30s | 双任务并行：左侧等绿灯，右侧等数字匹配 |
| 24 | [PatternMemory](./docs/GAMES_GUIDE.md#24-patternmemory-图案记忆)（图案记忆） | SENSES | 记忆 · 图案 | ★★★ | 30s | 复现网格中依次闪亮的图案，每轮 +1 格 |
| 25 | [BalloonPop](./docs/GAMES_GUIDE.md#25-balloonpop-气球算术)（气球算术） | PUZZLE | 算术 · 休闲 | ★★ | 30s | 算出答案后点击携带正确数字的气球 |

### 🎯 游戏分类导览

| 分类 | 数量 | 代表游戏 | 适合场景 |
|:---|:---|:---|:---|
| 🧩 **益智策略** | 7 | Elimination、Game2048、TicTacToe、Maze | 深度思考、通勤 |
| ⚡ **反应敏捷** | 10 | RhythmTap、Snake、Breakout、PianoTiles | 提升反应、碎片时间 |
| 🧠 **记忆感知** | 4 | MemoryFlip、ColorMatch、SimonSays、PatternMemory | 大脑训练、认知提升 |
| 🎨 **创造艺术** | 1 | Drawing | 放松、创意 |
| 💆 **治愈放松** | 1 | Breathing | 减压、平复情绪 |
| ➗ **算术挑战** | 2 | QuickMath、BalloonPop | 脑力训练 |

> 💡 **动态难度**：Genesis 个性化引擎会根据玩家胜率、反应速度自动调节每款游戏的难度与速度。

---

## ⚙️ 引擎模块

| 模块 | 文件 | 说明 |
|:---|:---|:---|
| **MicroGameEngine** | `engine/MicroGameEngine.ts` | 主引擎，编排游戏生成、输入处理、状态更新、结果结算 |
| **TemplateFactory** | `engine/TemplateFactory.ts` | 游戏模板工厂，管理 25 个模板的注册与查找 |
| **TemplateSDK** | `engine/TemplateSDK.ts` | 开放 SDK，支持第三方模板开发、校验、注册、导入导出 |
| **TriggerEngine** | `engine/TriggerEngine.ts` | 场景触发引擎，支持优先级排序与冷却时间管理 |
| **PersonalizationEngine** | `engine/PersonalizationEngine.ts` | 个性化推荐引擎，基于 6 维用户画像生成游戏配置 |
| **LeaderboardEngine** | `engine/LeaderboardEngine.ts` | 排行榜引擎，支持日/周/月/全时段排名与分页查询 |
| **AchievementEngine** | `engine/AchievementEngine.ts` | 成就引擎，含稀有度分级、进度追踪、每日挑战 |
| **SocialEngine** | `engine/SocialEngine.ts` | 社交引擎，支持好友、挑战、分享、动态通知 |
| **AnalyticsEngine** | `engine/AnalyticsEngine.ts` | 数据分析引擎，漏斗分析、留存队列、用户画像、仪表盘 |
| **MonetizationEngine** | `engine/MonetizationEngine.ts` | 商业化引擎，虚拟货币、商店、广告、能量系统、会员 |
| **ExperimentEngine** | `engine/ExperimentEngine.ts` | A/B 实验引擎，多指标实验、定向规则、统计显著性 |
| **EmotionEngine** | `engine/EmotionEngine.ts` | 情绪引擎，行为信号识别、情绪画像、自适应叙事推荐 |
| **CloudSyncEngine** | `engine/CloudSyncEngine.ts` | 云同步引擎，多设备同步、冲突合并、设备管理 |
| **I18nEngine** | `engine/I18nEngine.ts` | 国际化引擎，10 种语言、RTL 支持、文化规则引擎 |

---

## 📱 鸿蒙集成

Genesis 基于 **HarmonyOS MetaAbility** 架构设计，通过元服务（Meta Service）实现免安装即用体验：

```
┌────────────────────────────────────────────────┐
│                 HarmonyOS                       │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────┐    ┌──────────────┐         │
│  │ EntryAbility │    │   Widget     │         │
│  │  (全屏游戏)   │    │  (服务卡片)   │         │
│  └──────┬───────┘    └──────┬───────┘         │
│         │                   │                  │
│         └───────┬───────────┘                  │
│                 ▼                              │
│  ┌──────────────────────────┐                 │
│  │    GenesisService        │                 │
│  │  ┌────────────────────┐  │                 │
│  │  │  MicroGameEngine   │  │                 │
│  │  │  + TriggerEngine   │  │                 │
│  │  │  + Personalization │  │                 │
│  │  └────────────────────┘  │                 │
│  └──────────────────────────┘                 │
│                                                │
└────────────────────────────────────────────────┘
```

### 关键组件

- **GenesisService** — 鸿蒙元服务入口，封装游戏引擎生命周期管理
- **Widget（服务卡片）** — 桌面小组件，展示游戏状态与一键开始
- **EntryAbility** — 全屏游戏界面 Ability

### 服务卡片数据

```typescript
const widgetData = genesisService.getWidgetData();
// {
//   hasActiveGame: true,
//   gameName: "QuickMath",
//   score: 450,
//   state: "PLAYING",
//   message: "Tap to play →"
// }
```

---

## 📁 目录结构

```
genesis/
├── src/
│   ├── index.ts                    # 主入口，统一导出
│   ├── demo.ts                     # 交互式 Demo 脚本
│   ├── core/                       # 核心基础设施
│   │   ├── EventEmitter.ts         # 事件系统
│   │   ├── Vector2.ts              # 2D 向量数学库
│   │   └── GameLoop.ts             # 游戏主循环
│   ├── engine/                     # 引擎模块（15 个）
│   │   ├── index.ts                # 引擎统一导出
│   │   ├── MicroGameEngine.ts      # 主引擎
│   │   ├── TemplateFactory.ts      # 模板工厂
│   │   ├── TemplateSDK.ts          # 开放 SDK
│   │   ├── TriggerEngine.ts        # 触发引擎
│   │   ├── PersonalizationEngine.ts # 个性化引擎
│   │   ├── LeaderboardEngine.ts    # 排行榜引擎
│   │   ├── AchievementEngine.ts    # 成就引擎
│   │   ├── SocialEngine.ts         # 社交引擎
│   │   ├── AnalyticsEngine.ts      # 数据分析引擎
│   │   ├── MonetizationEngine.ts   # 商业化引擎
│   │   ├── ExperimentEngine.ts     # A/B 实验引擎
│   │   ├── EmotionEngine.ts        # 情绪引擎
│   │   ├── CloudSyncEngine.ts      # 云同步引擎
│   │   └── I18nEngine.ts           # 国际化引擎
│   ├── models/                     # 数据模型
│   │   ├── types.ts                # 核心类型定义
│   │   ├── UserProfile.ts          # 用户画像工厂
│   │   └── TriggerContext.ts       # 触发上下文工厂
│   ├── templates/                  # 游戏模板（25 个）
│   │   ├── BaseGameTemplate.ts     # 模板基类
│   │   ├── EliminationGame.ts      # 消消乐
│   │   ├── RhythmTapGame.ts        # 节奏点击
│   │   ├── ...                     # 其余 22 个游戏模板
│   │   └── BalloonPopGame.ts       # 气球算术
│   ├── triggers/                   # 内置触发器
│   │   └── BuiltInTriggers.ts      # 9 种场景触发器
│   └── harmony/                    # 鸿蒙适配层
│       └── GenesisService.ts       # 元服务入口
├── docs/                           # 项目文档
│   ├── DESIGN_UPGRADE.md           # 方案升级设计
│   └── DEPLOYMENT.md               # 部署指南
├── demo/                           # Demo 资源
├── harmony-config/                 # 鸿蒙构建配置
├── game-platform/                  # 平台适配
├── jest.config.js                  # Jest 测试配置
├── tsconfig.json                   # TypeScript 配置
└── package.json                    # 项目配置
```

---

## 📚 文档链接

| 文档 | 说明 |
|:---|:---|
| [📜 游戏玩法手册](./docs/GAMES_GUIDE.md) | 25 款游戏完整玩法 · 操作 · 计分 · 技巧 |
| [方案升级设计](./docs/DESIGN_UPGRADE.md) | 架构升级方案与模块详细设计 |
| [部署指南](./docs/DEPLOYMENT.md) | 鸿蒙元服务部署与发布流程 |

---

## 📄 许可证

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源。

---

<div align="center">

**Genesis** — 华为游戏中心 · 鸿蒙元服务 · AI 驱动微游戏生成器

</div>
