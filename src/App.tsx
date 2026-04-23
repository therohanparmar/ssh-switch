import { useEffect, useState } from "react";
import { ActiveKeyPanel } from "./components/ActiveKeyPanel";
import { GenerateKeyForm } from "./components/GenerateKeyForm";
import { KeyList } from "./components/KeyList";
import { SectionCard } from "./components/SectionCard";
import { SettingsForm } from "./components/SettingsForm";
import { ToastViewport } from "./components/ToastViewport";
import { useSshData } from "./hooks/useSshData";
import { useToast } from "./hooks/useToast";
import { api } from "./services/api";
import type { AppSettings } from "./types";
import appMeta from "../app.meta.json";

const SunIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 2.75V5.25M12 18.75V21.25M21.25 12H18.75M5.25 12H2.75M18.54 5.46L16.77 7.23M7.23 16.77L5.46 18.54M18.54 18.54L16.77 16.77M7.23 7.23L5.46 5.46"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 14.25A8.25 8.25 0 0 1 9.75 4 8.25 8.25 0 1 0 20 14.25Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const formatInvokeError = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || String(error);
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    try {
      return JSON.stringify(error);
    } catch {
      // fall through
    }
  }
  return "Unknown error";
};

const App = () => {
  const { settings, activeKey, keys, loading, refreshing, error, reload } = useSshData();
  const { toasts, showToast, dismissToast } = useToast();
  const [theme, setTheme] = useState<AppSettings["theme"]>("light");
  const [switchingKey, setSwitchingKey] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deleteBackupsOpen, setDeleteBackupsOpen] = useState(false);
  const [deletingBackups, setDeletingBackups] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.title = appMeta.title;
  }, []);

  const handleSwitch = async (keyName: string) => {
    setSwitchingKey(keyName);

    try {
      const result = await api.switchKey({ keyName });
      showToast(result.message, "success");
      await reload();
    } catch (switchError) {
      // Keep a raw log for debugging (DevTools console).
      console.error("switch_key failed", { keyName, switchError });
      showToast(`Switch failed: ${formatInvokeError(switchError)}`, "error");
    } finally {
      setSwitchingKey(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    setDeletingKey(deleteCandidate);
    try {
      const result = await api.deleteKey({ keyName: deleteCandidate });
      showToast(result.message, "success");
      setDeleteCandidate(null);
      await reload();
    } catch (deleteError) {
      console.error("delete_key failed", { deleteCandidate, deleteError });
      showToast(`Delete failed: ${formatInvokeError(deleteError)}`, "error");
    } finally {
      setDeletingKey(null);
    }
  };

  const handleGenerate = async (email: string) => {
    setGenerating(true);

    try {
      const result = await api.generateKey({ email });
      showToast(result.message, "success");
      await reload();
    } catch (generateError) {
      console.error("generate_key failed", { email, generateError });
      showToast(`Generate failed: ${formatInvokeError(generateError)}`, "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteBackups = async () => {
    setDeletingBackups(true);
    try {
      const result = await api.deleteBackups();
      showToast(result.message, "success");
      setDeleteBackupsOpen(false);
    } catch (deleteError) {
      console.error("delete_backups failed", { deleteError });
      showToast(`Delete backups failed: ${formatInvokeError(deleteError)}`, "error");
    } finally {
      setDeletingBackups(false);
    }
  };

  const handleSaveSettings = async (nextSettings: AppSettings) => {
    setSavingSettings(true);

    try {
      const saved = await api.saveSettings(nextSettings);
      setTheme(saved.theme);
      showToast("Settings saved.", "success");
      await reload();
    } catch (settingsError) {
      console.error("save_settings failed", { nextSettings, settingsError });
      showToast(`Save settings failed: ${formatInvokeError(settingsError)}`, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleThemeToggle = async () => {
    if (!settings) {
      return;
    }

    const nextTheme: AppSettings["theme"] = theme === "light" ? "dark" : "light";
    const previousTheme = theme;
    setTheme(nextTheme);

    try {
      await api.saveSettings({ ...settings, theme: nextTheme });
    } catch (toggleError) {
      setTheme(previousTheme);
      console.error("theme toggle failed", { nextTheme, toggleError });
      showToast(`Theme update failed: ${formatInvokeError(toggleError)}`, "error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      {deleteCandidate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4">
          <div className="panel z-50 w-full max-w-md p-6">
            <p className="section-title">Delete SSH Key</p>
            <p className="mt-3 text-sm text-muted">
              Delete <code>{deleteCandidate}</code>? This removes the private and public key files.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn-secondary px-4 py-2"
                onClick={() => setDeleteCandidate(null)}
                type="button"
                disabled={Boolean(deletingKey)}
              >
                Cancel
              </button>
              <button
                className="btn-danger px-4 py-2"
                onClick={() => void handleDelete()}
                type="button"
                disabled={Boolean(deletingKey)}
              >
                {deletingKey ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {deleteBackupsOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4">
          <div className="panel z-50 w-full max-w-md p-6">
            <p className="section-title">Delete Backups</p>
            <p className="mt-3 text-sm text-muted">
              This deletes all files under <code>.sshswitch-backups</code> in your configured SSH
              directory.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn-secondary px-4 py-2"
                onClick={() => setDeleteBackupsOpen(false)}
                type="button"
                disabled={deletingBackups}
              >
                Cancel
              </button>
              <button
                className="btn-danger px-4 py-2"
                onClick={() => void handleDeleteBackups()}
                type="button"
                disabled={deletingBackups}
              >
                {deletingBackups ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="app-shell flex-1 pb-24">
        <header className="panel mb-8 p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="section-eyebrow">
                Desktop SSH Manager
              </p>
              <h1
                className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl"
                style={{ color: "var(--text)" }}
              >
                SSH-Switch
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:text-base">
                Manage multiple SSH identities, switch the active canonical key, and generate new
                key pairs without exposing private key contents to the UI.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="btn-secondary inline-flex items-center justify-center p-3"
                disabled={!settings}
                onClick={() => void handleThemeToggle()}
                type="button"
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? <MoonIcon /> : <SunIcon />}
              </button>
              <button
                className="btn-primary px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                disabled={refreshing}
                onClick={() => void reload()}
                type="button"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="panel p-10 text-center text-lg text-muted">
            Loading SSH workspace...
          </div>
        ) : error ? (
          <div className="panel p-8 text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </div>
        ) : settings ? (
          <div className="space-y-6">
            <SectionCard title="Active Key" eyebrow="Current Identity">
              <ActiveKeyPanel activeKey={activeKey} sshDirectory={settings.ssh_directory} />
            </SectionCard>

            <SectionCard title="Available Keys" eyebrow="Inventory">
              <KeyList
                keys={keys}
                switching={switchingKey}
                deleting={deletingKey}
                onSwitch={handleSwitch}
                onDelete={setDeleteCandidate}
              />
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
              <SectionCard title="Generate Key" eyebrow="Create">
                <GenerateKeyForm loading={generating} onGenerate={handleGenerate} />
              </SectionCard>
              </div>

              <div className="space-y-6">
              <SectionCard title="Settings" eyebrow="Workspace">
                <SettingsForm
                  settings={{ ...settings, theme }}
                  saving={savingSettings}
                  onSave={handleSaveSettings}
                />
                <div className="mt-6 border-t pt-6" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    Backups
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Clear switch-created backups stored in <code>.sshswitch-backups</code>.
                  </p>
                  <button
                    className="btn-danger mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() => setDeleteBackupsOpen(true)}
                    disabled={deletingBackups}
                  >
                    Delete Backups
                  </button>
                </div>
              </SectionCard>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <footer
        className="sticky bottom-0 border-t"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--surface) 92%, transparent)"
        }}
      >
        <div className="app-shell py-4">
          <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
            <p className="text-muted">
              Author:{" "}
              {appMeta.author.url ? (
                <a
                  href={appMeta.author.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                  style={{ color: "var(--text)" }}
                >
                  {appMeta.author.displayName}
                </a>
              ) : (
                <span style={{ color: "var(--text)" }}>{appMeta.author.name}</span>
              )}
            </p>
            <p className="text-soft">
              <span className="text-muted">v{appMeta.version}</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
