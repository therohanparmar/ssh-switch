use crate::errors::{AppError, AppResult};
use crate::models::{ActiveKey, AppSettings, OperationResponse, PublicKeyMetadata, SshKeySummary};
use crate::settings::resolve_ssh_directory;
use std::ffi::OsStr;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

const ACTIVE_KEY_CANDIDATES: &[(&str, &str)] = &[
    ("id_ed25519", "id_ed25519.pub"),
    ("id_rsa", "id_rsa.pub"),
    ("id_ecdsa", "id_ecdsa.pub"),
    ("id_dsa", "id_dsa.pub"),
];

pub fn list_ssh_keys(settings: &AppSettings) -> AppResult<Vec<SshKeySummary>> {
    let ssh_dir = ensure_ssh_directory(settings)?;
    let active_contents = read_active_public_key_contents(&ssh_dir)?;
    let mut keys = Vec::new();

    collect_identity_keys(&ssh_dir, &active_contents, &mut keys)?;

    keys.sort_by(|left, right| left.key_name.cmp(&right.key_name));
    Ok(keys)
}

pub fn detect_active_key(settings: &AppSettings) -> AppResult<ActiveKey> {
    let ssh_dir = ensure_ssh_directory(settings)?;
    let all_keys = list_ssh_keys(settings)?;
    let active_contents = read_active_public_key_contents(&ssh_dir)?;

    if let Some(contents) = active_contents {
        if let Some(active_key) = all_keys.iter().find(|candidate| candidate.is_active) {
            return Ok(ActiveKey {
                key_name: active_key.key_name.clone(),
                public_key_name: active_key.public_key_name.clone(),
                email: active_key.email.clone(),
                algorithm: active_key.algorithm.clone(),
                exists: true,
            });
        }

        let fallback_candidate = ACTIVE_KEY_CANDIDATES
            .iter()
            .find_map(|(private_name, public_name)| {
                let public_path = ssh_dir.join(public_name);
                if public_path.exists() {
                    Some((private_name.to_string(), public_name.to_string(), public_path))
                } else {
                    None
                }
            });

        if let Some((private_name, public_name, public_path)) = fallback_candidate {
            let metadata = parse_public_key(&public_path)?;
            return Ok(ActiveKey {
                key_name: private_name,
                public_key_name: public_name,
                email: metadata.email,
                algorithm: metadata.algorithm,
                exists: !contents.is_empty(),
            });
        }
    }

    Ok(ActiveKey {
        key_name: "None".to_string(),
        public_key_name: "None".to_string(),
        email: None,
        algorithm: None,
        exists: false,
    })
}

pub fn switch_active_key(settings: &AppSettings, key_name: &str) -> AppResult<OperationResponse> {
    let ssh_dir = ensure_ssh_directory(settings)?;
    let relative_key_path = validate_relative_key_path(key_name)?;

    let source_private = ssh_dir.join(&relative_key_path);
    let source_public = source_private.with_extension("pub");
    if !source_private.exists() || !source_public.exists() {
        return Err(AppError::KeyNotFound);
    }

    let metadata = parse_public_key(&source_public)?;
    let target_private_name = active_name_for_algorithm(metadata.algorithm.as_deref());
    let target_public_name = format!("{target_private_name}.pub");
    let target_private = ssh_dir.join(target_private_name);
    let target_public = ssh_dir.join(&target_public_name);

    if source_private == target_private && source_public == target_public {
        let reloaded = refresh_ssh_agent(&target_private);
        return Ok(OperationResponse {
            message: "Selected key is already the active canonical SSH key.".to_string(),
            ssh_agent_reloaded: reloaded,
        });
    }

    backup_if_exists(&ssh_dir, &target_private)?;
    backup_if_exists(&ssh_dir, &target_public)?;

    fs::copy(&source_private, &target_private)?;
    fs::copy(&source_public, &target_public)?;
    set_permissions(&target_private, true)?;
    set_permissions(&target_public, false)?;

    let reloaded = refresh_ssh_agent(&target_private);
    Ok(OperationResponse {
        message: format!("Switched active SSH key to {key_name}."),
        ssh_agent_reloaded: reloaded,
    })
}

pub fn delete_ssh_key(settings: &AppSettings, key_name: &str) -> AppResult<OperationResponse> {
    let ssh_dir = ensure_ssh_directory(settings)?;
    let relative_key_path = validate_relative_key_path(key_name)?;
    let source_private = ssh_dir.join(&relative_key_path);
    let source_public = source_private.with_extension("pub");

    if !source_private.exists() || !source_public.exists() {
        return Err(AppError::KeyNotFound);
    }

    fs::remove_file(&source_private)?;
    fs::remove_file(&source_public)?;
    remove_empty_parent_directories(&ssh_dir, source_private.parent())?;

    Ok(OperationResponse {
        message: format!("Deleted SSH key {key_name}."),
        ssh_agent_reloaded: false,
    })
}

