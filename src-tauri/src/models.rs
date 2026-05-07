use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConfig {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub enabled: bool,
    #[serde(default)]
    pub base_url: String,
    #[serde(default)]
    pub api_key_env: String,
    pub model: String,
    pub custom_model: Option<String>,
    pub api_key: Option<String>, // Added to transmit API key to frontend
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProvidersConfig {
    pub default_provider: String,
    pub providers: std::collections::HashMap<String, ProviderConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsResponse {
    pub default_provider: String,
    pub providers: std::collections::HashMap<String, ProviderConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct History {
    pub id: String,
    #[serde(rename = "type")]
    pub history_type: String,
    pub idea: String,
    pub result: String,
    #[serde(rename = "personaId")]
    pub persona_id: Option<String>,
    pub provider: Option<String>,
    pub model: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Persona {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "styleTags")]
    pub style_tags: Vec<String>,
    #[serde(rename = "providerId")]
    pub provider_id: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HistoryFilters {
    #[serde(rename = "type")]
    pub filter_type: Option<String>,
    pub search: Option<String>,
}
