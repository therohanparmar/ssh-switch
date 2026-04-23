use crate::errors::{AppError, AppResult};
use crate::models::AppSettings;
use std::fs;
use std::path::{Path, PathBuf};

pub fn load_settings() -> AppResult<AppSettings> {
    let path = settings_file_path()?;

    if !path.exists() {
        let defaults = AppSettings::default();
        persist_settings(&defaults)?;
        return Ok(defaults);
    }

    let raw = fs::read_to_string(path)?;
    let settings: AppSettings = serde_json::from_str(&raw)?;
    Ok(normalize_settings(settings))
}

pub fn persist_settings(settings: &AppSettings) -> AppResult<()> {
    let path = settings_file_path()?;
    let parent = path
        .parent()
        .ok_or_else(|| AppError::Validation("Invalid settings path".to_string()))?;

    let normalized = normalize_settings(settings.clone());
    let _ = resolve_ssh_directory(&normalized)?;

    fs::create_dir_all(parent)?;
    let raw = serde_json::to_string_pretty(&normalized)?;
    fs::write(path, raw)?;
    Ok(())
}

pub fn resolve_ssh_directory(settings: &AppSettings) -> AppResult<PathBuf> {
    let expanded = expand_home(&settings.ssh_directory)?;

    if !expanded.is_absolute() {
        return Err(AppError::Validation(
            "SSH directory must resolve to an absolute path".to_string(),
        ));
    }

    Ok(expanded)
}

fn normalize_settings(mut settings: AppSettings) -> AppSettings {
    if settings.ssh_directory.trim().is_empty() {
        settings.ssh_directory = AppSettings::default().ssh_directory;
    }

    if settings.theme != "light" && settings.theme != "dark" {
        settings.theme = AppSettings::default().theme;
    }

    settings
}

fn settings_file_path() -> AppResult<PathBuf> {
    let base = dirs::config_dir()
        .or_else(dirs::home_dir)
        .ok_or(AppError::MissingHomeDirectory)?;

    Ok(base.join("sshswitch").join("settings.json"))
}

fn expand_home(input: &str) -> AppResult<PathBuf> {
    if input == "~" || input.starts_with("~/") || input.starts_with("~\\") {
        let home = dirs::home_dir().ok_or(AppError::MissingHomeDirectory)?;
        let remainder = input.trim_start_matches('~');
        let trimmed = remainder
            .trim_start_matches(std::path::MAIN_SEPARATOR)
            .trim_start_matches('/')
            .trim_start_matches('\\');
        return Ok(home.join(trimmed));
    }

    Ok(Path::new(input).to_path_buf())
}
