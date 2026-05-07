import React from "react";
import { useAppStore } from "../../stores/useAppStore";
import { PROVIDER_INFO } from "../../types";
import { ProviderForm } from "./ProviderForm";

export const ProviderCard: React.FC = () => {
  const {
    providers,
    defaultProvider,
    expandedProvider,
    setExpandedProvider,
  } = useAppStore();

  return (
    <div className="main-content">
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: "20px" }}>
          AI 提供商配置
        </h2>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            marginBottom: "24px",
          }}
        >
          配置你想使用的 AI 服务商。可以同时配置多个，随时切换使用。
        </p>

        {Object.entries(PROVIDER_INFO).map(([key, info]) => {
          const provider = providers[key];
          const isDefault = defaultProvider === key;
          const isExpanded = expandedProvider === key;

          return (
            <div
              key={key}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                marginBottom: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  cursor: "pointer",
                  background:
                    isDefault || provider?.enabled
                      ? "var(--color-surface-warm-light)"
                      : "var(--color-surface)",
                  transition: "background var(--transition-fast)",
                }}
                onClick={() =>
                  setExpandedProvider(isExpanded ? null : key)
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: 500,
                      color: "var(--color-text)",
                    }}
                  >
                    {info.displayName}
                  </span>
                  {isDefault && (
                    <span className="badge badge-primary">默认</span>
                  )}
                  {provider?.enabled && !isDefault && (
                    <span className="badge badge-success">已配置</span>
                  )}
                </div>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {isExpanded ? "▼" : "▶"}
                </span>
              </div>

              {isExpanded && <ProviderForm providerKey={key} />}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 className="card-title" style={{ fontSize: "var(--text-base)" }}>
          关于
        </h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Creator Studio v0.2.0
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          内容创作桌面工具
        </p>
      </div>
    </div>
  );
};
