use tauri::command;
use std::fs;
use std::path::PathBuf;
use crate::{db, models};
use serde_json::json;

fn get_env_file() -> PathBuf {
    db::get_creator_dir().join(".env")
}

fn get_providers_file() -> PathBuf {
    db::get_creator_dir().join("providers.json")
}

fn optimize_draft(draft: String, persona_id: Option<String>) -> Result<String, String> {
    let providers_file = get_providers_file();
    let mut provider_name = String::new();
    let mut model_name = String::new();

    if let Ok(content) = fs::read_to_string(&providers_file) {
        if let Ok(config) = serde_json::from_str::<models::ProvidersConfig>(&content) {
            provider_name = config.default_provider.clone();
            if let Some(pid) = &persona_id {
                if let Ok(personas) = db::get_all_personas() {
                    if let Some(persona) = personas.iter().find(|p| p.id == *pid) {
                        provider_name = persona.provider_id.clone();
                    }
                }
            }
            if let Some(provider) = config.providers.get(&provider_name) {
                model_name = provider.model.clone();
            }
        }
    }

    if provider_name.is_empty() {
        return Err("No provider configured".to_string());
    }

    let config: models::ProvidersConfig = serde_json::from_str(&fs::read_to_string(&providers_file).unwrap_or_default())
        .map_err(|e| format!("Failed to parse providers file: {}", e))?;
    let provider = config.providers.get(&provider_name).ok_or("Provider not found")?;

    let mut api_key = String::new();
    let env_file = get_env_file();
    if env_file.exists() {
        if let Ok(env_content) = fs::read_to_string(&env_file) {
            for line in env_content.lines() {
                let parts: Vec<&str> = line.splitn(2, '=').collect();
                if parts.len() == 2 && parts[0] == provider.api_key_env {
                    api_key = parts[1].to_string();
                    break;
                }
            }
        }
    }

    if api_key.is_empty() {
        return Err("API Key not found".to_string());
    }

    let client = reqwest::blocking::Client::new();
    let system_prompt = "你是一个专业的爆款文案优化师。用户将提供一段初稿，请你提供详细的优化建议，包括：\n1. 整体结构优化\n2. 开头钩子(Hook)改进\n3. 情绪价值提升\n4. 语言精炼建议\n\n请直接输出优化后的文本，并附带修改理由。请使用全中文回答。";

    let payload = json!({
        "model": model_name,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": draft }
        ],
        "temperature": 0.7
    });

    let mut url = provider.base_url.clone();
    if !url.ends_with("/chat/completions") {
        if !url.ends_with('/') {
            url.push('/');
        }
        url.push_str("chat/completions");
    }

    let res = client.post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .map_err(|e| format!("Request failed: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().unwrap_or_default();
        return Err(format!("API Error: {}", err_text));
    }

    let response_json: serde_json::Value = res.json()
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    let content = response_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "Invalid response".to_string())?;

    Ok(content.to_string())
}

#[command]
pub async fn ask_ai(messages: Vec<serde_json::Value>, persona_id: Option<String>) -> Result<String, String> {
    tokio::task::spawn_blocking(move || ask_ai_inner(messages, persona_id))
        .await
        .map_err(|e| format!("Task error: {}", e))?
}

