export type AppSettings = {
  ssh_directory: string;
  theme: "light" | "dark";
};

export type ActiveKey = {
  key_name: string;
  public_key_name: string;
  email: string | null;
  algorithm: string | null;
  exists: boolean;
};

export type SshKeySummary = {
  key_name: string;
  public_key_name: string;
  email: string | null;
  algorithm: string | null;
  is_active: boolean;
};

export type OperationResponse = {
  message: string;
  ssh_agent_reloaded: boolean;
};

export type GenerateKeyPayload = {
  email: string;
};

export type SwitchKeyPayload = {
  keyName: string;
};

export type DeleteKeyPayload = {
  keyName: string;
};
