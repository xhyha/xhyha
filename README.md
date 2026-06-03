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

### 安装与运行

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

| # | 模板名称 | 类型 | 分类标签 |
|:--|:---|:---|:---|
| 1 | Elimination（消消乐） | REACTION | 策略 · 益智 |
| 2 | RhythmTap（节奏点击） | REACTION | 节奏 · 反应 |
| 3 | MemoryFlip（记忆翻牌） | SENSES | 记忆 · 益智 |
| 4 | Breathing（呼吸放松） | HEALING | 治愈 · 减压 |
| 5 | Drawing（连点绘画） | CREATE | 创造 · 艺术 |
| 6 | ColorMatch（颜色匹配） | REACTION | 反应 · 感知 |
| 7 | QuickMath（速算挑战） | PUZZLE | 算术 · 益智 |
| 8 | BubblePop（泡泡射击） | REACTION | 休闲 · 反应 |
| 9 | WordScramble（单词拼图） | PUZZLE | 文字 · 益智 |
| 10 | ChaseLight（追光挑战） | REACTION | 反应 · 注意力 |
| 11 | Game2048（2048） | PUZZLE | 策略 · 数字 |
| 12 | Snake（贪吃蛇） | REACTION | 经典 · 策略 |
| 13 | Breakout（打砖块） | REACTION | 经典 · 反应 |
| 14 | WhackAMole（打地鼠） | REACTION | 反应 · 休闲 |
| 15 | CatchCoins（接金币） | REACTION | 休闲 · 反应 |
| 16 | TicTacToe（井字棋） | PUZZLE | 策略 · 对弈 |
| 17 | PianoTiles（钢琴块） | REACTION | 节奏 · 反应 |
| 18 | Maze（迷宫探索） | PUZZLE | 策略 · 探索 |
| 19 | Reflex（反应测试） | REACTION | 纯反应 · 竞速 |
| 20 | SimonSays（西蒙说） | SENSES | 记忆 · 模仿 |
| 21 | DotsAndBoxes（点格棋） | PUZZLE | 策略 · 对弈 |
| 22 | TileSlide（滑块拼图） | PUZZLE | 益智 · 空间 |
| 23 | ReactionDual（双线反应） | REACTION | 注意力 · 多任务 |
| 24 | PatternMemory（图案记忆） | SENSES | 记忆 · 图案 |
| 25 | BalloonPop（气球算术） | PUZZLE | 算术 · 休闲 |

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
| [方案升级设计](./docs/DESIGN_UPGRADE.md) | 架构升级方案与模块详细设计 |
| [部署指南](./docs/DEPLOYMENT.md) | 鸿蒙元服务部署与发布流程 |

---

## 📄 许可证

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源。

---

<div align="center">

**Genesis** — 华为游戏中心 · 鸿蒙元服务 · AI 驱动微游戏生成器

</div>
