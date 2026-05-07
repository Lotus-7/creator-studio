import React, { useState, useEffect } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "../common/Button";
import type { Persona } from "../../types";

const STYLE_TAG_OPTIONS = [
  "幽默风趣",
  "专业严谨",
  "轻松口语",
  "深度分析",
  "故事叙述",
  "干货实用",
  "观点鲜明",
  "温暖治愈",
  "犀利毒舌",
  "数据驱动",
];

interface Props {
  personaId: string | null;
  onClose: () => void;
}

export const PersonaEditor: React.FC<Props> = ({ personaId, onClose }) => {
  const { personas, addPersona, updatePersona, providers } = useAppStore();
  const isEditing = personaId !== null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [providerId, setProviderId] = useState("");

  useEffect(() => {
    if (isEditing && personaId) {
      const persona = personas.find((p) => p.id === personaId);
      if (persona) {
        setName(persona.name);
        setDescription(persona.description);
        setStyleTags(persona.styleTags);
        setProviderId(persona.providerId);
      }
    }
  }, [isEditing, personaId, personas]);

  const handleToggleTag = (tag: string) => {
    setStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("请输入角色名称");
      return;
    }

    if (!description.trim()) {
      alert("请输入人设描述");
      return;
    }

    if (!providerId) {
      alert("请选择绑定的 AI 提供商");
      return;
    }

    try {
      if (isEditing && personaId) {
        // Update existing
        const updated: Persona = {
          id: personaId,
          name: name.trim(),
          description: description.trim(),
          styleTags,
          providerId,
          createdAt:
            personas.find((p) => p.id === personaId)?.createdAt ||
            new Date(),
          updatedAt: new Date(),
        };
        await invoke("save_persona", { 
          persona: {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          }
        });
        updatePersona(updated);
      } else {
        // Create new
        const newPersona: Persona = {
          id: crypto.randomUUID(),
          name: name.trim(),
          description: description.trim(),
          styleTags,
          providerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // 在这里使用 toISOString() 来匹配 Rust 后端期待的 String 类型
        await invoke("save_persona", { 
          persona: {
            ...newPersona,
            createdAt: newPersona.createdAt.toISOString(),
            updatedAt: newPersona.updatedAt.toISOString(),
          }
        });
        addPersona(newPersona);
      }
      onClose();
    } catch (error) {
      console.error("Save persona error:", error);
      alert(`保存失败: ${error}`);
    }
  };

  const enabledProviders = Object.entries(providers).filter(
    ([_, config]) => config.enabled
  );

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {isEditing ? "编辑角色" : "新建角色"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            取消
          </Button>
        </div>

        <div className="input-group">
          <label className="input-label">角色名称 *</label>
          <input
            type="text"
            placeholder="例如：科技博主、美食评论家..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">人设描述 *</label>
          <textarea
            placeholder="描述这个角色的写作风格、语气、特点..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="input-group">
          <label className="input-label">写作风格标签</label>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {STYLE_TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                className={`badge ${
                  styleTags.includes(tag) ? "badge-primary" : "badge-secondary"
                }`}
                style={{
                  padding: "8px 14px",
                  cursor: "pointer",
                  border: "none",
                  fontSize: "var(--text-sm)",
                }}
                onClick={() => handleToggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">绑定 AI 提供商 *</label>
          <select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
            <option value="">请选择</option>
            {enabledProviders.map(([id, config]) => (
              <option key={id} value={id}>
                {id} · {config.model}
              </option>
            ))}
          </select>
          <p className="input-hint">
            选择该角色使用的 AI 提供商和模型
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {isEditing ? "保存修改" : "创建角色"}
          </Button>
        </div>
      </div>
    </div>
  );
};
