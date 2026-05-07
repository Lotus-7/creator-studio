import React from "react";
import { useAppStore } from "../../stores/useAppStore";

export const PersonaSelector: React.FC = () => {
  const { personas, currentPersona, setCurrentPersona } = useAppStore();

  if (personas.length === 0) {
    return (
      <div
        style={{
          padding: "12px 16px",
          background: "var(--color-surface-warm-light)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
        }}
      >
        暂无角色，请先在"角色库"中创建
      </div>
    );
  }

  return (
    <div className="input-group">
      <label className="input-label">选择创作角色</label>
      <select
        value={currentPersona?.id || ""}
        onChange={(e) => {
          const persona = personas.find((p) => p.id === e.target.value);
          setCurrentPersona(persona || null);
        }}
      >
        <option value="">不使用角色</option>
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.name}
            {persona.styleTags.length > 0 && ` · ${persona.styleTags.join(", ")}`}
          </option>
        ))}
      </select>
    </div>
  );
};
