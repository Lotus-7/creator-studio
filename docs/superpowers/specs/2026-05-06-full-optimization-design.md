# Creator Studio 全面优化设计文档

日期：2026-05-06

## 概述

对 Creator Studio（Tauri 2 + React + Rust 桌面应用）进行全面优化，涵盖架构升级、视觉重设计、新功能开发、代码清理。

### 决策记录

- **架构方案**：方案 B — 架构升级（引入 Zustand + CSS Variables + 组件化）
- **视觉风格**：温暖创作者风（Craft/Ghost 风格），不做暗黑模式
- **风格库功能**：创作者角色管理（名称、人设、风格标签、绑定提供商）
- **历史记录**：本地 SQLite 持久化，支持搜索和筛选
- **图标**：不使用 emoji 图标，保持纯文字标签

---

## 一、前端架构

### 目录结构

```
src/
  stores/
    useAppStore.ts          ← Zustand 全局状态
  hooks/
    useGenerator.ts         ← 内容生成逻辑
    useProviders.ts         ← 提供商管理逻辑
    useHistory.ts           ← 历史记录查询
    usePersonas.ts          ← 角色管理逻辑
  components/
    Layout/
      Sidebar.tsx           ← 左侧标签导航
      MainContent.tsx       ← 右侧内容区
    Create/
      IdeaInput.tsx         ← 想法输入区
      GenerateActions.tsx   ← 4个生成按钮
      ResultDisplay.tsx     ← 结果展示 + 复制
      PersonaSelector.tsx   ← 角色选择器
    History/
      HistoryList.tsx       ← 历史列表 + 搜索
      HistoryItem.tsx       ← 单条历史卡片
    Personas/
      PersonaList.tsx       ← 角色列表
      PersonaEditor.tsx     ← 角色编辑器
    Settings/
      ProviderCard.tsx      ← 提供商配置卡片
      ProviderForm.tsx      ← API Key/Model 表单
      AboutSection.tsx      ← 关于信息
    common/
      Button.tsx            ← 通用按钮
      Toast.tsx             ← 通知提示
      LoadingSpinner.tsx    ← 加载动画
      Modal.tsx             ← 模态框
  types/
    index.ts                ← 所有 TS 类型定义
  styles/
    variables.css           ← CSS 变量主题
    global.css              ← 全局基础样式
    components.css          ← 组件样式
  main.tsx                  ← 入口
  App.tsx                   ← 顶层组件（精简为 Layout 壳）
```

### 状态管理

Zustand store 管理以下状态：

- `activeTab` — 当前标签页
- `currentPersona` — 当前选中的创作角色
- `providers` — AI 提供商配置列表
- `defaultProvider` — 默认提供商
- `history` — 历史记录（从 SQLite 加载）
- `personas` — 创作角色列表
- `loading` — 生成中状态
- `result` — 当前生成结果

### 数据流

```
React Component → Zustand Store → Custom Hook → Tauri invoke() → Rust 后端 → creator CLI
```

UI 事件 → Store 更新 → Hook 调用 Tauri → Rust 处理 → 返回结果 → Store 更新 → UI 重渲染

---

## 二、视觉风格

### CSS 变量体系

```css
:root {
  /* 主色 */
  --color-primary: #b07848;
  --color-primary-hover: #9a6838;
  --color-primary-light: #f5ede3;

  /* 背景 */
  --color-bg: #faf6f1;
  --color-surface: #ffffff;
  --color-surface-warm: #f5ede3;

  /* 边框与分割 */
  --color-border: #ede4d6;
  --color-border-light: #f0e8dc;

  /* 文字 */
  --color-text: #3a2e24;
  --color-text-secondary: #8a7a6a;
  --color-text-muted: #b8a898;

  /* 字体 */
  --font-display: 'Georgia', 'Noto Serif SC', serif;
  --font-body: -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif;

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(139, 109, 74, 0.06);
  --shadow-md: 0 2px 8px rgba(139, 109, 74, 0.08);
  --shadow-lg: 0 4px 16px rgba(139, 109, 74, 0.1);
}
```

### 设计特征

- Tab 栏：胶囊式分段控件，温暖底色 `#f5ede3`，选中项 `#b07848` 白字
- 纯文字标签，不使用 emoji 图标
- 按钮：圆角 10px，温暖棕色调（`#b07848` / `#c9956a` / `#d4a878` / `#debb94`）
- 输入框：奶油底 `#faf6f1`，虚线边框
- 卡片：白色背景，`#ede4d6` 边框，温暖阴影
- 衬线体用于标题展示，无衬线体用于正文 UI