fn ask_ai_inner(messages: Vec<serde_json::Value>, persona_id: Option<String>) -> Result<String, String> {
    let providers_file = get_providers_file();
    let mut provider_name = String::new();
    let mut model_name = String::new();

    if let Ok(content) = fs::read_to_string(&providers_file) {
        if let Ok(config) = serde_json::from_str::<models::ProvidersConfig>(&content) {
            provider_name = config.default_provider.clone();
            if let Some(pid) = &persona_id {
                if let Ok(personas) = db::get_all_personas() {
                    if let Some(persona) = personas.iter().find(|p| p.id == *pid) {
                        provider_name = persona.provider_id.clone();
                    }
                }
            }
            if let Some(provider) = config.providers.get(&provider_name) {
                model_name = provider.model.clone();
            }
        }
    }

    if provider_name.is_empty() {
        return Err("No provider configured".to_string());
    }

    let config: models::ProvidersConfig = serde_json::from_str(&fs::read_to_string(&providers_file).unwrap_or_default())
        .map_err(|e| format!("Failed to parse providers file: {}", e))?;
    let provider = config.providers.get(&provider_name).ok_or("Provider not found")?;

    let mut api_key = String::new();
    let env_file = get_env_file();
    if env_file.exists() {
        if let Ok(env_content) = fs::read_to_string(&env_file) {
            for line in env_content.lines() {
                let parts: Vec<&str> = line.splitn(2, '=').collect();
                if parts.len() == 2 && parts[0] == provider.api_key_env {
                    api_key = parts[1].to_string();
                    break;
                }
            }
        }
    }

    if api_key.is_empty() {
        return Err("API Key not found".to_string());
    }

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    let payload = json!({
        "model": model_name,
        "messages": messages,
        "temperature": 0.7
    });

    let mut url = provider.base_url.clone();
    if !url.ends_with("/chat/completions") {
        if !url.ends_with('/') {
            url.push('/');
        }
        url.push_str("chat/completions");
    }

    let res = client.post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .map_err(|e| format!("Request failed: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().unwrap_or_default();
        return Err(format!("API Error: {}", err_text));
    }

    let raw_text = res.text().map_err(|e| format!("Failed to read response: {}", e))?;
    
    let response_json: serde_json::Value = serde_json::from_str(&raw_text)
        .map_err(|e| format!("Failed to parse JSON: {}\nRaw response: {}", e, raw_text))?;

    let content = response_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| format!("Invalid response format: {}", raw_text))?;

    Ok(content.to_string())
}

#[command]
pub async fn generate_content(
    content_type: String,
    idea: String,
    persona_id: Option<String>,
    project_context: Option<String>,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        generate_content_inner(content_type, idea, persona_id, project_context)
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?
}

