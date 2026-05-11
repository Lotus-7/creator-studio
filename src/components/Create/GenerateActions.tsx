import React from "react";
import { useAppStore } from "../../stores/useAppStore";
import { Button } from "../common/Button";
import type { GenerationType } from "../../types";

const GENERATION_TYPES: { type: GenerationType; label: string; loadingLabel: string }[] = [
  { type: "topic", label: "生成选题", loadingLabel: "正在生成选题..." },
  { type: "outline", label: "生成大纲", loadingLabel: "正在生成大纲..." },
  { type: "draft", label: "生成初稿", loadingLabel: "正在撰写初稿..." },
  { type: "title", label: "生成标题", loadingLabel: "正在生成标题..." },
  { type: "optimize", label: "文稿优化", loadingLabel: "正在优化文稿..." },
];

export const GenerateActions: React.FC = () => {
  const { loading, generatingType, generate } = useAppStore();

  const handleGenerate = (type: GenerationType) => {
    generate(type);
  };

  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px", alignItems: "center" }}>
      {GENERATION_TYPES.map(({ type, label, loadingLabel }) => {
        const isActive = loading && generatingType === type;
        return (
          <Button
            key={type}
            variant={isActive ? "primary" : "primary"}
            onClick={() => handleGenerate(type)}
            disabled={loading}
            className={isActive ? "btn-generating" : ""}
          >
            {isActive ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span className="btn-spinner" />
                {loadingLabel}
              </span>
            ) : (
              label
            )}
          </Button>
        );
      })}
    </div>
  );
};
