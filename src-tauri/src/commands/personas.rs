use crate::{models, db};
use tauri::command;
use std::fs;
use std::path::PathBuf;
use serde_json::json;

#[command]
pub fn get_personas() -> Result<Vec<models::Persona>, String> {
    match db::init_database() {
        Ok(_) => {},
        Err(e) => return Err(format!("Failed to init database: {}", e)),
    }

    db::get_all_personas()
        .map_err(|e| format!("Failed to get personas: {}", e))
}

#[command]
pub fn save_persona(persona: models::Persona) -> Result<(), String> {
    match db::init_database() {
        Ok(_) => {},
        Err(e) => return Err(format!("Failed to init database: {}", e)),
    }

    // Check if this is an update or insert
    let existing = db::get_all_personas().unwrap_or_default();
    let exists = existing.iter().any(|p| p.id == persona.id);

    if exists {
        db::update_persona(
            &persona.id,
            &persona.name,
            &persona.description,
            &persona.style_tags,
            &persona.provider_id,
        )
    } else {
        // Insert and ignore the returned ID
        db::insert_persona(
            &persona.name,
            &persona.description,
            &persona.style_tags,
            &persona.provider_id,
        ).map(|_| ())
    }
    .map_err(|e| format!("Failed to save persona: {}", e))
}

#[command]
pub fn delete_persona(id: String) -> Result<(), String> {
    db::delete_persona(&id)
        .map_err(|e| format!("Failed to delete persona: {}", e))
}

fn get_env_file() -> PathBuf {
    db::get_creator_dir().join(".env")
}

fn get_providers_file() -> PathBuf {
    db::get_creator_dir().join("providers.json")
}

#[command]
pub fn analyze_folder_style(folder_path: String, provider_id: String) -> Result<models::Persona, String> {
    match db::init_database() {
        Ok(_) => {},
        Err(e) => return Err(format!("Failed to init database: {}", e)),
    }

    // 1. Read contents of folder
    let mut combined_content = String::new();
    let mut file_count = 0;
    
    if let Ok(entries) = fs::read_dir(&folder_path) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "txt" || ext == "md" {
                        if let Ok(content) = fs::read_to_string(&path) {
                            combined_content.push_str(&format!("\n--- File: {:?} ---\n", path.file_name().unwrap_or_default()));
                            combined_content.push_str(&content);
                            file_count += 1;
                            if file_count >= 5 {
                                break; // read up to 5 files to avoid huge payloads
                            }
                        }
                    }
                }
            }
        }
    }

    if combined_content.is_empty() {
        return Err("No .txt or .md files found in the selected folder.".to_string());
    }

    // truncate to ~8000 chars to fit context limits safely
    if combined_content.len() > 8000 {
        // Find a safe character boundary near 8000 bytes
        let safe_end = combined_content.char_indices()
            .map(|(i, _)| i)
            .take_while(|&i| i < 8000)
            .last()
            .unwrap_or(0);
        combined_content.truncate(safe_end);
    }

    // 2. Load provider configuration
    let providers_file = get_providers_file();
    let content = fs::read_to_string(&providers_file)
        .map_err(|e| format!("Failed to read providers file: {}", e))?;
    let config: models::ProvidersConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse providers file: {}", e))?;
    
    let provider = config.providers.get(&provider_id)
        .ok_or_else(|| format!("Provider {} not found", provider_id))?;

    // Load API key
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
        return Err(format!("API Key for {} not found in .env", provider_id));
    }

    // 3. Make HTTP request
    let client = reqwest::blocking::Client::new();
    
    let system_prompt = "你是一个专业的内容风格分析师。请分析提供的文本内容，并提取出对应的创作者角色(Persona)信息。
请以 JSON 格式返回，包含以下三个字段：
1. name: 角色名称（如：资深科技博主、治愈系作家，控制在10个字以内）
2. description: 人设描述（概括该角色的语气、写作特点、擅长领域，控制在50个字以内）
3. styleTags: 风格标签（返回3-5个标签，如 '幽默风趣', '干货实用', '观点鲜明' 等）
请只返回纯净的 JSON 字符串，不要包含任何 markdown 格式包裹（不要用 ```json）。";

    let payload = json!({
        "model": provider.model,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": combined_content }
        ],
        "temperature": 0.3
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
        .map_err(|e| format!("Failed to parse response JSON: {}", e))?;

    let content = response_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "Invalid API response structure".to_string())?;

    // clean up possible markdown
    let content = content.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();

    #[derive(serde::Deserialize)]
    struct AiResult {
        name: String,
        description: String,
        #[serde(rename = "styleTags")]
        style_tags: Vec<String>,
    }

    let ai_result: AiResult = serde_json::from_str(content)
        .map_err(|e| format!("Failed to parse AI output: {} (Output was: {})", e, content))?;

    Ok(models::Persona {
        id: uuid::Uuid::new_v4().to_string(),
        name: ai_result.name,
        description: ai_result.description,
        style_tags: ai_result.style_tags,
        provider_id: provider_id,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}