fn generate_content_inner(
    content_type: String,
    idea: String,
    _persona_id: Option<String>,
    project_context: Option<String>,
) -> Result<String, String> {
    if idea.trim().is_empty() {
        return Err("Please enter content".to_string());
    }

    let valid_types = ["topic", "outline", "draft", "title", "optimize"];
    if !valid_types.contains(&content_type.as_str()) {
        return Err("Unknown generation type".to_string());
    }

    // Determine the system prompt based on content_type
    let mut system_prompt = String::new();
    let has_context = project_context.as_ref().map_or(false, |c| !c.is_empty());
    
    match content_type.as_str() {
        "topic" => {
            if has_context {
                system_prompt = "你是一个专业的爆款内容策划专家。用户提供了一些【本地文件/上下文参考】以及他们具体的【需求/想法】。请基于这些资料，为用户生成3个有吸引力的选题卡片。每个卡片应包含：创作角度、冲突点、情绪钩子和核心观点。请直接输出具体内容，不要输出无意义的元数据。请使用全中文回答。".to_string();
            } else {
                system_prompt = "你是一个专业的爆款内容策划专家。用户会提供一个想法或方向，请你生成3个有吸引力的选题卡片。每个卡片应包含：创作角度、冲突点、情绪钩子和核心观点。请直接输出具体内容，不要输出无意义的元数据。请使用全中文回答。".to_string();
            }
        },
        "outline" => {
            if has_context {
                system_prompt = "你是一个资深的内容结构架构师。用户提供了一些【本地文件/上下文参考】以及他们具体的【需求/想法】。请基于这些资料生成一个详实的大纲。大纲应该逻辑清晰，包含开头钩子、主体几个核心段落（含论点和论据提示），以及结尾升华。请使用全中文回答。".to_string();
            } else {
                system_prompt = "你是一个资深的内容结构架构师。用户会提供一个选题，请你为其生成一个详实的大纲。大纲应该逻辑清晰，包含开头钩子、主体几个核心段落（含论点和论据提示），以及结尾升华。请使用全中文回答。".to_string();
            }
        },
        "draft" => {
            if has_context {
                system_prompt = "你是一个金牌文案写手。用户提供了一些【本地文件/上下文参考】以及他们具体的【需求/想法】。请基于这些资料撰写一篇完整的初稿。要求：文字有感染力，金句频出，结构连贯。请使用全中文回答。".to_string();
            } else {
                system_prompt = "你是一个金牌文案写手。用户会提供大纲或想法，请你撰写一篇完整的初稿。要求：文字有感染力，金句频出，结构连贯。请使用全中文回答。".to_string();
            }
        },
        "title" => {
            if has_context {
                system_prompt = "你是一个爆款标题制造机。用户提供了一些【本地文件/上下文参考】以及他们具体的【需求/想法】。请基于这些资料生成5个极具吸引力的标题，并简要说明每个标题为什么这么取（背后的心理学或传播逻辑）。只生成标题和原因，不要其他废话。请使用全中文回答。".to_string();
            } else {
                system_prompt = "你是一个爆款标题制造机。用户会提供文章的主题或初稿，请你生成5个极具吸引力的标题，并简要说明每个标题为什么这么取（背后的心理学或传播逻辑）。只生成标题和原因，不要其他废话。请使用全中文回答。".to_string();
            }
        },
        "optimize" => {
            if has_context {
                system_prompt = "你是一个专业的爆款文案优化师。用户提供了一些【本地文件/上下文参考】以及他们具体的【修改需求/想法】。请基于这些资料提供详细的优化建议和修改后的文本。优化包括：\n1. 整体结构优化\n2. 开头钩子(Hook)改进\n3. 情绪价值提升\n4. 语言精炼建议\n\n请直接输出优化后的文本，并附带修改理由。请使用全中文回答。".to_string();
            } else {
                system_prompt = "你是一个专业的爆款文案优化师。用户将提供一段初稿，请你提供详细的优化建议，包括：\n1. 整体结构优化\n2. 开头钩子(Hook)改进\n3. 情绪价值提升\n4. 语言精炼建议\n\n请直接输出优化后的文本，并附带修改理由。请使用全中文回答。".to_string();
            }
        },
        _ => {}
    }

    let providers_file = get_providers_file();
    let mut provider_name = String::new();
    let mut model_name = String::new();

    if let Ok(content) = fs::read_to_string(&providers_file) {
        if let Ok(config) = serde_json::from_str::<models::ProvidersConfig>(&content) {
            provider_name = config.default_provider.clone();

            if let Some(pid) = &_persona_id {
                if let Ok(personas) = db::get_all_personas() {
                    if let Some(persona) = personas.iter().find(|p| p.id == *pid) {
                        provider_name = persona.provider_id.clone();
                    }
                }
            }

            if let Some(provider) = config.providers.get(&provider_name) {
                model_name = provider.model.clone();
            }
        }
    }

    if provider_name.is_empty() {
        return Err("No provider configured".to_string());
    }

    let config: models::ProvidersConfig = serde_json::from_str(&fs::read_to_string(&providers_file).unwrap_or_default())
        .map_err(|e| format!("Failed to parse providers file: {}", e))?;
    let provider = config.providers.get(&provider_name).ok_or("Provider not found")?;

    let mut api_key = String::new();
    let env_file = get_env_file();
    if env_file.exists() {
        if let Ok(env_content) = fs::read_to_string(&env_file) {
            for line in env_content.lines() {
                let parts: Vec<&str> = line.splitn(2, '=').collect();
                if parts.len() == 2 && parts[0] == provider.api_key_env {
                    api_key = parts[1].to_string();
                    break;
                }
            }
        }
    }

    if api_key.is_empty() {
        return Err("API Key not found".to_string());
    }

    let mut user_content = idea.clone();
    if let Some(ctx) = project_context {
        if !ctx.is_empty() {
            user_content = format!("【项目上下文参考】\n{}\n\n【用户的输入/想法】\n{}", ctx, idea);
        }
    }

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;
    
    let payload = json!({
        "model": model_name,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": user_content }
        ],
        "temperature": 0.7
    });

    let mut url = provider.base_url.clone();
    if !url.ends_with("/chat/completions") {
        if !url.ends_with('/') {
            url.push('/');
        }
        url.push_str("chat/completions");
    }

    let res = client.post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .map_err(|e| format!("Request failed: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().unwrap_or_default();
        return Err(format!("API Error: {}", err_text));
    }

    let raw_text = res.text().map_err(|e| format!("Failed to read response: {}", e))?;
    
    let response_json: serde_json::Value = serde_json::from_str(&raw_text)
        .map_err(|e| format!("Failed to parse JSON: {}\nRaw response: {}", e, raw_text))?;

    let content = response_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| format!("Invalid response format: {}", raw_text))?;

    Ok(content.to_string())
}