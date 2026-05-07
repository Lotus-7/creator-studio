import React from "react";
import { useAppStore } from "../../stores/useAppStore";
import { Button } from "../common/Button";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

const TYPE_LABELS: Record<string, string> = {
  topic: "选题卡片",
  outline: "大纲",
  draft: "初稿",
  title: "标题",
  optimize: "优化建议",
};

export const ResultDisplay: React.FC = () => {
  const { result, currentProject } = useAppStore();

  if (!result) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content);
  };

  const handleSaveToProject = async () => {
    if (!currentProject?.localPath) return;
    try {
      const fileName = `${result.type}-${new Date().getTime()}.md`;
      // Check if localPath has a trailing slash to prevent double slashes
      const separator = currentProject.localPath.endsWith('/') || currentProject.localPath.endsWith('\\') ? '' : '/';
      const filePath = `${currentProject.localPath}${separator}${fileName}`;
      
      await writeTextFile(filePath, result.content);
      alert(`已成功保存至项目：${fileName}`);
    } catch (error) {
      console.error("保存到项目失败:", error);
      alert(`保存失败: ${error}`);
    }
  };

  const handleSave = async () => {
    try {
      const filePath = await save({
        filters: [{
          name: 'Markdown',
          extensions: ['md']
        }, {
          name: 'Text',
          extensions: ['txt']
        }],
        defaultPath: `${result.type}-${new Date().getTime()}.md`
      });

      if (filePath) {
        await writeTextFile(filePath, result.content);
        alert("保存成功！");
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert(`保存失败: ${error}`);
    }
  };

  return (
    <div className="card" style={{ marginTop: "24px" }}>
      <div className="card-header">
        <h3 className="card-title">{TYPE_LABELS[result.type]}</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          {currentProject?.localPath && (
            <Button variant="primary" size="sm" onClick={handleSaveToProject}>
              一键保存至项目
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleSave}>
            另存为...
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            复制
          </Button>
        </div>
      </div>
      <pre
        style={{
          background: "var(--color-surface-warm-light)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          fontSize: "var(--text-sm)",
          lineHeight: 1.6,
          color: "var(--color-text)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        {result.content}
      </pre>
    </div>
  );
};
