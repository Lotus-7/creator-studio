import { useAppStore } from "../stores/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import type { GenerationType } from "../types";

export const useGenerator = () => {
  const {
    input,
    loading,
    setLoading,
    setResult,
    settings,
    addHistoryItem,
    currentPersona,
  } = useAppStore();

  const generate = async (type: GenerationType) => {
    if (!input.trim()) {
      alert("请输入你的想法");
      return;
    }

    if (!settings?.defaultProvider) {
      setResult({
        type,
        content: "错误: 请先在设置中配置 AI 提供商",
        timestamp: new Date(),
      });
      return;
    }

    setLoading(true);
    try {
      const content = await invoke<string>("generate_content", {
        contentType: type,
        idea: input,
        personaId: currentPersona?.id,
      });

      setResult({
        type,
        content,
        timestamp: new Date(),
      });

      // Add to history
      addHistoryItem({
        id: crypto.randomUUID(),
        type,
        idea: input,
        result: content,
        personaId: currentPersona?.id,
        createdAt: new Date(),
      });
    } catch (error) {
      setResult({
        type,
        content: `错误: ${error}`,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading };
};
