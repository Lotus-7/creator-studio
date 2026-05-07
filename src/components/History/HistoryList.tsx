import React, { useState } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { HistoryItem } from "./HistoryItem";
import type { GenerationType } from "../../types";
import { Button } from "../common/Button";

const TYPE_FILTERS: Array<{ value: GenerationType | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "topic", label: "选题" },
  { value: "outline", label: "大纲" },
  { value: "draft", label: "初稿" },
  { value: "title", label: "标题" },
  { value: "optimize", label: "优化建议" },
];

export const HistoryList: React.FC = () => {
  const { history, clearHistory } = useAppStore();
  const [filter, setFilter] = useState<GenerationType | "all">("all");
  const [search, setSearch] = useState("");

  const filteredHistory = history.filter((item) => {
    const matchesType = filter === "all" || item.type === filter;
    const matchesSearch =
      !search ||
      item.idea.toLowerCase().includes(search.toLowerCase()) ||
      item.result.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleClearAll = () => {
    if (confirm("确定要清空所有历史记录吗？")) {
      clearHistory();
    }
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">生成历史</h2>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              清空
            </Button>
          )}
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              className={`tab-button ${filter === value ? "active" : ""}`}
              onClick={() => setFilter(value)}
              style={{ padding: "6px 14px", fontSize: "13px" }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="input-group">
          <input
            type="text"
            placeholder="搜索历史记录..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
        </div>

        {/* List */}
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">暂无历史记录</div>
            <div className="empty-description">
              {history.length === 0
                ? "开始创作后，生成的内容会保存在这里"
                : "没有匹配的记录"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredHistory.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
