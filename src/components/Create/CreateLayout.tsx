import React, { useState, useCallback } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "../common/Button";
import { PersonaSelector } from "./PersonaSelector";
import { IdeaInput } from "./IdeaInput";
import { GenerateActions } from "./GenerateActions";
import { ResultDisplay } from "./ResultDisplay";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { FileTree } from "./FileTree";
import type { Project, GenerationType } from "../../types";

const LOADING_MESSAGES: Record<GenerationType, string> = {
  topic: "AI 正在为你挖掘创意选题...",
  outline: "AI 正在构建内容大纲...",
  draft: "AI 正在挥笔撰写初稿...",
  title: "AI 正在打磨爆款标题...",
  optimize: "AI 正在优化你的文稿...",
};

const getLoadingMessage = (type: GenerationType | null) =>
  type ? LOADING_MESSAGES[type] : "AI 正在创作中...";

export const CreateLayout: React.FC = () => {
  const { currentProject, setCurrentProject, loading, generatingType } = useAppStore();
  const [fileTreeRefreshKey, setFileTreeRefreshKey] = useState(0);

  const handleFileSaved = useCallback(() => {
    setFileTreeRefreshKey((k) => k + 1);
  }, []);

  const handleOpenFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择工作区文件夹",
      });
      if (selected && !Array.isArray(selected)) {
        const folderName = selected.split(/[/\\]/).pop() || "未命名工作区";
        const newProject: Project = {
          id: crypto.randomUUID(),
          name: folderName,
          description: `工作区: ${selected}`,
          localPath: selected,
          contextContent: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setCurrentProject(newProject);
      }
    } catch (e) {
      console.error("打开文件夹失败:", e);
    }
  };

  const handleCloseWorkspace = () => {
    setCurrentProject(null);
  };

  // 如果没有选择工作区，也显示组件，但顶部有打开文件夹的入口
  if (!currentProject) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px" }}>
        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "14px", color: "var(--color-text)" }}>零散创作模式</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--color-text-light)" }}>当前未绑定工作区。您可以直接输入内容，或打开文件夹体验沉浸式工作流。</p>
          </div>
          <Button variant="primary" onClick={handleOpenFolder}>打开文件夹</Button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <PersonaSelector />
          <IdeaInput />
          <GenerateActions />
          {loading && <LoadingSpinner message={getLoadingMessage(generatingType)} />}
          {!loading && <ResultDisplay onFileSaved={handleFileSaved} />}
        </div>
      </div>
    );
  }

  // 左右分栏布局
  return (
    <div style={{ display: "flex", height: "100%", gap: "16px", alignItems: "flex-start" }}>
      {/* 左侧：文件树 */}
      <div className="card" style={{ width: "240px", flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3
            style={{ margin: 0, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            title={currentProject.name}
          >
            {currentProject.name}
          </h3>
          <Button variant="secondary" size="sm" onClick={handleCloseWorkspace}>关闭工作区</Button>
        </div>
        <FileTree basePath={currentProject.localPath || ""} refreshKey={fileTreeRefreshKey} />
      </div>

      {/* 右侧：现有创作组件 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <PersonaSelector />
        <IdeaInput />
        <GenerateActions />
        {loading && <LoadingSpinner message={getLoadingMessage(generatingType)} />}
        {!loading && <ResultDisplay onFileSaved={handleFileSaved} />}
      </div>
    </div>
  );
};
