use crate::{models, db};
use std::fs;
use std::path::PathBuf;
use tauri::command;

fn get_providers_file() -> PathBuf {
    db::get_creator_dir().join("providers.json")
}

fn get_env_file() -> PathBuf {
    db::get_creator_dir().join(".env")
}

fn ensure_providers_file() {
    let providers_file = get_providers_file();
    if !providers_file.exists() {
        let default_config = models::ProvidersConfig {
            default_provider: String::new(),
            providers: {
                let mut map = std::collections::HashMap::new();
                map.insert("deepseek".to_string(), models::ProviderConfig {
                    provider_type: "openai_compatible".to_string(),
                    enabled: false,
                    base_url: "https://api.deepseek.com/v1".to_string(),
                    api_key_env: "DEEPSEEK_API_KEY".to_string(),
                    model: "deepseek-chat".to_string(),
                    custom_model: None,
                    api_key: None,
                });
                map.insert("openrouter".to_string(), models::ProviderConfig {
                    provider_type: "openrouter".to_string(),
                    enabled: false,
                    base_url: "https://openrouter.ai/api/v1".to_string(),
                    api_key_env: "OPENROUTER_API_KEY".to_string(),
                    model: "openai/gpt-4o-mini".to_string(),
                    custom_model: None,
                    api_key: None,
                });
                map.insert("openai".to_string(), models::ProviderConfig {
                    provider_type: "openai".to_string(),
                    enabled: false,
                    base_url: "https://api.openai.com/v1".to_string(),
                    api_key_env: "OPENAI_API_KEY".to_string(),
                    model: "gpt-4o-mini".to_string(),
                    custom_model: None,
                    api_key: None,
                });
                map.insert("anthropic".to_string(), models::ProviderConfig {
                    provider_type: "anthropic".to_string(),
                    enabled: false,
                    base_url: "https://api.anthropic.com/v1".to_string(),
                    api_key_env: "ANTHROPIC_API_KEY".to_string(),
                    model: "claude-3-5-sonnet-20240620".to_string(),
                    custom_model: None,
                    api_key: None,
                });
                map.insert("qwen".to_string(), models::ProviderConfig {
                    provider_type: "openai_compatible".to_string(),
                    enabled: false,
                    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1".to_string(),
                    api_key_env: "DASHSCOPE_API_KEY".to_string(),
                    model: "qwen-plus".to_string(),
                    custom_model: None,
                    api_key: None,
                });
                map.insert("kimi".to_string(), models::ProviderConfig {
                    provider_type: "openai_compatible".to_string(),
                    enabled: false,
                    base_url: "https://api.moonshot.cn/v1".to_string(),
                    api_key_env: "MOONSHOT_API_KEY".to_string(),
                    model: "moonshot-v1-8k".to_string(),
                    custom_model: None,
                    api_key: None,
                });
                map.insert("zhipu".to_string(), models::ProviderConfig {
                    provider_type: "openai_compatible".to_string(),
                    enabled: false,
                    base_url: "https://open.bigmodel.cn/api/paas/v4".to_string(),
                    api_key_env: "ZHIPUAI_API_KEY".to_string(),
                    model: "glm-4".to_string(),
                    custom_model: None,
                    api_key: None,
                });
                map.insert("gemini".to_string(), models::ProviderConfig {
                    provider_type: "gemini".to_string(),
                    enabled: false,
                    base_url: "https://generativelanguage.googleapis.com/v1beta".to_string(),
                    api_key_env: "GEMINI_API_KEY".to_string(),
                    model: "gemini-2.5-flash".to_string(),
                    custom_model: None,
                    api_key: None,
                });
                map
            },
        };
        let json = serde_json::to_string_pretty(&default_config).unwrap_or_default();
        let _ = fs::write(&providers_file, json);
    }
}

