import React, { useState } from "react";
import type { HistoryItem as HistoryItemType } from "../../types";
import { Button } from "../common/Button";

const TYPE_LABELS: Record<string, string> = {
  topic: "选题",
  outline: "大纲",
  draft: "初稿",
  title: "标题",
};

const TYPE_COLORS: Record<string, string> = {
  topic: "var(--color-primary)",
  outline: "var(--color-info)",
  draft: "var(--color-warning)",
  title: "var(--color-success)",
};

interface Props {
  item: HistoryItemType;
}

export const HistoryItem: React.FC<Props> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card"
      style={{
        padding: "16px",
        marginBottom: "0",
        cursor: "pointer",
        transition: "box-shadow var(--transition-base)",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <span
              className="badge"
              style={{
                background: TYPE_COLORS[item.type],
                color: "white",
              }}
            >
              {TYPE_LABELS[item.type]}
            </span>
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              {new Date(item.createdAt).toLocaleString()}
            </span>
          </div>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            {item.idea}
          </p>
        </div>
        <span style={{ color: "var(--color-text-muted)" }}>
          {expanded ? "▼" : "▶"}
        </span>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--color-border)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <pre
            style={{
              background: "var(--color-surface-warm-light)",
              borderRadius: "var(--radius-md)",
              padding: "12px",
              fontSize: "var(--text-sm)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {item.result}
          </pre>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigator.clipboard.writeText(item.result)}
            >
              复制
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
