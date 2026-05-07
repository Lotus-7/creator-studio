# Creator Studio 优化实施计划

**项目：** Creator Studio (Tauri 2 + React + Rust)
**日期：** 2026-05-06
**状态：** 进行中

---

## 决策记录

- **架构方案**：方案 B — 架构升级（引入 Zustand + CSS Variables + 组件化）
- **视觉风格**：温暖创作者风（Craft/Ghost 风格）
- **风格库功能**：创作者角色管理（名称、人设、风格标签、绑定提供商）
- **历史记录**：本地 SQLite 持久化
- **图标**：纯文字标签，不使用 emoji

---

## 实施阶段

### 阶段一：基础架构（进行中）

- [ ] 安装 Zustand 依赖
- [ ] 创建目录结构
- [ ] 创建 Zustand store
- [ ] 创建 CSS 变量体系
- [ ] 清理死代码（server.js 等）

### 阶段二：组件拆分

- [ ] Layout 组件（Sidebar + MainContent）
- [ ] Create 组件（IdeaInput, GenerateActions, ResultDisplay, PersonaSelector）
- [ ] History 组件（HistoryList, HistoryItem）
- [ ] Personas 组件（PersonaList, PersonaEditor）
- [ ] Settings 组件（ProviderCard, ProviderForm, AboutSection）
- [ ] 通用组件（Button, Toast, LoadingSpinner, Modal）

### 阶段三：视觉重设计

- [ ] 应用 CSS 变量主题
- [ ] 更新所有组件样式
- [ ] 实现温暖创作者风格

### 阶段四：Rust 后端重构

- [ ] 添加依赖（rusqlite, chrono, uuid）
- [ ] 模块拆分（models.rs, db.rs, commands/）
- [ ] 数据库初始化
- [ ] 迁移现有命令到新结构

### 阶段五：历史记录功能

- [ ] 创建 SQLite history 表
- [ ] 实现历史 CRUD 命令
- [ ] 实现历史页 UI

### 阶段六：角色管理功能

- [ ] 创建 SQLite personas 表
- [ ] 实现角色 CRUD 命令
- [ ] 实现角色页 UI
- [ ] 集成到创作页

### 阶段七：收尾

- [ ] 版本号统一为 0.2.0
- [ ] CSP 配置
- [ ] 更新 README
- [ ] 测试构建

---

## 当前进度

**当前阶段：** 阶段一
**下一步：** 安装 Zustand 并创建目录结构
