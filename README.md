# Creator Studio

创作者桌面工具 — 使用 AI 帮助你生成选题、大纲、初稿和标题。

## 功能特性

- **AI 内容生成**: 支持生成选题卡片、大纲、初稿、标题
- **多 AI 提供商支持**: DeepSeek、OpenRouter、OpenAI、Anthropic、通义千问、Kimi、智谱 GLM、Gemini
- **创作角色管理**: 创建不同的创作人设，绑定不同的 AI 模型
- **历史记录**: 本地保存所有生成记录，支持搜索和筛选
- **本地优先**: 所有配置和历史记录都存储在本地 `~/.creator/` 目录

## 技术栈

- **前端**: React 19 + TypeScript + Zustand
- **后端**: Tauri 2 + Rust
- **数据库**: SQLite
- **构建工具**: Vite 7

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 构建
npm run tauri build
```

## 配置文件

- **配置目录**: `~/.creator/`
- **提供商配置**: `~/.creator/providers.json`
- **API Keys**: `~/.creator/.env`
- **历史数据库**: `~/.creator/history.db`

## 版本

v0.2.0
