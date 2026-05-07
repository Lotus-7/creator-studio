use crate::{models, db};
use tauri::command;

#[command]
pub fn get_history(filters: models::HistoryFilters) -> Result<Vec<models::History>, String> {
    match db::init_database() {
        Ok(_) => {},
        Err(e) => return Err(format!("Failed to init database: {}", e)),
    }

    let history = db::get_all_history()
        .map_err(|e| format!("Failed to get history: {}", e))?;

    // Apply filters if provided
    let filtered: Vec<models::History> = history
        .into_iter()
        .filter(|h| {
            if let Some(ref filter_type) = filters.filter_type {
                if filter_type != "all" && &h.history_type != filter_type {
                    return false;
                }
            }
            if let Some(ref search) = filters.search {
                if !search.is_empty() &&
                   !h.idea.to_lowercase().contains(search) &&
                   !h.result.to_lowercase().contains(search) {
                    return false;
                }
            }
            true
        })
        .collect();

    Ok(filtered)
}

#[command]
pub fn search_history(query: String) -> Result<Vec<models::History>, String> {
    match db::init_database() {
        Ok(_) => {},
        Err(e) => return Err(format!("Failed to init database: {}", e)),
    }

    if query.is_empty() {
        return db::get_all_history()
            .map_err(|e| format!("Failed to get history: {}", e));
    }

    db::search_history(&query)
        .map_err(|e| format!("Failed to search history: {}", e))
}

#[command]
pub fn delete_history(id: String) -> Result<(), String> {
    db::delete_history(&id)
        .map_err(|e| format!("Failed to delete history: {}", e))
}

#[command]
pub fn clear_history() -> Result<(), String> {
    db::clear_history()
        .map_err(|e| format!("Failed to clear history: {}", e))
}
