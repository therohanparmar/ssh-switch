use crate::models::{ActiveKey, AppSettings, OperationResponse, SshKeySummary};
use crate::settings::{load_settings, persist_settings};
use crate::ssh::{
    delete_backups as delete_backups_impl, delete_ssh_key, detect_active_key, generate_ssh_key, list_ssh_keys,
    switch_active_key,
};

fn into_tauri_result<T>(result: crate::errors::AppResult<T>) -> Result<T, String> {
    result.map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_ssh_keys() -> Result<Vec<SshKeySummary>, String> {
    let settings = into_tauri_result(load_settings())?;
    into_tauri_result(list_ssh_keys(&settings))
}

#[tauri::command]
pub fn get_active_key() -> Result<ActiveKey, String> {
    let settings = into_tauri_result(load_settings())?;
    into_tauri_result(detect_active_key(&settings))
}

#[tauri::command]
pub fn switch_key(key_name: String) -> Result<OperationResponse, String> {
    let settings = into_tauri_result(load_settings())?;
    into_tauri_result(switch_active_key(&settings, &key_name))
}

#[tauri::command]
pub fn delete_key(key_name: String) -> Result<OperationResponse, String> {
    let settings = into_tauri_result(load_settings())?;
    into_tauri_result(delete_ssh_key(&settings, &key_name))
}

#[tauri::command]
pub fn delete_backups() -> Result<OperationResponse, String> {
    let settings = into_tauri_result(load_settings())?;
    into_tauri_result(delete_backups_impl(&settings))
}

#[tauri::command]
pub fn generate_key(email: String, key_name: Option<String>) -> Result<OperationResponse, String> {
    let settings = into_tauri_result(load_settings())?;
    let _ = key_name;
    into_tauri_result(generate_ssh_key(&settings, &email))
}

#[tauri::command]
pub fn get_settings() -> Result<AppSettings, String> {
    into_tauri_result(load_settings())
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<AppSettings, String> {
    into_tauri_result(persist_settings(&settings))?;
    into_tauri_result(load_settings())
}
