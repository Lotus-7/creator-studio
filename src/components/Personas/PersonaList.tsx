import React, { useState } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { Button } from "../common/Button";
import { PersonaEditor } from "./PersonaEditor";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import type { Persona } from "../../types";

export const PersonaList: React.FC = () => {
  const { personas, currentPersona, setCurrentPersona, addPersona, defaultProvider, providers } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPersona, setEditingPersona] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCreate = () => {
    setEditingPersona(null);
    setIsEditing(true);
  };

  const handleAutoGenerate = async () => {
    if (!defaultProvider || !providers[defaultProvider]?.enabled) {
      alert("请先在设置中配置并启用一个 AI 提供商");
      return;
    }

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择包含风格文档的文件夹",
      });

      if (!selected) {
        return;
      }

      setIsAnalyzing(true);
      
      const rawPersona: any = await invoke("analyze_folder_style", {
        folderPath: selected,
        providerId: defaultProvider,
      });

      const newPersona: Persona = {
        ...rawPersona,
        createdAt: new Date(rawPersona.createdAt),
        updatedAt: new Date(rawPersona.updatedAt),
      };

      // save to backend DB too, since analyze_folder_style only generated it
      await invoke("save_persona", { 
        persona: {
          ...newPersona,
          createdAt: newPersona.createdAt.toISOString(),
          updatedAt: newPersona.updatedAt.toISOString(),
        }
      });

      addPersona(newPersona);
      setCurrentPersona(newPersona);
      
      alert(`成功分析并创建角色：${newPersona.name}`);
    } catch (error) {
      console.error("AI 分析失败:", error);
      alert(`分析失败: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEdit = (id: string) => {
    setEditingPersona(id);
    setIsEditing(true);
  };

  const handleSelect = (id: string) => {
    const persona = personas.find((p) => p.id === id);
    setCurrentPersona(persona || null);
  };

  if (isEditing) {
    return (
      <PersonaEditor
        personaId={editingPersona}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">创作角色库</h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button variant="secondary" onClick={handleAutoGenerate} disabled={isAnalyzing}>
              {isAnalyzing ? "分析中..." : "AI 从文件夹生成"}
            </Button>
            <Button variant="outline" onClick={handleCreate} disabled={isAnalyzing}>
              新建角色
            </Button>
          </div>
        </div>

        {personas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">暂无角色</div>
            <div className="empty-description">
              创建角色可以让 AI 以不同的风格和口吻进行创作
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {personas.map((persona) => (
              <div
                key={persona.id}
                className="card"
                style={{
                  padding: "16px",
                  marginBottom: "0",
                  cursor: "pointer",
                  borderLeft:
                    currentPersona?.id === persona.id
                      ? "3px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                  }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{ flex: 1 }}
                    onClick={() => handleSelect(persona.id)}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-lg)",
                        fontWeight: 600,
                        marginBottom: "8px",
                      }}
                    >
                      {persona.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                        marginBottom: "12px",
                      }}
                    >
                      {persona.description}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {persona.styleTags.map((tag) => (
                        <span
                          key={tag}
                          className="badge badge-secondary"
                          style={{
                            fontSize: "var(--text-xs)",
                            padding: "4px 10px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(persona.id)}
                  >
                    编辑
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
