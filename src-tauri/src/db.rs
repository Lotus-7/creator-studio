use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use crate::models;

pub fn get_creator_dir() -> PathBuf {
    dirs::home_dir()
        .expect("Unable to determine home directory")
        .join(".creator")
}

pub fn get_db_path() -> PathBuf {
    get_creator_dir().join("history.db")
}

pub fn ensure_config_dir() {
    let creator_dir = get_creator_dir();
    if !creator_dir.exists() {
        let _ = std::fs::create_dir_all(&creator_dir);
    }
}

pub fn get_db_connection() -> SqliteResult<Connection> {
    ensure_config_dir();

    let db_path = get_db_path();
    let conn = Connection::open(db_path)?;

    // Enable WAL mode for better concurrent access
    conn.pragma_update(None, "journal_mode", "WAL")?;

    Ok(conn)
}

pub fn init_database() -> SqliteResult<()> {
    let conn = get_db_connection()?;

    // Create history table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            idea TEXT NOT NULL,
            result TEXT NOT NULL,
            persona_id TEXT,
            provider TEXT,
            model TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Create personas table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS personas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            style_tags TEXT,
            provider_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Create indexes for better search performance
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_history_type ON history(type)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at)",
        [],
    )?;

    Ok(())
}

pub fn insert_history(
    history_type: &str,
    idea: &str,
    result: &str,
    persona_id: Option<&str>,
    provider: Option<&str>,
    model: Option<&str>,
) -> SqliteResult<String> {
    let conn = get_db_connection()?;
    let id = uuid::Uuid::new_v4().to_string();
    let created_at = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO history (id, type, idea, result, persona_id, provider, model, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        (
            &id,
            history_type,
            idea,
            result,
            persona_id,
            provider,
            model,
            &created_at,
        ),
    )?;

    Ok(id)
}

pub fn get_all_history() -> SqliteResult<Vec<models::History>> {
    let conn = get_db_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, type, idea, result, persona_id, provider, model, created_at
         FROM history
         ORDER BY created_at DESC"
    )?;

    let history_iter = stmt.query_map([], |row| {
        Ok(models::History {
            id: row.get(0)?,
            history_type: row.get(1)?,
            idea: row.get(2)?,
            result: row.get(3)?,
            persona_id: row.get(4)?,
            provider: row.get(5)?,
            model: row.get(6)?,
            created_at: row.get(7)?,
        })
    })?;

    history_iter.collect()
}

pub fn delete_history(id: &str) -> SqliteResult<()> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM history WHERE id = ?1", [id])?;
    Ok(())
}

pub fn clear_history() -> SqliteResult<()> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM history", [])?;
    Ok(())
}

pub fn search_history(query: &str) -> SqliteResult<Vec<models::History>> {
    let conn = get_db_connection()?;
    let pattern = format!("%{}%", query);

    let mut stmt = conn.prepare(
        "SELECT id, type, idea, result, persona_id, provider, model, created_at
         FROM history
         WHERE idea LIKE ?1 OR result LIKE ?1
         ORDER BY created_at DESC"
    )?;

    let history_iter = stmt.query_map([&pattern], |row| {
        Ok(models::History {
            id: row.get(0)?,
            history_type: row.get(1)?,
            idea: row.get(2)?,
            result: row.get(3)?,
            persona_id: row.get(4)?,
            provider: row.get(5)?,
            model: row.get(6)?,
            created_at: row.get(7)?,
        })
    })?;

    history_iter.collect()
}

pub fn insert_persona(
    name: &str,
    description: &str,
    style_tags: &[String],
    provider_id: &str,
) -> SqliteResult<String> {
    let conn = get_db_connection()?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let tags_json = serde_json::to_string(style_tags).unwrap_or_default();

    conn.execute(
        "INSERT INTO personas (id, name, description, style_tags, provider_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (&id, name, description, &tags_json, provider_id, &now, &now),
    )?;

    Ok(id)
}

pub fn update_persona(
    id: &str,
    name: &str,
    description: &str,
    style_tags: &[String],
    provider_id: &str,
) -> SqliteResult<()> {
    let conn = get_db_connection()?;
    let now = chrono::Utc::now().to_rfc3339();
    let tags_json = serde_json::to_string(style_tags).unwrap_or_default();

    conn.execute(
        "UPDATE personas
         SET name = ?1, description = ?2, style_tags = ?3, provider_id = ?4, updated_at = ?5
         WHERE id = ?6",
        (name, description, &tags_json, provider_id, &now, id),
    )?;

    Ok(())
}

pub fn get_all_personas() -> SqliteResult<Vec<models::Persona>> {
    let conn = get_db_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, description, style_tags, provider_id, created_at, updated_at
         FROM personas
         ORDER BY created_at DESC"
    )?;

    let personas_iter = stmt.query_map([], |row| {
        let tags_json: String = row.get(3)?;
        let style_tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

        Ok(models::Persona {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            style_tags,
            provider_id: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    personas_iter.collect()
}

pub fn delete_persona(id: &str) -> SqliteResult<()> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM personas WHERE id = ?1", [id])?;
    Ok(())
}
