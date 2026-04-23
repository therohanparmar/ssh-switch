import { FormEvent, useEffect, useState } from "react";
import type { AppSettings } from "../types";

type SettingsFormProps = {
  settings: AppSettings;
  saving: boolean;
  onSave: (settings: AppSettings) => Promise<void>;
};

export const SettingsForm = ({ settings, saving, onSave }: SettingsFormProps) => {
  const [sshDirectory, setSshDirectory] = useState(settings.ssh_directory);
  const [theme, setTheme] = useState<AppSettings["theme"]>(settings.theme);

  useEffect(() => {
    setSshDirectory(settings.ssh_directory);
    setTheme(settings.theme);
  }, [settings]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      ssh_directory: sshDirectory.trim(),
      theme
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="sshDirectory">
          SSH Directory
        </label>
        <input
          id="sshDirectory"
          className="field"
          value={sshDirectory}
          onChange={(event) => setSshDirectory(event.target.value)}
          placeholder="~/.ssh"
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="theme">
          Default Theme
        </label>
        <select
          id="theme"
          className="field"
          value={theme}
          onChange={(event) => setTheme(event.target.value as AppSettings["theme"])}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <button
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        type="submit"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
};