#[command]
pub fn get_settings() -> Result<models::SettingsResponse, String> {
    db::ensure_config_dir();
    ensure_providers_file();

    let providers_file = get_providers_file();
    let content = fs::read_to_string(&providers_file)
        .map_err(|e| format!("Failed to read providers file: {}", e))?;

    let mut config: models::ProvidersConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse providers file: {}", e))?;

    // Load API keys from .env file
    let env_file = get_env_file();
    if env_file.exists() {
        if let Ok(env_content) = fs::read_to_string(&env_file) {
            let env_vars: std::collections::HashMap<String, String> = env_content
                .lines()
                .filter_map(|line| {
                    let parts: Vec<&str> = line.splitn(2, '=').collect();
                    if parts.len() == 2 {
                        Some((parts[0].to_string(), parts[1].to_string()))
                    } else {
                        None
                    }
                })
                .collect();

            // Populate API keys into the provider config
            for provider in config.providers.values_mut() {
                if let Some(key) = env_vars.get(&provider.api_key_env) {
                    provider.api_key = Some(key.clone());
                }
            }
        }
    }

    Ok(models::SettingsResponse {
        default_provider: config.default_provider,
        providers: config.providers,
    })
}

#[command]
pub fn save_provider(
    provider_name: String,
    api_key: String,
    model: String,
) -> Result<(), String> {
    save_provider_with_url(provider_name, api_key, model, String::new())
}

#[command]
pub fn save_provider_with_url(
    provider_name: String,
    api_key: String,
    model: String,
    base_url: String,
) -> Result<(), String> {
    db::ensure_config_dir();
    ensure_providers_file();

    let providers_file = get_providers_file();
    let content = fs::read_to_string(&providers_file)
        .map_err(|e| format!("Failed to read providers file: {}", e))?;

    let mut config: models::ProvidersConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse providers file: {}", e))?;

    // Update provider config
    if let Some(provider) = config.providers.get_mut(&provider_name) {
        provider.enabled = !api_key.is_empty();
        provider.model = model.clone();
        if !base_url.is_empty() {
            provider.base_url = base_url;
        }

        // Update .env file
        let env_file = get_env_file();
        let env_key = &provider.api_key_env;
        let mut env_lines: Vec<String> = if env_file.exists() {
            fs::read_to_string(&env_file)
                .unwrap_or_default()
                .lines()
                .filter(|l| !l.starts_with(&format!("{}=", env_key)))
                .map(|l| l.to_string())
                .collect()
        } else {
            Vec::new()
        };

        if !api_key.is_empty() {
            env_lines.push(format!("{}={}", env_key, api_key));
        }

        let _ = fs::write(&env_file, env_lines.join("\n"));

        // Set environment variable for current process
        std::env::set_var(env_key, &api_key);
    }

    // Update default provider if this is the first one being configured
    if config.default_provider.is_empty() && !api_key.is_empty() {
        config.default_provider = provider_name.clone();
    }

    // Write back providers.json
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&providers_file, json)
        .map_err(|e| format!("Failed to write providers file: {}", e))?;

    Ok(())
}

#[command]
pub fn set_default_provider(provider_name: String) -> Result<(), String> {
    db::ensure_config_dir();
    ensure_providers_file();

    let providers_file = get_providers_file();
    let content = fs::read_to_string(&providers_file)
        .map_err(|e| format!("Failed to read providers file: {}", e))?;

    let mut config: models::ProvidersConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse providers file: {}", e))?;

    config.default_provider = provider_name.clone();

    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&providers_file, json)
        .map_err(|e| format!("Failed to write providers file: {}", e))?;

    Ok(())
}

#[command]
pub fn test_connection(provider_name: String, api_key: String) -> Result<String, String> {
    db::ensure_config_dir();
    ensure_providers_file();

    let providers_file = get_providers_file();
    let content = fs::read_to_string(&providers_file)
        .map_err(|e| format!("Failed to read providers file: {}", e))?;

    let config: models::ProvidersConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse providers file: {}", e))?;

    let provider = config.providers.get(&provider_name)
        .ok_or_else(|| format!("Provider {} not found", provider_name))?;

    // Set environment variable for the test
    let env_key = &provider.api_key_env;
    std::env::set_var(env_key, &api_key);

    // Run creator CLI test command
    let output = std::process::Command::new("creator")
        .args(["providers", "test", &provider_name])
        .env(env_key, &api_key)
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            Ok(stdout)
        }
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            Err(stderr)
        }
        Err(e) => {
            Err(format!("Failed to execute creator command: {}", e))
        }
    }
}
