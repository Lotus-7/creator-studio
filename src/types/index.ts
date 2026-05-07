// ============= Tab Types =============
export type TabType = "create" | "chat" | "history" | "personas" | "settings";

// ============= Generation Types =============
export type GenerationType = "topic" | "outline" | "draft" | "title" | "optimize";

// ============= Provider Types =============
export interface ProviderConfig {
  type: string;
  enabled: boolean;
  baseUrl: string;
  apiKeyEnv: string;
  model: string;
  customModel?: string;
  apiKey?: string; // Optional field to hold the loaded API key
}

export interface SettingsResponse {
  defaultProvider: string;
  providers: Record<string, ProviderConfig>;
}

export const PROVIDER_INFO: Record<string, { displayName: string; placeholder: string }> = {
  deepseek: { displayName: "DeepSeek", placeholder: "例如: deepseek-chat" },
  openrouter: { displayName: "OpenRouter", placeholder: "例如: openai/gpt-4.1-mini" },
  openai: { displayName: "OpenAI", placeholder: "例如: gpt-4.1-mini" },
  anthropic: { displayName: "Anthropic", placeholder: "例如: claude-sonnet-4-20250514" },
  qwen: { displayName: "Qwen (通义千问)", placeholder: "例如: qwen-plus" },
  kimi: { displayName: "Kimi (月之暗面)", placeholder: "例如: moonshot-v1-8k" },
  zhipu: { displayName: "智谱 GLM", placeholder: "例如: glm-4" },
  gemini: { displayName: "Google Gemini", placeholder: "例如: gemini-pro" },
};

// ============= Generation Result =============
export interface GenerationResult {
  type: GenerationType;
  content: string;
  timestamp: Date;
}

// ============= History Types =============
export interface HistoryItem {
  id: string;
  type: GenerationType;
  idea: string;
  result: string;
  personaId?: string;
  provider?: string;
  model?: string;
  createdAt: Date;
}

export interface HistoryFilters {
  type?: GenerationType | "all";
  search?: string;
}

// ============= Project Types =============
export interface Project {
  id: string;
  name: string;
  description?: string;
  localPath?: string; // Optional local folder/file path
  contextContent?: string; // Content read from local path or input
  createdAt: Date;
  updatedAt: Date;
}

// ============= Persona Types =============
export interface StyleTag {
  id: string;
  name: string;
  category: "tone" | "style" | "format";
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  styleTags: string[];
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============= UI State =============
export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export interface ModalState {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}
