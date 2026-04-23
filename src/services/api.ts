import { invoke } from "@tauri-apps/api/core";
import type {
  ActiveKey,
  AppSettings,
  DeleteKeyPayload,
  GenerateKeyPayload,
  OperationResponse,
  SshKeySummary,
  SwitchKeyPayload
} from "../types";

export const api = {
  getSettings: () => invoke<AppSettings>("get_settings"),
  saveSettings: (settings: AppSettings) =>
    invoke<AppSettings>("save_settings", { settings }),
  getActiveKey: () => invoke<ActiveKey>("get_active_key"),
  getSshKeys: () => invoke<SshKeySummary[]>("get_ssh_keys"),
  switchKey: (payload: SwitchKeyPayload) =>
    invoke<OperationResponse>("switch_key", { keyName: payload.keyName }),
  deleteKey: (payload: DeleteKeyPayload) =>
    invoke<OperationResponse>("delete_key", { keyName: payload.keyName }),
  deleteBackups: () => invoke<OperationResponse>("delete_backups"),
  generateKey: (payload: GenerateKeyPayload) =>
    invoke<OperationResponse>("generate_key", payload)
};
