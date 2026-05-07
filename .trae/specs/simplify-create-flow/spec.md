# Simplify Create Flow Spec

## Why
当前的新建内容模块功能繁杂且不符合人类直觉。将“创建项目”和“上下文加载”分离的交互增加了认知负担。用户需要一个更顺畅的工作流：要么打开一个本地文件夹作为一个工作区（Workspace）进行沉浸式创作并直接保存，要么直接进行零散的快速生成。同时，需要确保桌面的历史记录等数据能够稳定持久化保存。

## What Changes
- **BREAKING**: 移除现有冗余的 `ProjectSelector`，改为统一的“打开文件夹”工作区模式。
- 新增：界面展示已打开本地文件夹的目录树（File Tree）。
- 新增：输入框支持 `@` 唤出文件列表并引用本地文件作为上下文。
- 新增：输入框支持拖拽本地文件进入，自动解析为上下文。
- 新增：生成的内容支持直接保存/回写到已打开的本地文件夹中。
- 修复/确认：集成 `zustand/middleware/persist` 和 `tauri-plugin-store`（或本地文件存储），确保所有历史记录、配置默认被持久化，除非用户主动删除。

## Impact
- Affected specs: 内容生成、项目管理、历史记录管理。
- Affected code: `useAppStore.ts`（状态持久化）、`IdeaInput.tsx`（@和拖拽支持）、新建内容主布局（文件树展示）。

## ADDED Requirements
### Requirement: Workspace Mode (项目模式)
The system SHALL allow users to open a local folder, view its file tree, and interact with its contents.
#### Scenario: Success case
- **WHEN** 用户点击“打开文件夹”并选择本地目录
- **THEN** 界面展示该目录的文件树，后续生成的内容提供“保存到该目录”的功能。

### Requirement: Context Referencing (@ and Drag-drop)
The system SHALL allow referencing local files intuitively.
#### Scenario: Success case
- **WHEN** 用户在输入框键入 `@` 或将文件拖入输入框
- **THEN** 提取该文件内容作为 AI 生成的上下文，并在 UI 上显示已引用的文件标签。

## MODIFIED Requirements
### Requirement: Data Persistence
应用的所有状态（尤其是历史记录）必须在关闭后保留。
- **Migration**: 将 `useAppStore` 结合 Tauri 的持久化能力进行封装，确保重启不丢失。