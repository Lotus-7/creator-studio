import { useEffect } from "react";
import { useAppStore } from "../stores/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import type { SettingsResponse, ProviderConfig } from "../types";

export const useProviders = () => {
  const {
    setProviders,
    setDefaultProvider,
    setApiKeys,
    setModels,
    providers,
    apiKeys,
    models,
    saveStatus,
    setSaveStatus,
    expandedProvider,
    setExpandedProvider,
  } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await invoke<SettingsResponse>("get_settings");

      // Initialize empty strings for all providers
      const keys: Record<string, string> = {};
      const mods: Record<string, string> = {};
      const providerMap: Record<string, ProviderConfig> = {};

      Object.entries(data.providers).forEach(([key, config]) => {
        keys[key] = "";
        mods[key] = config.model || "";
        providerMap[key] = config;
      });

      setProviders(providerMap);
      setApiKeys(keys);
      setModels(mods);
      setDefaultProvider(data.defaultProvider);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  const saveProvider = async (
    providerName: string,
    apiKey: string,
    model: string
  ) => {
    if (!apiKey) {
      setSaveStatus({ ...saveStatus, [providerName]: "请输入 API Key" });
      return false;
    }

    if (!model) {
      setSaveStatus({ ...saveStatus, [providerName]: "请输入模型名称" });
      return false;
    }

    setSaveStatus({ ...saveStatus, [providerName]: "保存中..." });

    try {
      await invoke("save_provider", {
        providerName,
        apiKey,
        model,
      });

      // Reload settings
      await loadSettings();

      setSaveStatus({ ...saveStatus, [providerName]: "保存成功！" });
      setTimeout(() => {
        setSaveStatus({ ...saveStatus, [providerName]: "" });
      }, 2000);
      return true;
    } catch (error) {
      setSaveStatus({
        ...saveStatus,
        [providerName]: `保存失败: ${error}`,
      });
      return false;
    }
  };

  const testConnection = async (providerName: string, apiKey: string) => {
    if (!apiKey) {
      setSaveStatus({
        ...saveStatus,
        [providerName]: "请先输入 API Key",
      });
      return;
    }

    setSaveStatus({ ...saveStatus, [providerName]: "测试中..." });

    try {
      await invoke<string>("test_connection", {
        providerName,
        apiKey,
      });
      setSaveStatus({ ...saveStatus, [providerName]: "连接成功！" });
    } catch (error) {
      setSaveStatus({
        ...saveStatus,
        [providerName]: `连接失败: ${error}`,
      });
    }
  };

  const setAsDefaultProvider = async (providerName: string) => {
    try {
      await invoke("set_default_provider", { providerName });
      setDefaultProvider(providerName);
    } catch (error) {
      console.error("Failed to set default provider:", error);
    }
  };

  return {
    providers,
    apiKeys,
    models,
    saveStatus,
    expandedProvider,
    setExpandedProvider,
    setApiKeys,
    setModels,
    saveProvider,
    testConnection,
    setAsDefaultProvider,
    loadSettings,
  };
};
