use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppSettings {
    pub ssh_directory: String,
    pub theme: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            ssh_directory: "~/.ssh".to_string(),
            theme: "light".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct SshKeySummary {
    pub key_name: String,
    pub public_key_name: String,
    pub email: Option<String>,
    pub algorithm: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ActiveKey {
    pub key_name: String,
    pub public_key_name: String,
    pub email: Option<String>,
    pub algorithm: Option<String>,
    pub exists: bool,
}

#[derive(Debug, Serialize)]
pub struct OperationResponse {
    pub message: String,
    pub ssh_agent_reloaded: bool,
}

#[derive(Debug, Clone)]
pub struct PublicKeyMetadata {
    pub algorithm: Option<String>,
    pub email: Option<String>,
    pub full_contents: String,
}