pub fn delete_backups(settings: &AppSettings) -> AppResult<OperationResponse> {
    let ssh_dir = ensure_ssh_directory(settings)?;
    let backup_dir = ssh_dir.join(".sshswitch-backups");

    if !backup_dir.exists() {
        return Ok(OperationResponse {
            message: "No backups found.".to_string(),
            ssh_agent_reloaded: false,
        });
    }

    if !backup_dir.is_dir() {
        return Err(AppError::Validation(
            "Backup path exists but is not a directory.".to_string(),
        ));
    }

    fs::remove_dir_all(&backup_dir)?;

    Ok(OperationResponse {
        message: "Backups deleted.".to_string(),
        ssh_agent_reloaded: false,
    })
}

pub fn generate_ssh_key(
    settings: &AppSettings,
    email: &str,
) -> AppResult<OperationResponse> {
    let ssh_dir = ensure_ssh_directory(settings)?;
    let email = email.trim();
    if email.is_empty() {
        return Err(AppError::Validation("Email is required.".to_string()));
    }

    let email_directory = sanitize_email_directory(email)?;
    let key_directory = ssh_dir.join(&email_directory);
    fs::create_dir_all(&key_directory)?;

    let key_path = key_directory.join("id_ed25519");
    if key_path.exists() || key_path.with_extension("pub").exists() {
        return Err(AppError::Validation(format!(
            "SSH key pair already exists for {email}."
        )));
    }

    let status = Command::new("ssh-keygen")
        .arg("-t")
        .arg("ed25519")
        .arg("-C")
        .arg(email)
        .arg("-f")
        .arg(&key_path)
        .arg("-N")
        .arg("")
        .status()
        .map_err(|error| match error.kind() {
            std::io::ErrorKind::NotFound => AppError::MissingSshKeygen,
            _ => AppError::Io(error),
        })?;

    if !status.success() {
        return Err(AppError::SshKeygenFailed(format!(
            "Process exited with status {status}"
        )));
    }

    let public_key = key_path.with_extension("pub");
    set_permissions(&key_path, true)?;
    set_permissions(&public_key, false)?;

    Ok(OperationResponse {
        message: format!("Generated a new SSH key pair at {}.", key_path.display()),
        ssh_agent_reloaded: false,
    })
}

fn ensure_ssh_directory(settings: &AppSettings) -> AppResult<PathBuf> {
    let ssh_dir = resolve_ssh_directory(settings)?;
    fs::create_dir_all(&ssh_dir)?;
    Ok(ssh_dir)
}

fn read_active_public_key_contents(ssh_dir: &Path) -> AppResult<Option<String>> {
    for (_, public_name) in ACTIVE_KEY_CANDIDATES {
        let path = ssh_dir.join(public_name);
        if path.exists() && path.is_file() {
            return Ok(Some(fs::read_to_string(path)?.trim().to_string()));
        }
    }

    Ok(None)
}

fn parse_public_key(path: &Path) -> AppResult<PublicKeyMetadata> {
    let contents = fs::read_to_string(path)?;
    let trimmed = contents.trim().to_string();
    let mut parts = trimmed.split_whitespace();
    let algorithm = parts.next().map(ToString::to_string);
    let _payload = parts.next();
    let email = parts.next().map(ToString::to_string);

    Ok(PublicKeyMetadata {
        algorithm,
        email,
        full_contents: trimmed,
    })
}

fn collect_identity_keys(
    ssh_dir: &Path,
    active_contents: &Option<String>,
    keys: &mut Vec<SshKeySummary>,
) -> AppResult<()> {
    for entry in fs::read_dir(ssh_dir)? {
        let entry = entry?;
        let path = entry.path();

        if !path.is_dir() || should_ignore_directory(&path) {
            continue;
        }

        collect_keys_in_directory(ssh_dir, &path, active_contents, keys)?;
    }

    Ok(())
}

fn collect_keys_in_directory(
    ssh_dir: &Path,
    directory: &Path,
    active_contents: &Option<String>,
    keys: &mut Vec<SshKeySummary>,
) -> AppResult<()> {
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let path = entry.path();

        if !path.is_file() || path.extension() == Some(OsStr::new("pub")) {
            continue;
        }

        // Inside identity folders we expect canonical filenames like `id_ed25519`.
        // We only avoid scanning root canonical files by not scanning the root directory at all.
        if should_ignore_private_key(&path) {
            continue;
        }

        let public_path = path.with_extension("pub");
        if !public_path.exists() || !public_path.is_file() {
            continue;
        }

        let key_name = relative_display_path(ssh_dir, &path)?;
        let public_key_name = relative_display_path(ssh_dir, &public_path)?;
        let metadata = parse_public_key(&public_path)?;
        let is_active = active_contents
            .as_ref()
            .is_some_and(|contents| metadata.full_contents == *contents);

        keys.push(SshKeySummary {
            key_name,
            public_key_name,
            email: metadata.email,
            algorithm: metadata.algorithm,
            is_active,
        });
    }

    Ok(())
}

