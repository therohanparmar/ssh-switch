mod commands;
mod errors;
mod models;
mod settings;
mod ssh;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_ssh_keys,
            commands::get_active_key,
            commands::switch_key,
            commands::delete_key,
            commands::delete_backups,
            commands::generate_key,
            commands::get_settings,
            commands::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running SSHSwitch");
}