---

## 三、创作者角色管理

### 数据模型

```rust
struct Persona {
    id: String,           // UUID
    name: String,         // 角色名称
    description: String,  // 人设描述
    style_tags: Vec<String>, // 写作风格标签
    provider_id: String,  // 绑定的 AI 提供商 ID
    created_at: String,
    updated_at: String,
}
```

### UI 设计

**角色列表（Personas tab）：**
- 每个角色显示为卡片：名称、风格描述、绑定的提供商和模型
- 选中角色左侧有棕色竖条指示
- 底部有「新建角色」按钮（虚线边框）

**角色编辑器（侧面板或弹窗）：**
- 角色名称（文本输入）
- 人设描述（多行文本）
- 写作风格标签（标签选择器，支持自定义）
- 绑定 AI 提供商（下拉选择已有的提供商配置）
- 保存 / 取消按钮

**创作页集成：**
- 创作页顶部增加角色选择器（下拉或胶囊选择）
- 选择角色后，`generate_content` 命令传入 `persona_id`
- Rust 端将角色的人设和风格信息拼接到 creator CLI 的参数中

### Tauri 命令

- `get_personas() → Vec<Persona>`
- `save_persona(persona: Persona)`
- `delete_persona(id: String)`
- `generate_content(idea, type, persona_id: Option<String>)` — 增强版

---

## 四、历史记录持久化

### SQLite 数据库

位置：`~/.creator/history.db`

### 表结构

```sql
CREATE TABLE history (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,         -- topic | outline | draft | title
    idea TEXT NOT NULL,
    result TEXT NOT NULL,
    persona_id TEXT,
    provider TEXT,
    model TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE personas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    style_tags TEXT,            -- JSON array
    provider_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### UI 设计

**历史页（History tab）：**
- 顶部：搜索框 + 类型筛选胶囊（全部/选题/大纲/初稿/标题）
- 时间线式列表：左侧竖线连接，每条显示类型标签、标题、内容摘要、时间
- 点击条目展开完整内容
- 支持删除单条 / 清空全部

### Tauri 命令

- `get_history(filters: HistoryFilters) → Vec<History>`
- `search_history(query: String) → Vec<History>`
- `delete_history(id: String)`
- `clear_history()`

---

## 五、Rust 后端重构

### 新增依赖

```toml
[dependencies]
rusqlite = { version = "0.32", features = ["bundled"] }
chrono = "0.4"
uuid = { version = "1", features = ["v4"] }
```

### 模块拆分

```
src-tauri/src/
  main.rs          ← 入口
  lib.rs           ← Tauri 注册（精简）
  models.rs        ← 数据结构（History, Persona, Provider）
  db.rs            ← SQLite 初始化与连接管理
  commands/
    mod.rs         ← 模块导出
    settings.rs    ← get_settings, save_provider, set_default_provider, test_connection
    generate.rs    ← generate_content（增强版，支持 persona）
    history.rs     ← get_history, search_history, delete_history, clear_history
    personas.rs    ← get_personas, save_persona, delete_persona
```

### 数据库初始化

应用启动时在 `lib.rs` 的 `setup` 钩子中初始化 SQLite：
- 检查 `~/.creator/history.db` 是否存在
- 不存在则创建并执行建表 SQL
- 使用 `Tauri State` 管理 DB 连接

---

## 六、清理与修复

### 删除

- `server.js` — 遗留 Express 后端，Tauri 架构下无用
- `public/vite.svg` — Vite 默认图标
- `public/tauri.svg` — Tauri 默认图标
- `src/assets/react.svg` — React 默认图标

### 修复

- `index.html` title → "Creator Studio"
- `package.json` version → "0.2.0"
- `Cargo.toml` version → "0.2.0"
- `tauri.conf.json` version → "0.2.0"
- `tauri.conf.json` CSP → 配置合理的安全策略
- `README.md` → 写实际项目介绍

---

## 七、实施顺序

1. **阶段一：基础架构** — 组件拆分、Zustand store、CSS 变量体系、清理死代码
2. **阶段二：视觉重设计** — 新样式应用到所有组件
3. **阶段三：Rust 后端重构** — 模块拆分、SQLite 集成、数据库初始化
4. **阶段四：历史记录** — SQLite 表、CRUD 命令、历史页 UI
5. **阶段五：角色管理** — Persona 表、CRUD 命令、角色页 UI、创作页集成
6. **阶段六：收尾** — 版本号统一、CSP 修复、README、测试构建
