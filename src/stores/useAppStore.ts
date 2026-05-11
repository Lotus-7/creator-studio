import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";
import type {
  TabType,
  GenerationResult,
  ProviderConfig,
  Persona,
  HistoryItem,
  ToastMessage,
  GenerationType,
  SettingsResponse,
  Project,
} from "../types";

interface AppStore {
  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Creation state
  input: string;
  setInput: (input: string) => void;
  projectContext: string;
  setProjectContext: (context: string) => void;
  loading: boolean;
  generatingType: GenerationType | null;
  setLoading: (loading: boolean) => void;
  result: GenerationResult | null;
  setResult: (result: GenerationResult | null) => void;
  generate: (type: GenerationType) => Promise<void>;

  // Current persona for creation
  currentPersona: Persona | null;
  setCurrentPersona: (persona: Persona | null) => void;

  // Providers
  providers: Record<string, ProviderConfig>;
  setProviders: (providers: Record<string, ProviderConfig>) => void;
  defaultProvider: string;
  setDefaultProvider: (provider: string) => void;

  // Settings
  settings: SettingsResponse | null;
  setSettings: (settings: SettingsResponse | null) => void;

  // History
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
  addHistoryItem: (item: HistoryItem) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;

  // Personas
  personas: Persona[];
  setPersonas: (personas: Persona[]) => void;
  addPersona: (persona: Persona) => void;
  updatePersona: (persona: Persona) => void;
  deletePersona: (id: string) => void;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;

  // Settings form state
  apiKeys: Record<string, string>;
  setApiKeys: (keys: Record<string, string>) => void;
  models: Record<string, string>;
  setModels: (models: Record<string, string>) => void;
  saveStatus: Record<string, string>;
  setSaveStatus: (status: Record<string, string>) => void;
  expandedProvider: string | null;
  setExpandedProvider: (provider: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Navigation
      activeTab: "create",
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Projects
      projects: [],
      setProjects: (projects) => set({ projects }),
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (project) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === project.id ? project : p)),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        })),
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),

      // Creation state
      input: "",
      setInput: (input) => set({ input }),
      projectContext: "",
      setProjectContext: (context) => set({ projectContext: context }),
      loading: false,
      generatingType: null,
      setLoading: (loading) => set({ loading }),
      result: null,
      setResult: (result) => set({ result }),
      generate: async (type: GenerationType) => {
        const { input, projectContext, loading, currentPersona, defaultProvider, providers, addHistoryItem } = get();

        if (!input.trim() && !projectContext?.trim()) {
          alert("请输入你的想法或提供项目上下文");
          return;
        }

        if (!defaultProvider || !providers[defaultProvider]?.enabled) {
          set({
            result: {
              type,
              content: "错误: 请先在设置中配置并启用 AI 提供商",
              timestamp: new Date(),
            },
          });
          return;
        }

        if (loading) return;

        set({ loading: true, generatingType: type });
        try {
          const content = await invoke<string>("generate_content", {
            contentType: type,
            idea: input,
            personaId: currentPersona?.id,
            projectContext: projectContext || null,
          });

          const newResult: GenerationResult = {
            type,
            content,
            timestamp: new Date(),
          };

          set({ result: newResult });

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
          set({
            result: {
              type,
              content: `错误: ${error}`,
              timestamp: new Date(),
            },
          });
        } finally {
          set({ loading: false, generatingType: null });
        }
      },

      // Current persona
      currentPersona: null,
      setCurrentPersona: (persona) => set({ currentPersona: persona }),

      // Providers
      providers: {},
      setProviders: (providers) => set({ providers }),
      defaultProvider: "",
      setDefaultProvider: (provider) => set({ defaultProvider: provider }),

      // Settings
      settings: null,
      setSettings: (settings) => set({ settings }),

      // History
      history: [],
      setHistory: (history) => set({ history }),
      addHistoryItem: (item) =>
        set((state) => ({ history: [item, ...state.history] })),
      removeHistoryItem: (id) =>
        set((state) => ({ history: state.history.filter((h) => h.id !== id) })),
      clearHistory: () => set({ history: [] }),

      // Personas
      personas: [],
      setPersonas: (personas) => set({ personas }),
      addPersona: (persona) =>
        set((state) => ({ personas: [...state.personas, persona] })),
      updatePersona: (persona) =>
        set((state) => ({
          personas: state.personas.map((p) => (p.id === persona.id ? persona : p)),
        })),
      deletePersona: (id) =>
        set((state) => ({ personas: state.personas.filter((p) => p.id !== id) })),

      // Toast notifications
      toasts: [],
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { ...toast, id: Math.random().toString(36).slice(2) },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // Settings form state
      apiKeys: {},
      setApiKeys: (keys) => set({ apiKeys: keys }),
      models: {},
      setModels: (models) => set({ models }),
      saveStatus: {},
      setSaveStatus: (status) => set({ saveStatus: status }),
      expandedProvider: null,
      setExpandedProvider: (provider) => set({ expandedProvider: provider }),
    }),
    {
      name: "creator-desktop-storage",
      partialize: (state) => ({
        history: state.history,
        projects: state.projects,
        personas: state.personas,
      }),
    }
  )
);
