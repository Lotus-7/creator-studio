import React from "react";
import { useAppStore } from "../../stores/useAppStore";
import { Button } from "../common/Button";
import type { GenerationType } from "../../types";

const GENERATION_TYPES: { type: GenerationType; label: string }[] = [
  { type: "topic", label: "生成选题" },
  { type: "outline", label: "生成大纲" },
  { type: "draft", label: "生成初稿" },
  { type: "title", label: "生成标题" },
  { type: "optimize", label: "文稿优化" },
];

export const GenerateActions: React.FC = () => {
  const { loading, generate } = useAppStore();

  const handleGenerate = (type: GenerationType) => {
    generate(type);
  };

  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
      {GENERATION_TYPES.map(({ type, label }) => (
        <Button
          key={type}
          variant="primary"
          onClick={() => handleGenerate(type)}
          disabled={loading}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};
