import React, { useState, useEffect } from "react";
import { readDir, type DirEntry } from "@tauri-apps/plugin-fs";

interface FileTreeProps {
  basePath: string;
}

const FileTreeNode: React.FC<{ entry: DirEntry; parentPath: string; level: number }> = ({ entry, parentPath, level }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<DirEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // separator handling for cross-platform (naive fallback, assume we use Tauri's path separator eventually or just standard / since tauri-plugin-fs normalizes somewhat, but let's use /)
  const fullPath = `${parentPath}/${entry.name}`;

  const toggleOpen = async () => {
    if (!entry.isDirectory) return;
    
    if (!isOpen && children.length === 0) {
      setLoading(true);
      try {
        const entries = await readDir(fullPath);
        setChildren(entries.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        }));
      } catch (e) {
        console.error("Failed to read dir:", e);
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!entry.isDirectory && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
      // Custom format to identify our own file drag
      e.dataTransfer.setData("application/creator-desktop-file", JSON.stringify({ path: fullPath, name: entry.name }));
      e.dataTransfer.effectAllowed = "copy";
    } else {
      e.preventDefault();
    }
  };

  return (
    <div>
      <div 
        style={{ 
          padding: "6px 4px", 
          paddingLeft: `${level * 12 + 4}px`,
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          borderBottom: "1px solid var(--color-border)", 
          color: "var(--color-text)",
          cursor: entry.isDirectory ? "pointer" : "grab",
          userSelect: "none"
        }}
        onClick={toggleOpen}
        draggable={!entry.isDirectory}
        onDragStart={handleDragStart}
      >
        <span style={{ 
          display: "inline-block", 
          width: "16px", 
          textAlign: "center",
          fontSize: "12px",
          color: "var(--color-text-light)"
        }}>
          {entry.isDirectory ? (isOpen ? "▼" : "▶") : ""}
        </span>
        <span>{entry.isDirectory ? "📁" : "📄"}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</span>
        {loading && <span style={{ fontSize: "10px", color: "var(--color-text-light)" }}>...</span>}
      </div>
      {isOpen && entry.isDirectory && (
        <div>
          {children.map((child, i) => (
            <FileTreeNode key={i} entry={child} parentPath={fullPath} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ basePath }) => {
  const [files, setFiles] = useState<DirEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFiles(basePath);
  }, [basePath]);

  const loadFiles = async (path: string) => {
    setLoading(true);
    try {
      const entries = await readDir(path);
      setFiles(entries.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      }));
    } catch (e) {
      console.error("读取目录失败:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: "var(--color-text-light)", textAlign: "center", padding: "12px 0" }}>加载中...</div>;
  }

  if (files.length === 0) {
    return <div style={{ color: "var(--color-text-light)", textAlign: "center", padding: "12px 0" }}>文件夹为空</div>;
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", fontSize: "13px" }}>
      {files.map((file, i) => (
        <FileTreeNode key={i} entry={file} parentPath={basePath} level={0} />
      ))}
    </div>
  );
};
