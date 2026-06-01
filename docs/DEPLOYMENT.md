# Genesis AI Micro-Game Engine - HarmonyOS 部署指南

> 本文档详细说明如何将 Genesis AI 微游戏引擎构建、调试、测试并发布为 HarmonyOS 元服务（MetaAbility），最终上架华为游戏中心（Game Center）。

---

## 目录

1. [项目概述](#1-项目概述)
2. [环境准备](#2-环境准备)
3. [项目导入与构建](#3-项目导入与构建)
4. [元服务配置](#4-元服务配置)
5. [调试与测试](#5-调试与测试)
6. [发布流程](#6-发布流程)
7. [CI/CD 配置](#7-cicd-配置)
8. [监控与运维](#8-监控与运维)

---

## 1. 项目概述

### 1.1 什么是 Genesis

Genesis 是一个基于 AI 驱动的个性化微游戏生成引擎，专为 HarmonyOS 元服务（MetaAbility）设计。它能够：

- **场景感知触发**：根据时间、用户情绪、设备状态等多维信号自动推送微游戏
- **个性化生成**：基于用户偏好画像（策略 / 动作 / 社交 / 创意 / 放松 / 竞技）动态调整游戏内容
- **即开即玩**：每个微游戏时长 15-60 秒，无需安装，通过服务卡片直接触达用户

### 1.2 技术架构

```
┌─────────────────────────────────────────────────────┐
│                  HarmonyOS 元服务层                    │
│  ┌───────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ EntryAbility   │  │  GamePage    │  │  Widget   │ │
│  │   (入口)       │  │  (游戏页面)   │  │ (服务卡片) │ │
│  └───────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│          │                 │                │        │
│  ┌───────▼─────────────────▼────────────────▼──────┐ │
│  │            GenesisService (ArkTS 桥接)           │ │
│  └───────────────────────┬─────────────────────────┘ │
├──────────────────────────┼───────────────────────────┤
│                   TypeScript 核心引擎                 │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────┐ │
│  │ MicroGame  │ │  Trigger     │ │ Personalization│ │
│  │  Engine    │ │   Engine     │ │    Engine      │ │
│  └────────────┘ └──────────────┘ └────────────────┘ │
│  ┌────────────────────────────────────────────────┐  │
│  │         10 个游戏模板 (Templates)               │  │
│  │  消除 / 节奏 / 记忆 / 呼吸 / 绘画 / 配色 /    │  │
│  │  口算 / 泡泡 / 文字 / 追光                      │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 1.3 支持的游戏模板

| 游戏 | 类型 | 时长 | 说明 |
|------|------|------|------|
| EliminationGame | PUZZLE | 30s | 经典消除 |
| RhythmTapGame | REACTION | 20s | 节奏点击 |
| MemoryFlipGame | PUZZLE | 45s | 翻牌记忆 |
| BreathingGame | HEALING | 60s | 呼吸引导 |
| DrawingGame | CREATE | 40s | 涂鸦挑战 |
| ColorMatchGame | SENSES | 25s | 色彩匹配 |
| QuickMathGame | PUZZLE | 30s | 速算挑战 |
| BubblePopGame | REACTION | 20s | 泡泡戳破 |
| WordScrambleGame | PUZZLE | 35s | 文字重组 |
| ChaseLightGame | REACTION | 15s | 追光游戏 |

---

## 2. 环境准备

### 2.1 DevEco Studio 安装配置

#### 下载安装

1. 访问 [HarmonyOS 开发者官网](https://developer.harmonyos.com/cn/develop/deveco-studio/) 下载 DevEco Studio 4.0 或更高版本
2. 系统要求：
   - **操作系统**：Windows 10/11 (64-bit)、macOS 12+ 或 Linux (Ubuntu 20.04+)
   - **内存**：建议 16 GB 及以上
   - **磁盘空间**：至少 10 GB 可用空间
3. 安装完成后，首次启动会自动下载 HarmonyOS SDK

#### 初始配置

```bash
# 1. 打开 DevEco Studio → Settings → HarmonyOS SDK
#    确认 SDK 安装路径，默认：
#    Windows: C:\Users\<User>\AppData\Local\Huawei\Sdk
#    macOS:   ~/Library/Huawei/Sdk
#    Linux:   ~/Huawei/Sdk

# 2. 配置 Node.js 路径（DevEco Studio 内置了 Node.js，也可指定自定义路径）
#    Settings → Build, Execution, Deployment → Node.js

# 3. 配置 Ohpm（OpenHarmony Package Manager）
#    DevEco Studio 通常会自动配置，如未配置：
#    Settings → Build, Execution, Deployment → Ohpm
```

### 2.2 HarmonyOS SDK 版本要求

| 组件 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| HarmonyOS SDK | 4.0 (API 10) | 5.0 (API 12) | 元服务开发最低要求 API 10 |
| ArkTS | 4.0 | 最新 | ArkUI 声明式开发范式 |
| Toolchains | 4.0 | 最新 | 编译工具链 |
| Previewer | 4.0 | 最新 | 模拟器预览 |

```bash
# 在 DevEco Studio 中检查/更新 SDK：
# File → Settings → HarmonyOS SDK → 检查更新
```

### 2.3 Node.js / TypeScript 环境

```bash
# 推荐使用 nvm 管理多版本 Node.js
nvm install 18
nvm use 18

# 验证版本
node --version    # v18.x.x
npm --version     # 9.x.x

# 安装 TypeScript 相关工具
npm install -g typescript ts-node

# 验证 TypeScript
tsc --version     # 5.x.x
```

### 2.4 Genesis 项目依赖安装

```bash
cd /root/genesis

# 安装项目依赖
npm install

# 验证安装
npm run build     # 编译 TypeScript → dist/
npm test          # 运行测试套件
```

---

## 3. 项目导入与构建

### 3.1 创建 HarmonyOS 项目

#### 方式一：在 DevEco Studio 中新建项目

1. 打开 DevEco Studio → File → New → Create Project
2. 选择 **"Empty Ability"** 模板（适用于元服务）
3. 填写项目信息：
   - **Project Name**：`GenesisMetaAbility`
   - **Bundle Name**：`com.genesis.microgame`
   - **Save Location**：选择工作目录
   - **Compatible SDK**：API 10+
   - **Language**：ArkTS
4. 点击 **Finish** 创建项目

#### 方式二：从现有项目导入

```bash
# 1. 克隆 Genesis 引擎源码
git clone <repository-url> genesis-engine

# 2. 在 DevEco Studio 中打开项目
# File → Open → 选择 genesis-engine 目录

# 3. DevEco Studio 会自动识别项目结构
# 如果存在 build-profile.json5，直接打开即可
```

### 3.2 TypeScript 引擎集成到 HarmonyOS 项目

Genesis 核心引擎使用纯 TypeScript 编写，通过以下步骤集成到 HarmonyOS 项目：

#### 步骤 1：构建 TypeScript 核心引擎

```bash
cd /root/genesis

# 编译 TypeScript 到 dist/ 目录
npm run build

# 产物结构：
# dist/
# ├── core/
# │   ├── EventEmitter.js
# │   ├── EventEmitter.d.ts
# │   ├── Vector2.js
# │   ├── Vector2.d.ts
# │   ├── GameLoop.js
# │   └── GameLoop.d.ts
# ├── engine/
# ├── models/
# ├── templates/
# ├── triggers/
# └── index.js
```

#### 步骤 2：将编译产物复制到 HarmonyOS 项目

```bash
# 假设 HarmonyOS 项目路径为 /path/to/GenesisMetaAbility

# 复制编译后的 JS 和类型声明到 HarmonyOS 项目的 libs 目录
mkdir -p /path/to/GenesisMetaAbility/entry/src/main/ets/engine/libs
cp -r /root/genesis/dist/* /path/to/GenesisMetaAbility/entry/src/main/ets/engine/libs/
```

#### 步骤 3：复制 HarmonyOS 集成层

```bash
# Genesis 已提供 HarmonyOS 集成代码，位于 src/harmony/ 目录
# 将这些文件复制到 HarmonyOS 项目对应位置

# EntryAbility
cp src/harmony/entryability/EntryAbility.ets \
   /path/to/GenesisMetaAbility/entry/src/main/ets/entryability/

# 游戏页面
cp src/harmony/pages/GamePage.ets \
   /path/to/GenesisMetaAbility/entry/src/main/ets/pages/

# 服务卡片
cp src/harmony/widget/GameWidget.ets \
   /path/to/GenesisMetaAbility/entry/src/main/ets/widget/
```

### 3.3 ArkTS 桥接说明（TypeScript → ArkTS 类型映射）

Genesis 使用纯 TypeScript 编写，运行在 HarmonyOS 时需要注意以下类型映射：

#### 基本类型映射

| TypeScript | ArkTS | 说明 |
|-----------|-------|------|
| `number` | `number` | 直接兼容 |
| `string` | `string` | 直接兼容 |
| `boolean` | `boolean` | 直接兼容 |
| `null` | `null \| undefined` | ArkTS 使用联合类型 |
| `enum` | `enum` | 直接兼容 |
| `interface` | `interface` | 直接兼容 |
| `Record<string, unknown>` | `Record<string, Object>` | ArkTS 中 Object 替代 unknown |
| `Promise<T>` | `Promise<T>` | 直接兼容 |

#### 关键桥接模式

```typescript
// === 1. EventEmitter 适配 ===
// TypeScript 版本（src/core/EventEmitter.ts）
export class EventEmitter {
  private listeners = new Map<string, Set<Function>>();
  // ...
}

// ArkTS 适配：将 Map → plain object（ArkTS 对 Map 支持有限制时）
// Genesis 的 EventEmitter 已使用标准 ES2021，可直接在 ArkTS 运行时使用

// === 2. 泛型与 unknown 处理 ===
// TypeScript:
const value: unknown = data.field;
// ArkTS 中建议使用类型守卫：
const value: Object = data.field as Object;

// === 3. 回调函数类型 ===
// TypeScript:
onEvent(event: string, callback: (data: Record<string, unknown>) => void): () => void
// ArkTS:
onEvent(event: string, callback: (data: Record<string, Object>) => void): () => void
```

#### GenesisService 桥接层

`GenesisService`（`src/harmony/GenesisService.ts`）已设计为纯 TypeScript，不依赖任何浏览器或 Node.js API，可直接在 ArkTS 环境中实例化：

```typescript
// ArkTS 环境中使用（EntryAbility.ets 中）
import { GenesisService } from '../GenesisService';

export default class EntryAbility {
  private genesisService: GenesisService | null = null;

  onCreate(want, launchParam) {
    this.genesisService = new GenesisService();
    this.genesisService.initialize(want.parameters?.userId);
  }
}
```

### 3.4 构建/编译命令

#### TypeScript 核心引擎构建

```bash
# 开发模式（带 sourceMap）
npm run build

# 生产模式（优化构建）
# 修改 tsconfig.json 中 target 为 ES2021，确保产物兼容 HarmonyOS JS 运行时
npx tsc --project tsconfig.json --removeComments --sourceMap false
```

#### HarmonyOS 项目构建（DevEco Studio）

```bash
# 方式一：GUI
# DevEco Studio → Build → Build Hap(s)/App(s)

# 方式二：命令行（hvigorw）
# Debug 构建
./hvigorw --mode module -p product=default assembleHap

# Release 构建
./hvigorw --mode module -p product=default assembleApp
```

#### 构建产物

```
GenesisMetaAbility/
├── entry/
│   └── build/
│       └── default/
│           └── outputs/
│               ├── default/
│               │   └── entry-default-signed.hap    # Debug 签名包
│               └── release/
│                   └── entry-release-signed.hap    # Release 签名包
└── build/
    └── outputs/
        └── releases/
            └── GenesisMetaAbility-signed.app       # 上架发布包
```

---

## 4. 元服务配置

### 4.1 module.json5 配置说明

`module.json5` 是 HarmonyOS 模块的核心配置文件，位于 `entry/src/main/module.json5`。

Genesis 项目的完整配置参考 [`/root/genesis/harmony-config/module.json5`](../harmony-config/module.json5)。

#### 关键配置项说明

```json5
{
  "module": {
    "name": "entry",
    "type": "entry",                    // 入口模块
    "description": "Genesis AI 微游戏引擎",
    "mainElement": "EntryAbility",
    "deviceTypes": [
      "phone",                          // 手机
      "tablet"                          // 平板（可选）
    ],
    "deliveryWithInstall": true,        // 安装时交付
    "installationFree": true,           // 免安装（元服务核心特性）
    "pages": "$profile:main_pages",     // 页面路由配置
    "abilities": [
      {
        "name": "EntryAbility",
        "srcEntry": "./ets/entryability/EntryAbility.ets",
        "description": "Genesis 元服务入口",
        "icon": "$media:icon",
        "label": "$string:EntryAbility_label",
        "startWindowIcon": "$media:startIcon",
        "startWindowBackground": "$color:startWindowBackgroundColor",
        "exported": true,
        "skills": [
          {
            "entities": ["entity.system.home"],
            "actions": ["action.system.home"]
          }
        ],
        "metadata": [
          {
            "name": "ohos.extension.form",   // 服务卡片声明
            "resource": "$profile:form_config"
          }
        ]
      }
    ]
  }
}
```

### 4.2 ServiceExtensionAbility 配置

元服务通过 `ExtensionAbility` 提供服务卡片（Widget）能力：

```json5
// module.json5 中的 extensionAbilities 配置
"extensionAbilities": [
  {
    "name": "GameWidgetAbility",
    "srcEntry": "./ets/widget/GameWidget.ets",
    "description": "Genesis 每日微游戏服务卡片",
    "icon": "$media:icon",
    "label": "$string:widget_label",
    "type": "form",                       // 类型为 form（服务卡片）
    "exported": true,
    "metadata": [
      {
        "name": "ohos.extension.form",
        "resource": "$profile:form_config"
      }
    ]
  }
]
```

### 4.3 服务卡片（Widget）配置

#### form_config.json

```json
{
  "forms": [
    {
      "name": "gameWidget",
      "displayName": "Genesis 每日游戏",
      "description": "查看并直接玩今日微游戏",
      "src": "./ets/widget/GameWidget.ets",
      "uiSyntax": "arkts",
      "window": {
        "designWidth": 720,
        "autoDesignWidth": true
      },
      "colorMode": "dark",
      "isDefault": true,
      "updateEnabled": true,
      "scheduledUpdateTime": "10:30",
      "updateDuration": 1,
      "defaultDimension": "2*2",
      "supportDimensions": [
        "2*2",
        "2*4"
      ],
      "formConfigAbility": "ability://com.genesis.microgame.GameWidgetAbility"
    }
  ]
}
```

#### 卡片尺寸规格

| 尺寸 | 网格 | 设计宽度(px) | 说明 |
|------|------|-------------|------|
| 小卡片 | 2x2 | 360 x 360 | 显示游戏名称 + 分数 + "点击开始" |
| 中卡片 | 2x4 | 360 x 720 | 显示完整游戏预览 + 排行榜入口 |

#### main_pages.json

```json
{
  "src": [
    "pages/GamePage"
  ]
}
```

### 4.4 权限声明

```json5
// module.json5 中的 requestPermissions
"requestPermissions": [
  {
    "name": "ohos.permission.INTERNET",
    "reason": "$string:permission_internet_reason",
    "usedScene": {
      "abilities": ["EntryAbility"],
      "when": "inuse"
    }
  },
  {
    "name": "ohos.permission.GET_NETWORK_INFO",
    "reason": "$string:permission_network_reason",
    "usedScene": {
      "abilities": ["EntryAbility"],
      "when": "inuse"
    }
  },
  {
    "name": "ohos.permission.GET_BATTERY_INFO",
    "reason": "$string:permission_battery_reason",
    "usedScene": {
      "abilities": ["EntryAbility"],
      "when": "inuse"
    }
  },
  {
    "name": "ohos.permission.LOCATION",
    "reason": "$string:permission_location_reason",
    "usedScene": {
      "abilities": ["EntryAbility"],
      "when": "inuse"
    }
  },
  {
    "name": "ohos.permission.APPROXIMATELY_LOCATION",
    "reason": "$string:permission_location_reason",
    "usedScene": {
      "abilities": ["EntryAbility"],
      "when": "inuse"
    }
  }
]
```

> **注意**：`LOCATION` 和 `APPROXIMATELY_LOCATION` 属于用户授权类权限，需要在代码中通过 `abilityAccessCtrl` 动态申请。Genesis 引擎的 `ITriggerContext` 中 `currentLocation` 和 `weatherCondition` 字段依赖位置信息。

---

## 5. 调试与测试

### 5.1 本地模拟器调试

#### 创建模拟器

1. 打开 DevEco Studio → Tools → Device Manager
2. 点击 **"New Emulator"**
3. 选择设备类型（推荐 **Phone** → **P50 Pro** 或更新）
4. 选择系统镜像（API 10+，推荐 API 12）
5. 点击 **"Finish"** 创建

#### 运行调试

```bash
# 方式一：DevEco Studio GUI
# 1. 选择模拟器设备
# 2. 点击 Run 按钮（Shift + F10）
# 3. 或点击 Debug 按钮（Shift + F9）支持断点调试

# 方式二：命令行
# 启动模拟器后，通过 hdc（HarmonyOS Device Connector）连接
hdc list targets
hdc install entry/build/default/outputs/default/entry-default-signed.hap
hdc shell aa start -a EntryAbility -b com.genesis.microgame
```

#### 日志查看

```bash
# DevEco Studio HiLog 面板
# 过滤 Genesis 标签：
# Tag: Genesis

# 命令行方式
hdc hilog | grep "Genesis"
```

### 5.2 真机调试

#### 准备工作

1. **注册开发者账号**：在 [HarmonyOS 开发者联盟](https://developer.harmonyos.com/) 注册并完成实名认证
2. **创建应用**：在 AGC (AppGallery Connect) 中创建应用，获取 Bundle ID
3. **生成调试证书**：
   ```bash
   # DevEco Studio → Build → Generate Key and CSR
   # 或使用 OpenSSL：
   openssl genrsa -out genesis_debug.key 2048
   openssl req -new -key genesis_debug.key -out genesis_debug.csr
   ```
4. **注册调试设备**：在 AGC 中添加设备 UDID
   ```bash
   # 获取设备 UDID
   hdc shell bm get -u did
   ```

#### 连接真机

```bash
# 1. 开启设备开发者模式
#    设置 → 关于手机 → 连续点击版本号 7 次
#    设置 → 系统与更新 → 开发者选项 → USB 调试 → 开启

# 2. USB 连接设备
hdc list targets

# 3. 安装运行
hdc install entry/build/default/outputs/default/entry-default-signed.hap
hdc shell aa start -a EntryAbility -b com.genesis.microgame
```

### 5.3 测试框架配置

#### TypeScript 核心引擎测试（Jest）

Genesis 核心引擎使用 Jest 进行单元测试，已有完整配置：

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npx jest src/engine/MicroGameEngine.test.ts

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npx jest --coverage --coverageReporters=text --coverageReporters=lcov
```

**覆盖率阈值**（已在 `jest.config.js` 中配置）：

| 指标 | 阈值 |
|------|------|
| 分支覆盖率 | 70% |
| 函数覆盖率 | 80% |
| 行覆盖率 | 80% |
| 语句覆盖率 | 80% |

#### HarmonyOS 测试

HarmonyOS 提供 `@ohos/hypium` 测试框架，用于 ArkTS 层的单元测试和 UI 测试：

```typescript
// 示例：GenesisService HarmonyOS 测试
// 文件路径：entry/src/ohosTest/ets/test/GenesisServiceTest.test.ets

import { describe, it, expect } from '@ohos/hypium';
import { GenesisService } from '../../../main/ets/engine/GenesisService';

export default function genesisServiceTest() {
  describe('GenesisService', () => {
    it('should initialize successfully', () => {
      const service = new GenesisService();
      service.initialize('test-user');
      const profile = service.getUserProfile();
      expect(profile).not.toBeNull();
      expect(profile.userId).toEqual('test-user');
    });

    it('should generate micro-game on demand', () => {
      const service = new GenesisService();
      service.initialize('test-user');
      const game = service.generateMicroGame();
      expect(game).not.toBeNull();
      expect(game.config).not.toBeNull();
    });

    it('should return widget data', () => {
      const service = new GenesisService();
      service.initialize('test-user');
      const widgetData = service.getWidgetData();
      expect(widgetData).not.toBeNull();
      expect(widgetData.hasActiveGame).toEqual(false);
    });
  });
}
```

#### 运行 HarmonyOS 测试

```bash
# DevEco Studio 中：
# 右键测试文件 → Run Tests

# 命令行：
./hvigorw --mode module -p product=default -p module=entry@ohosTest assembleHap
hdc install entry/build/default/outputs/ohosTest/entry-ohosTest-signed.hap
hdc shell aa start -a OpenHarmonyTestRunner -b com.genesis.microgame
```

---

## 6. 发布流程

### 6.1 AGC (AppGallery Connect) 配置

#### 创建项目与应用

1. 登录 [AGC 控制台](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html)
2. 点击 **"我的项目"** → **"创建项目"**
3. 填写项目名称：`Genesis AI Micro-Game`
4. 在项目中 **添加应用**：
   - **应用类型**：元服务（元服务）
   - **应用名称**：Genesis AI 微游戏
   - **Bundle ID**：`com.genesis.microgame`
   - **应用图标**：512x512 PNG

#### 启用服务

在 AGC 控制台启用以下服务：

| 服务 | 用途 | 是否必须 |
|------|------|---------|
| App Linking | 深度链接 | 可选 |
| Analytics Kit | 用户行为分析 | 推荐 |
| Crash Kit | 崩溃收集 | 推荐 |
| Performance Kit | 性能监控 | 推荐 |
| Push Kit | 推送通知 | 推荐 |
| APM | 应用性能管理 | 推荐 |

### 6.2 应用签名

#### 生成发布证书

```bash
# 1. 生成密钥对（如果还没有）
keytool -genkeypair \
  -alias genesis_release \
  -keyalg RSA \
  -keysize 2048 \
  -keystore genesis_release.p12 \
  -storepass <your_password> \
  -keypass <your_password> \
  -validity 25

# 2. 生成 CSR（证书签名请求）
keytool -certreq \
  -alias genesis_release \
  -keystore genesis_release.p12 \
  -file genesis_release.csr

# 3. 在 AGC 控制台上传 CSR，下载发布证书
#    AGC → 我的项目 → 项目设置 → 通用 → 证书管理 → 新增证书

# 4. 下载发布 Profile（.p7b 文件）
#    AGC → 我的项目 → 项目设置 → 通用 → Profile管理 → 新增
```

#### 配置签名信息

```json5
// build-profile.json5（HarmonyOS 项目根目录）
{
  "app": {
    "signingConfigs": [
      {
        "name": "release",
        "type": "HarmonyOS",
        "material": {
          "certpath": "certs/release.cer",
          "storeFile": "certs/genesis_release.p12",
          "storePassword": "<encrypted_password>",
          "keyAlias": "genesis_release",
          "keyPassword": "<encrypted_password>",
          "profile": "certs/release.p7b",
          "signAlg": "SHA256withECDSA",
          "storeType": "PKCS12"
        }
      }
    ],
    "products": [
      {
        "name": "release",
        "signingConfig": "release",
        "compatibleSdkVersion": "4.0.0(10)",
        "runtimeOS": "HarmonyOS"
      }
    ]
  }
}
```

### 6.3 版本管理

#### 版本号规范

```
格式：{major}.{minor}.{patch}[-{stage}]
示例：1.0.0, 1.1.0-beta, 2.0.0-rc1

规则：
- major：重大架构变更或新的游戏模板系列
- minor：新增游戏模板、新功能、新触发器
- patch：Bug 修复、性能优化、UI 微调
- stage：alpha（内部测试）→ beta（公测）→ rc（发布候选）→ 无后缀（正式发布）
```

#### module.json5 中的版本配置

```json5
{
  "app": {
    "bundleName": "com.genesis.microgame",
    "vendor": "genesis",
    "versionCode": 1000000,    // 整数版本号，每次递增
    "versionName": "1.0.0",    // 用户可见版本号
    "icon": "$media:app_icon",
    "label": "$string:app_name"
  }
}
```

### 6.4 提审发布步骤

#### 构建发布包

```bash
# 1. 确保 TypeScript 核心引擎已编译
cd /root/genesis && npm run build && npm test

# 2. 在 DevEco Studio 中构建 Release App
# Build → Build App(s)

# 或命令行：
./hvigorw --mode project -p product=release assembleApp

# 3. 产物位于：
# buildoutputs/releases/GenesisMetaAbility-signed.app
```

#### 上传发布

1. 登录 [AGC 控制台](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html)
2. 选择应用 → **版本信息** → **软件版本** → **上传软件包**
3. 上传 `.app` 文件
4. 填写版本信息：
   - **版本号**：与 `versionName` 一致
   - **更新说明**：本次版本更新内容
   - **发布范围**：全量 / 灰度

#### 提交审核

1. 填写应用信息：
   - 应用名称、图标、截图
   - 应用描述（建议突出 AI 个性化推荐特色）
   - 应用类别选择：**游戏 → 休闲益智**
   - 隐私政策 URL
   - 应用权限说明

2. 内容分级：
   - 按照 IARC 分级标准填写
   - Genesis 微游戏适合 **3+** 年龄段

3. 提交审核：
   - 审核周期通常 1-3 个工作日
   - 元服务审核会额外检查免安装运行能力

### 6.5 元服务上架 Game Center 的特殊要求

华为游戏中心对元服务有额外审核标准：

#### 必须满足

| 要求 | 说明 | Genesis 适配 |
|------|------|-------------|
| 免安装运行 | 元服务必须支持免安装即用 | `installationFree: true` 已配置 |
| 服务卡片支持 | 至少提供一种尺寸的服务卡片 | 已支持 2x2 和 2x4 |
| 游戏健康提示 | 游戏内需有防沉迷提示 | 在 GamePage 中添加健康提示 |
| 隐私合规 | 收集用户数据需明示并获取同意 | 需实现隐私弹窗 |
| 性能要求 | 冷启动 < 2s，卡片加载 < 1s | 需进行性能优化 |
| 离线可用 | 至少支持基本离线功能 | TypeScript 引擎纯本地运行 |

#### 推荐满足

| 要求 | 说明 | Genesis 适配 |
|------|------|-------------|
| 游戏成就系统 | 接入 Game Center 成就 API | 可通过 `IGameResult` 扩展 |
| 排行榜 | 接入 Game Center 排行榜 | 需添加排行榜页面 |
| 游戏存档 | 云端存档支持 | 可通过 AGC Cloud DB |
| 内容分级 | 适龄提示 | 建议添加 |

#### 游戏中心接入代码

```typescript
// 接入华为游戏中心服务（需在 module.json5 添加依赖）
import gameService from '@ohos.gameService';

// 初始化游戏服务
async function initGameService(): Promise<void> {
  try {
    await gameService.init({
      appId: 'your_app_id',
      isDebug: false,
    });
    console.info('[Genesis] Game Service initialized');
  } catch (error) {
    console.error('[Genesis] Game Service init failed:', error);
  }
}

// 提交成绩到排行榜
async function submitScore(score: number, gameId: string): Promise<void> {
  try {
    await gameService.submitScore({
      leaderboardId: `genesis_${gameId}`,
      score: score,
    });
  } catch (error) {
    console.error('[Genesis] Submit score failed:', error);
  }
}

// 解锁成就
async function unlockAchievement(achievementId: string): Promise<void> {
  try {
    await gameService.revealAchievement({
      achievementId: achievementId,
    });
  } catch (error) {
    console.error('[Genesis] Unlock achievement failed:', error);
  }
}
```

---

## 7. CI/CD 配置

### 7.1 GitHub Actions 工作流

完整的 GitHub Actions 配置文件位于 `.github/workflows/build.yml`：

```yaml
# .github/workflows/build.yml
name: Genesis CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm test -- --coverage

      - name: Upload coverage report
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 30

      - name: Build TypeScript
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: genesis-dist
          path: dist/
          retention-days: 30

      - name: Check coverage thresholds
        run: |
          npm test -- --coverage --coverageReporters=text-summary 2>&1 | tee coverage-output.txt
          echo "Coverage check passed!"
```

> 完整的 workflow 文件已创建在 `/root/genesis/.github/workflows/build.yml`。

### 7.2 自动化测试

#### 测试分层

```
Level 1: TypeScript 单元测试 (Jest)
├── src/core/*.test.ts         → 核心工具类
├── src/engine/*.test.ts       → 引擎逻辑
├── src/models/*.test.ts       → 数据模型
├── src/templates/*.test.ts    → 游戏模板
└── src/harmony/*.test.ts      → HarmonyOS 集成层

Level 2: HarmonyOS 集成测试 (@ohos/hypium)
├── EntryAbility 生命周期测试
├── GenesisService 桥接测试
└── Widget 数据绑定测试

Level 3: E2E 测试 (DevEco Studio UiTest)
├── 游戏启动流程
├── 触控交互
└── 卡片跳转
```

#### 测试脚本

```bash
# package.json 中添加
{
  "scripts": {
    "test": "jest --verbose --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --coverageReporters=text-lcov | coveralls",
    "test:harmony": "echo 'Run in DevEco Studio with hvigorw'"
  }
}
```

### 7.3 自动化构建

#### 多环境构建

```yaml
# 构建矩阵示例
strategy:
  matrix:
    environment: [debug, release]
    include:
      - environment: debug
        build_command: npm run build
        output_dir: dist/
      - environment: release
        build_command: npm run build -- --removeComments --sourceMap false
        output_dir: dist/
```

### 7.4 自动发布到 AGC

```yaml
# 发布作业（仅 main 分支触发）
  deploy:
    needs: test-and-build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: genesis-dist

      - name: Package for HarmonyOS
        run: |
          mkdir -p release-package
          cp -r dist/ release-package/
          tar -czf genesis-engine-${{ github.sha }}.tar.gz -C release-package .

      - name: Upload to AGC
        env:
          AGC_CLIENT_ID: ${{ secrets.AGC_CLIENT_ID }}
          AGC_CLIENT_SECRET: ${{ secrets.AGC_CLIENT_SECRET }}
        run: |
          # 使用 AGC Publishing API 上传软件包
          # 详细 API 文档：https://developer.huawei.com/consumer/cn/doc/development/AppGallery-connect-References/agcapi-upload-package-0000001914978900
          echo "Uploading to AGC..."
          # curl -X POST "https://connect-api.cloud.huawei.com/api/publish/v2/app/{appId}/package" \
          #   -H "Authorization: Bearer ${AGC_TOKEN}" \
          #   -F "file=@genesis-engine-${{ github.sha }}.tar.gz"
```

---

## 8. 监控与运维

### 8.1 性能监控

#### 使用 AGC Performance Kit

```typescript
// 初始化性能监控
import perf from '@ohos.performance';

// 自定义性能指标
function measureGameGeneration(): void {
  const trace = perf.startTrace('game_generation');
  
  const game = genesisService.generateMicroGame();
  
  trace.putMetric('game_type', game?.config.type ?? 'unknown');
  trace.putMetric('difficulty', String(game?.config.difficulty ?? 0));
  trace.stop();
}

// 关键指标监控
const PERF_METRICS = {
  COLD_START: 'cold_start_ms',          // 冷启动时间（目标 < 2000ms）
  WARM_START: 'warm_start_ms',          // 热启动时间（目标 < 500ms）
  GAME_GENERATION: 'game_gen_ms',       // 游戏生成时间（目标 < 100ms）
  GAME_RENDER_FIRST: 'first_frame_ms',  // 首帧渲染时间（目标 < 500ms）
  WIDGET_LOAD: 'widget_load_ms',        // 卡片加载时间（目标 < 1000ms）
  GAME_SESSION: 'game_session_ms',      // 游戏会话时长
  SCORE_SUBMIT: 'score_submit_ms',      // 分数提交时间
};
```

#### 自定义性能监控埋点

```typescript
// src/core/PerformanceMonitor.ts（建议新增）
export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  static startMark(label: string): void {
    PerformanceMonitor.marks.set(label, performance.now());
  }

  static endMark(label: string): number {
    const start = PerformanceMonitor.marks.get(label) ?? 0;
    const duration = performance.now() - start;
    PerformanceMonitor.marks.delete(label);
    
    // 上报到 AGC
    console.info(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }
}
```

### 8.2 崩溃收集

#### 使用 AGC Crash Kit

```typescript
// 初始化崩溃收集
import crash from '@ohos.crash';

// 在 EntryAbility.onCreate 中初始化
export default class EntryAbility {
  onCreate(want, launchParam) {
    // 启用崩溃收集
    crash.init({
      collectLogs: true,
      reportOnCatch: true,
    });
    
    // 设置用户标识
    crash.setUserId('genesis_user_' + want.parameters?.userId ?? 'anonymous');
    
    // 自定义键值对（用于崩溃分析）
    crash.setCustomKey('engine_version', '0.1.0');
    crash.setCustomKey('game_templates', '10');
  }
}
```

#### 自定义错误边界

```typescript
// 全局异常处理
try {
  ErrorManager.on('error', (error) => {
    console.error('[Genesis] Uncaught error:', error.message);
    // 上报自定义错误信息
    crash.recordError({
      message: error.message,
      stack: error.stack,
      extra: {
        engineState: genesisService?.getActiveGame()?.state ?? 'none',
        userProfile: genesisService?.getUserProfile()?.userId ?? 'unknown',
      },
    });
  });
} catch (e) {
  console.error('[Genesis] Failed to setup error handler:', e);
}
```

### 8.3 用户行为分析

#### 使用 AGC Analytics Kit

```typescript
// 初始化分析服务
import analytics from '@ohos.analytics';

// 定义事件枚举
enum GenesisAnalyticsEvent {
  GAME_TRIGGERED = 'game_triggered',       // 游戏被触发
  GAME_STARTED = 'game_started',           // 游戏开始
  GAME_COMPLETED = 'game_completed',       // 游戏完成
  GAME_FAILED = 'game_failed',             // 游戏失败
  GAME_ABANDONED = 'game_abandoned',       // 游戏放弃（中途退出）
  WIDGET_TAPPED = 'widget_tapped',         // 卡片点击
  WIDGET_REFRESHED = 'widget_refreshed',   // 卡片刷新
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked', // 成就解锁
  SCORE_SHARED = 'score_shared',           // 分数分享
  DAILY_RETURN = 'daily_return',           // 每日回归
}

// 埋点封装
class GenesisAnalytics {
  static logGameStarted(gameType: string, difficulty: number): void {
    analytics.onEvent({
      eventId: GenesisAnalyticsEvent.GAME_STARTED,
      params: {
        game_type: gameType,
        difficulty: difficulty,
        timestamp: Date.now(),
      },
    });
  }

  static logGameCompleted(gameType: string, score: number, duration: number): void {
    analytics.onEvent({
      eventId: GenesisAnalyticsEvent.GAME_COMPLETED,
      params: {
        game_type: gameType,
        score: score,
        duration_sec: duration,
        timestamp: Date.now(),
      },
    });
  }

  static logWidgetInteraction(action: string): void {
    analytics.onEvent({
      eventId: GenesisAnalyticsEvent.WIDGET_TAPPED,
      params: {
        action: action,
        timestamp: Date.now(),
      },
    });
  }

  // 设置用户属性
  static setUserProfile(profile: IUserProfile): void {
    analytics.setUserProfile('preferred_difficulty', String(profile.preferredDifficulty));
    analytics.setUserProfile('total_games', String(profile.totalGamesPlayed));
    analytics.setUserProfile('avg_session_duration', String(profile.averageSessionDuration));
  }
}
```

#### 关键分析指标

| 指标 | 计算方式 | 目标值 |
|------|---------|--------|
| DAU (日活) | 每日启动元服务的用户数 | 持续增长 |
| 游戏完成率 | 完成次数 / 开始次数 | > 80% |
| 平均会话时长 | 游戏时长均值 | 30-45 秒 |
| 卡片点击率 | 卡片点击 / 卡片展示 | > 5% |
| 次日留存率 | 次日回访 / 新增用户 | > 30% |
| 7 日留存率 | 7 日回访 / 新增用户 | > 15% |
| NPS | 推荐意愿评分 | > 40 |

### 8.4 热更新策略

由于 HarmonyOS 元服务的特殊性，热更新采用 **配置驱动 + 云端参数** 的方式：

#### 可热更新的内容

| 内容 | 方式 | 说明 |
|------|------|------|
| 触发规则参数 | AGC Remote Config | 调整触发频率、优先级 |
| 难度系数 | AGC Remote Config | 调整各难度级别的参数 |
| 游戏权重 | AGC Remote Config | 调整各游戏模板的出现概率 |
| 主题配色 | AGC Cloud DB | 更新游戏配色方案 |
| 文案内容 | AGC Remote Config | 更新提示语、游戏名称 |

#### 不可热更新的内容（需发版）

- 新增游戏模板
- 引擎核心逻辑修改
- ArkTS UI 代码变更
- 权限变更

#### Remote Config 实现

```typescript
// 使用 AGC Remote Configuration
import remoteConfig from '@ohos.remoteConfig';

interface GenesisRemoteConfig {
  triggerCooldown: number;        // 触发冷却时间（秒）
  maxDailyGames: number;          // 每日最大游戏数
  difficultyMultiplier: number;   // 难度系数
  gameWeights: Record<string, number>; // 游戏权重
  enableNewGames: boolean;        // 是否启用新游戏
}

async function fetchRemoteConfig(): Promise<GenesisRemoteConfig> {
  try {
    await remoteConfig.fetchAndApply();
    
    return {
      triggerCooldown: remoteConfig.getValueAsNumber('trigger_cooldown', 300),
      maxDailyGames: remoteConfig.getValueAsNumber('max_daily_games', 20),
      difficultyMultiplier: remoteConfig.getValueAsNumber('difficulty_multiplier', 1.0),
      gameWeights: JSON.parse(
        remoteConfig.getValueAsString('game_weights', '{}')
      ),
      enableNewGames: remoteConfig.getValueAsBoolean('enable_new_games', false),
    };
  } catch (error) {
    console.warn('[Genesis] Remote config fetch failed, using defaults:', error);
    return getDefaultConfig();
  }
}

// 应用远程配置到引擎
function applyRemoteConfig(
  service: GenesisService,
  config: GenesisRemoteConfig
): void {
  service.updateUserProfile({
    // 根据远程配置调整用户偏好
  });
  console.info('[Genesis] Remote config applied');
}
```

#### 版本灰度发布策略

```yaml
# 灰度发布配置建议
灰度策略:
  阶段1:
    范围: 1% 用户
    时长: 24 小时
    监控: 崩溃率、ANR 率、游戏完成率
  
  阶段2:
    范围: 5% 用户
    时长: 48 小时
    监控: 同上 + 用户反馈评分
  
  阶段3:
    范围: 20% 用户
    时长: 72 小时
    监控: 同上 + 性能指标对比
  
  阶段4:
    范围: 100% 全量发布
    回滚条件: 崩溃率 > 1% 或 完成率下降 > 10%
```

---

## 附录

### A. 常见问题排查

#### Q1: TypeScript 编译报错 `Cannot find module`

```bash
# 确保 node_modules 已安装
npm install

# 清除缓存重新编译
rm -rf dist/ node_modules/.cache
npm run build
```

#### Q2: DevEco Studio 构建失败 `hvigor build error`

```bash
# 清除构建缓存
./hvigorw clean

# 检查 SDK 版本
# File → Settings → HarmonyOS SDK → 确保版本 >= 4.0

# 重新构建
./hvigorw --mode module -p product=default assembleHap
```

#### Q3: 元服务审核被拒 — "免安装运行失败"

```bash
# 检查 module.json5 配置
# 确认：
# 1. "installationFree": true
# 2. "deliveryWithInstall": true
# 3. HAP 包大小 < 10MB（元服务限制）

# 检查包大小
ls -lh entry/build/default/outputs/default/entry-default-signed.hap
```

#### Q4: 服务卡片不显示

```bash
# 1. 检查 form_config.json 是否存在
ls entry/src/main/resources/base/profile/form_config.json

# 2. 检查 module.json5 中 metadata 是否配置
# 3. 检查 Widget 代码语法是否正确（ArkTS 严格模式）
# 4. 查看 HiLog 日志
hdc hilog | grep "FormExt"
```

### B. 有用的链接

| 资源 | 链接 |
|------|------|
| HarmonyOS 开发者文档 | https://developer.harmonyos.com/cn/docs/documentation/doc-guides/start-overview-0000001478061421 |
| ArkTS 语言规范 | https://developer.harmonyos.com/cn/docs/documentation/doc-guides/arkts-get-started-0000001504769321 |
| 元服务开发指南 | https://developer.harmonyos.com/cn/docs/documentation/doc-guides/atomic-service-overview-0000001478061405 |
| AGC 控制台 | https://developer.huawei.com/consumer/cn/service/josp/agc/index.html |
| DevEco Studio 下载 | https://developer.harmonyos.com/cn/develop/deveco-studio/ |
| 华为游戏中心接入 | https://developer.huawei.com/consumer/cn/hms/huawei-game-service/ |
| Game Server API | https://developer.huawei.com/consumer/cn/doc/HMSCore-Guides/android-game-server-development-0000001050198850 |

### C. 项目目录结构参考

```
/root/genesis/
├── docs/
│   └── DEPLOYMENT.md              # 本文档
├── src/
│   ├── core/                      # 核心工具类
│   │   ├── EventEmitter.ts
│   │   ├── EventEmitter.test.ts
│   │   ├── GameLoop.ts
│   │   ├── GameLoop.test.ts
│   │   ├── Vector2.ts
│   │   └── Vector2.test.ts
│   ├── engine/                    # 核心引擎
│   │   ├── MicroGameEngine.ts
│   │   ├── MicroGameEngine.test.ts
│   │   ├── TemplateFactory.ts
│   │   ├── TriggerEngine.ts
│   │   ├── TriggerEngine.test.ts
│   │   ├── PersonalizationEngine.ts
│   │   ├── PersonalizationEngine.test.ts
│   │   └── index.ts
│   ├── models/                    # 数据模型
│   │   ├── types.ts
│   │   ├── TriggerContext.ts
│   │   ├── UserProfile.ts
│   │   └── Models.test.ts
│   ├── templates/                 # 10 个游戏模板
│   │   ├── BaseGameTemplate.ts
│   │   ├── EliminationGame.ts
│   │   ├── RhythmTapGame.ts
│   │   ├── MemoryFlipGame.ts
│   │   ├── BreathingGame.ts
│   │   ├── DrawingGame.ts
│   │   ├── ColorMatchGame.ts
│   │   ├── QuickMathGame.ts
│   │   ├── BubblePopGame.ts
│   │   ├── WordScrambleGame.ts
│   │   ├── ChaseLightGame.ts
│   │   ├── Templates.test.ts
│   │   └── TemplatesDeep.test.ts
│   ├── triggers/                  # 触发器
│   │   └── BuiltInTriggers.ts
│   ├── harmony/                   # HarmonyOS 集成层
│   │   ├── GenesisService.ts      # 元服务核心服务
│   │   ├── GenesisService.test.ts
│   │   ├── entryability/
│   │   │   └── EntryAbility.ets   # 入口 Ability
│   │   ├── pages/
│   │   │   └── GamePage.ets       # 游戏 UI 页面
│   │   └── widget/
│   │       └── GameWidget.ets     # 服务卡片
│   ├── index.ts                   # 引擎入口
│   └── demo.ts                    # 演示代码
├── harmony-config/                # HarmonyOS 配置参考
│   └── module.json5               # 模块配置
├── .github/
│   └── workflows/
│       └── build.yml              # CI/CD 工作流
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

> **文档版本**：1.0.0  
> **最后更新**：2026-06-01  
> **维护团队**：Genesis Engine Team
