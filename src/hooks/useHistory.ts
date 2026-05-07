import { useEffect } from "react";
import { useAppStore } from "../stores/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import type { HistoryItem } from "../types";

export const useHistory = () => {
  const { history, setHistory, removeHistoryItem, clearHistory } =
    useAppStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await invoke<HistoryItem[]>("get_history", {
        filters: { type: "all" },
      });
      setHistory(
        data.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }))
      );
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  const searchHistory = async (query: string) => {
    try {
      const data = await invoke<HistoryItem[]>("search_history", { query });
      return data.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
    } catch (e) {
      console.error("Failed to search history:", e);
      return [];
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await invoke("delete_history", { id });
      removeHistoryItem(id);
    } catch (e) {
      console.error("Failed to delete history:", e);
    }
  };

  const clearAllHistory = async () => {
    try {
      await invoke("clear_history");
      clearHistory();
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  };

  return {
    history,
    loadHistory,
    searchHistory,
    deleteHistoryItem,
    clearAllHistory,
  };
};
