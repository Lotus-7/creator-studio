import React from "react";
import { useAppStore } from "../../stores/useAppStore";
import type { TabType } from "../../types";

const TAB_LABELS: Record<TabType, string> = {
  create: "新建内容",
  chat: "自由对话",
  history: "历史",
  personas: "角色库",
  settings: "设置",
};

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <header className="header">
      <h1>Creator Studio</h1>
      <nav className="tabs">
        {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>
    </header>
  );
};
