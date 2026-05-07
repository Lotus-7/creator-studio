mod models;
mod db;
mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database on startup
    let _ = db::init_database();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // Settings commands
            get_settings,
            save_provider,
            save_provider_with_url,
            set_default_provider,
            test_connection,
            // Generate commands
            generate_content,
            ask_ai,
            // History commands
            get_history,
            search_history,
            delete_history,
            clear_history,
            // Persona commands
            get_personas,
            save_persona,
            delete_persona,
            analyze_folder_style,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
