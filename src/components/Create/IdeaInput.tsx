import React, { useState, useRef } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { readTextFile, readDir } from "@tauri-apps/plugin-fs";

export const IdeaInput: React.FC = () => {
  const { input, setInput, projectContext, setProjectContext, currentProject } = useAppStore();

  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<{ active: boolean; query: string; index: number }>({ active: false, query: "", index: 0 });
  const [localFiles, setLocalFiles] = useState<{ name: string; path: string }[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingRef.current) {
      setIsDragging(true);
      isDraggingRef.current = true;
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
      isDraggingRef.current = false;
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    isDraggingRef.current = false;

    // 1. 内部拖拽：从 FileTree 拖入的文件
    const customDataStr = e.dataTransfer.getData("application/creator-desktop-file");
    if (customDataStr) {
      try {
        const fileData = JSON.parse(customDataStr);
        if (fileData?.path) {
          const content = await readTextFile(fileData.path);
          const newContext = `\n\n--- 文件: ${fileData.name} ---\n${content}`;
          const prev = useAppStore.getState().projectContext;
          setProjectContext(prev ? prev + newContext : newContext.trim());
        }
      } catch (err) {
        console.error("读取拖拽文件失败", err);
      }
      return;
    }

    // 2. 外部拖拽：从系统文件管理器拖入的文件
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      let newContext = "";
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const filePath = (file as any).path;
        if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
          try {
            const content = filePath
              ? await readTextFile(filePath)
              : await file.text();
            newContext += `\n\n--- 文件: ${file.name} ---\n${content}`;
          } catch (err) {
            console.error("读取文件失败", err);
          }
        }
      }
      if (newContext) {
        const prev = useAppStore.getState().projectContext;
        setProjectContext(prev ? prev + newContext : newContext.trim());
      }
    }
  };

  const loadLocalFiles = async (dirPath: string) => {
    try {
      const entries = await readDir(dirPath);
      const files = entries
        .filter(e => !e.isDirectory && (e.name.endsWith(".txt") || e.name.endsWith(".md")))
        .map(e => ({ name: e.name, path: `${dirPath.replace(/[\\/]$/, "")}/${e.name}` }));
      setLocalFiles(files);
    } catch (err) {
      console.error("加载本地文件失败", err);
    }
  };

  const updateMentionState = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const val = target.value;
    const cursor = target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([^\s]*)$/);
    if (match) {
      setMentionQuery({ active: true, query: match[1], index: cursor - match[0].length });
      if (currentProject?.localPath) {
        loadLocalFiles(currentProject.localPath);
      }
    } else {
      setMentionQuery({ active: false, query: "", index: 0 });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    updateMentionState(e);
  };

  const handleMentionSelect = async (file: { name: string; path: string }) => {
    try {
      const content = await readTextFile(file.path);
      const newContext = `\n\n--- 文件: ${file.name} ---\n${content}`;
      const prev = useAppStore.getState().projectContext;
      setProjectContext(prev ? prev + newContext : newContext.trim());

      const before = input.slice(0, mentionQuery.index);
      const after = input.slice(mentionQuery.index + mentionQuery.query.length + 1);
      setInput(before + after);
      setMentionQuery({ active: false, query: "", index: 0 });
    } catch (err) {
      console.error("读取文件失败", err);
    }
  };

  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        border: isDragging ? "2px dashed var(--color-primary)" : "1px solid var(--color-border)",
        background: isDragging ? "var(--color-surface-warm-light)" : undefined,
        transition: "border 0.2s ease, background 0.2s ease"
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="card-title" style={{ margin: 0, fontSize: "14px", color: "var(--color-text-light)" }}>内容输入与上下文</h3>
        {isDragging && <span style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 500 }}>松开以加载文件内容</span>}
      </div>

      {projectContext && (
        <div style={{
          background: "var(--color-surface-warm-light)",
          padding: "8px 12px",
          borderRadius: "var(--radius-sm)",
          fontSize: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "bold", color: "var(--color-primary-dark)" }}>
              已加载上下文 {currentProject ? `(来自项目: ${currentProject.name})` : "(临时)"}：
            </span>
            <button
              onClick={() => setProjectContext("")}
              style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", fontSize: "12px" }}
            >
              清空
            </button>
          </div>
          <div style={{ maxHeight: "100px", overflowY: "auto", whiteSpace: "pre-wrap", color: "var(--color-text)" }}>
            {projectContext}
          </div>
        </div>
      )}

      <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
        <textarea
          className="textarea-input"
          placeholder="输入你的想法、大纲或初稿... (支持拖拽文件到此处，或输入 @ 引用本地文件)"
          value={input}
          onChange={handleInputChange}
          onSelect={updateMentionState}
          onKeyUp={updateMentionState}
          onClick={updateMentionState}
          rows={4}
        />

        {mentionQuery.active && currentProject?.localPath && (
          <div style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            maxHeight: "150px",
            overflowY: "auto",
            boxShadow: "var(--shadow-md)",
            zIndex: 10,
            width: "250px",
            marginBottom: "4px"
          }}>
            {localFiles.filter(f => f.name.toLowerCase().includes(mentionQuery.query.toLowerCase())).length > 0 ? (
              localFiles.filter(f => f.name.toLowerCase().includes(mentionQuery.query.toLowerCase())).map(f => (
                <div
                  key={f.path}
                  onClick={() => handleMentionSelect(f)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border)",
                    fontSize: "12px",
                    color: "var(--color-text)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface-warm-light)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  📄 {f.name}
                </div>
              ))
            ) : (
              <div style={{ padding: "8px 12px", fontSize: "12px", color: "var(--color-text-light)" }}>无匹配文件</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
