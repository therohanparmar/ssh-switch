use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    Validation(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("Missing home directory on this system")]
    MissingHomeDirectory,
    #[error("ssh-keygen is not available on PATH")]
    MissingSshKeygen,
    #[error("Selected SSH key pair was not found")]
    KeyNotFound,
    #[error("Invalid SSH key name")]
    InvalidKeyName,
    #[error("ssh-keygen failed: {0}")]
    SshKeygenFailed(String),
}

pub type AppResult<T> = Result<T, AppError>;
