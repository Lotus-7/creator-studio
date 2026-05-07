import { useEffect } from "react";
import { useAppStore } from "./stores/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import type { SettingsResponse } from "./types";
import { Sidebar } from "./components/Layout/Sidebar";
import { MainContent } from "./components/Layout/MainContent";
import { CreateLayout } from "./components/Create/CreateLayout";
import { HistoryList } from "./components/History/HistoryList";
import { PersonaList } from "./components/Personas/PersonaList";
import { ProviderCard } from "./components/Settings/ProviderCard";
import { Toast } from "./components/common/Toast";

import { ChatView } from "./components/Chat/ChatView";

function App() {
  const { activeTab, setSettings, setProviders, setDefaultProvider } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await invoke<SettingsResponse>("get_settings");
      setSettings(data);
      setProviders(data.providers);
      setDefaultProvider(data.defaultProvider);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "create":
        return (
          <div className="main-content">
            <CreateLayout />
          </div>
        );
      case "history":
        return <HistoryList />;
      case "chat":
        return <ChatView />;
      case "personas":
        return <PersonaList />;
      case "settings":
        return <ProviderCard />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <MainContent>{renderContent()}</MainContent>
      <Toast />
    </div>
  );
}

export default App;
