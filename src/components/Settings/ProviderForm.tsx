import React from "react";
import { useAppStore } from "../../stores/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import { PROVIDER_INFO, SettingsResponse } from "../../types";
import { Button } from "../common/Button";

interface Props {
  providerKey: string;
}

export const ProviderForm: React.FC<Props> = ({ providerKey }) => {
  const {
    providers,
    apiKeys,
    setApiKeys,
    models,
    setModels,
    saveStatus,
    setSaveStatus,
    defaultProvider,
    setDefaultProvider,
  } = useAppStore();

  // 添加 baseUrls 状态
  const [baseUrls, setBaseUrls] = React.useState<Record<string, string>>({});

  const provider = providers[providerKey];
  const info = PROVIDER_INFO[providerKey];

  // 初始化 baseUrls 和 models 和 apiKeys
  React.useEffect(() => {
    if (provider?.baseUrl && !baseUrls[providerKey]) {
      setBaseUrls(prev => ({ ...prev, [providerKey]: provider.baseUrl }));
    }
    if (provider?.model && !models[providerKey]) {
      setModels({ ...models, [providerKey]: provider.model });
    }
    if (provider?.apiKey && !apiKeys[providerKey]) {
      setApiKeys({ ...apiKeys, [providerKey]: provider.apiKey });
    }
  }, [providerKey, provider]);

  const handleSave = async () => {
    const apiKey = apiKeys[providerKey] || "";
    const model = models[providerKey] || "";
    const baseUrl = baseUrls[providerKey] || provider?.baseUrl || "";

    if (!apiKey) {
      setSaveStatus({ ...saveStatus, [providerKey]: "请输入 API Key" });
      return;
    }

    if (!model) {
      setSaveStatus({ ...saveStatus, [providerKey]: "请输入模型名称" });
      return;
    }

    if (!baseUrl) {
      setSaveStatus({ ...saveStatus, [providerKey]: "请输入 API 地址" });
      return;
    }

    setSaveStatus({ ...saveStatus, [providerKey]: "保存中..." });

    try {
      await invoke("save_provider_with_url", {
        providerName: providerKey,
        apiKey,
        model,
        baseUrl,
      });

      // 重新加载所有设置以确保全局状态是最新的
      const { setProviders, setDefaultProvider } = useAppStore.getState();
      const updatedSettings = await invoke<SettingsResponse>("get_settings");
      setProviders(updatedSettings.providers);
      if (updatedSettings.defaultProvider) {
        setDefaultProvider(updatedSettings.defaultProvider);
      }

      setSaveStatus({ ...saveStatus, [providerKey]: "保存成功！" });
      setTimeout(() => {
        setSaveStatus({ ...saveStatus, [providerKey]: "" });
      }, 2000);
    } catch (error) {
      setSaveStatus({ ...saveStatus, [providerKey]: `保存失败: ${error}` });
    }
  };

  const handleTest = async () => {
    const apiKey = apiKeys[providerKey];
    if (!apiKey) {
      setSaveStatus({ ...saveStatus, [providerKey]: "请先输入 API Key" });
      return;
    }

    setSaveStatus({ ...saveStatus, [providerKey]: "测试中..." });

    try {
      await invoke("test_connection", {
        providerName: providerKey,
        apiKey,
      });
      setSaveStatus({ ...saveStatus, [providerKey]: "连接成功！" });
    } catch (error) {
      setSaveStatus({ ...saveStatus, [providerKey]: `连接失败: ${error}` });
    }
  };

  const handleSetDefault = async () => {
    try {
      await invoke("set_default_provider", { providerName: providerKey });
      setDefaultProvider(providerKey);
    } catch (error) {
      console.error("Failed to set default:", error);
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "var(--color-surface-warm-light)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div className="input-group">
        <label className="input-label">API 地址</label>
        <input
          type="text"
          placeholder="API 请求地址"
          value={baseUrls[providerKey] || provider?.baseUrl || ""}
          onChange={(e) =>
            setBaseUrls({ ...baseUrls, [providerKey]: e.target.value })
          }
        />
        <p className="input-hint">
          AI 服务的 API 端点地址
        </p>
      </div>

      <div className="input-group">
        <label className="input-label">API Key</label>
        <input
          type="password"
          placeholder={`输入 ${provider?.apiKeyEnv || providerKey.toUpperCase()}_API_KEY`}
          value={apiKeys[providerKey] || ""}
          onChange={(e) =>
            setApiKeys({ ...apiKeys, [providerKey]: e.target.value })
          }
        />
        <p className="input-hint">
          你的 API Key 将安全存储在本地 ~/.creator/.env 文件中
        </p>
      </div>

      <div className="input-group">
        <label className="input-label">模型名称 *</label>
        <input
          type="text"
          placeholder={info.placeholder}
          value={models[providerKey] || ""}
          onChange={(e) =>
            setModels({ ...models, [providerKey]: e.target.value })
          }
        />
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
        <Button variant="primary" onClick={handleSave}>
          保存配置
        </Button>
        <Button variant="secondary" onClick={handleTest}>
          测试连接
        </Button>
        {defaultProvider !== providerKey && provider?.enabled && (
          <Button variant="ghost" onClick={handleSetDefault}>
            设为默认
          </Button>
        )}
      </div>

      {saveStatus[providerKey] && (
        <p
          style={{
            marginTop: "12px",
            fontSize: "var(--text-sm)",
            textAlign: "center",
            color: saveStatus[providerKey].includes("成功")
              ? "var(--color-success)"
              : "var(--color-error)",
          }}
        >
          {saveStatus[providerKey]}
        </p>
      )}
    </div>
  );
};