fn should_ignore_directory(path: &Path) -> bool {
    matches!(
        path.file_name().and_then(OsStr::to_str),
        Some(".sshswitch-backups")
    )
}

fn should_ignore_private_key(path: &Path) -> bool {
    matches!(
        path.file_name().and_then(OsStr::to_str),
        Some("known_hosts")
            | Some("config")
            | Some("authorized_keys")
            | Some("authorized_keys2")
    )
}

// Intentionally no "canonical active filename" filter here: identity folders use the same names.

fn validate_relative_key_path(key_name: &str) -> AppResult<PathBuf> {
    let candidate = Path::new(key_name);
    if key_name.trim().is_empty() || candidate.is_absolute() {
        return Err(AppError::InvalidKeyName);
    }

    let mut normalized = PathBuf::new();
    for component in candidate.components() {
        match component {
            Component::Normal(part) => normalized.push(part),
            _ => return Err(AppError::InvalidKeyName),
        }
    }

    if normalized.as_os_str().is_empty() {
        return Err(AppError::InvalidKeyName);
    }

    Ok(normalized)
}

fn sanitize_email_directory(value: &str) -> AppResult<String> {
    let mut sanitized = String::with_capacity(value.len());
    for character in value.chars() {
        if character.is_ascii_alphanumeric() || matches!(character, '@' | '.' | '-' | '_') {
            sanitized.push(character);
        } else {
            sanitized.push('-');
        }
    }

    let trimmed = sanitized.trim_matches('-').to_string();
    if trimmed.is_empty() {
        return Err(AppError::InvalidKeyName);
    }

    Ok(trimmed)
}

fn relative_display_path(root: &Path, path: &Path) -> AppResult<String> {
    let relative = path
        .strip_prefix(root)
        .map_err(|_| AppError::Validation("Invalid key path".to_string()))?;
    let display = relative.to_string_lossy().replace('\\', "/");
    if display.is_empty() {
        return Err(AppError::Validation("Invalid key path".to_string()));
    }

    Ok(display)
}

fn remove_empty_parent_directories(ssh_dir: &Path, start: Option<&Path>) -> AppResult<()> {
    let mut current = start.map(Path::to_path_buf);

    while let Some(path) = current {
        if path == ssh_dir {
            break;
        }

        if fs::read_dir(&path)?.next().is_some() {
            break;
        }

        fs::remove_dir(&path)?;
        current = path.parent().map(Path::to_path_buf);
    }

    Ok(())
}

fn active_name_for_algorithm(algorithm: Option<&str>) -> &'static str {
    match algorithm.unwrap_or_default() {
        value if value.contains("ed25519") => "id_ed25519",
        value if value.contains("rsa") => "id_rsa",
        value if value.contains("ecdsa") => "id_ecdsa",
        value if value.contains("dsa") => "id_dsa",
        _ => "id_ed25519",
    }
}

fn backup_if_exists(ssh_dir: &Path, target: &Path) -> AppResult<()> {
    if !target.exists() {
        return Ok(());
    }

    let backup_dir = ssh_dir.join(".sshswitch-backups");
    fs::create_dir_all(&backup_dir)?;

    let file_name = file_name_string(target)?;
    let backup_name = format!("{}-{}", unix_timestamp(), file_name);
    fs::copy(target, backup_dir.join(backup_name))?;
    Ok(())
}

fn unix_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

fn file_name_string(path: &Path) -> AppResult<String> {
    path.file_name()
        .and_then(OsStr::to_str)
        .map(ToString::to_string)
        .ok_or_else(|| AppError::Validation("Invalid file name".to_string()))
}

fn refresh_ssh_agent(active_private_key: &Path) -> bool {
    let agent_socket_present = std::env::var_os("SSH_AUTH_SOCK").is_some();
    if !agent_socket_present {
        return false;
    }

    let clear_status = Command::new("ssh-add").arg("-D").status();
    let add_status = Command::new("ssh-add").arg(active_private_key).status();

    clear_status.map(|status| status.success()).unwrap_or(false)
        && add_status.map(|status| status.success()).unwrap_or(false)
}

#[cfg(unix)]
fn set_permissions(path: &Path, private_key: bool) -> AppResult<()> {
    use std::os::unix::fs::PermissionsExt;

    let mode = if private_key { 0o600 } else { 0o644 };
    fs::set_permissions(path, fs::Permissions::from_mode(mode))?;
    Ok(())
}

#[cfg(not(unix))]
fn set_permissions(_path: &Path, _private_key: bool) -> AppResult<()> {
    Ok(())
}
