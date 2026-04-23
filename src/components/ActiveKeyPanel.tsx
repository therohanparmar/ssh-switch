import type { ActiveKey } from "../types";

type ActiveKeyPanelProps = {
  activeKey: ActiveKey | null;
  sshDirectory: string;
};

const keyBasename = (value: string) => {
  const normalized = value.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts.length === 0 ? value : parts[parts.length - 1];
};

export const ActiveKeyPanel = ({ activeKey, sshDirectory }: ActiveKeyPanelProps) => {
  if (!activeKey || !activeKey.exists) {
    return (
      <div className="space-y-4">
        <div className="panel-subtle p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Configured Directory
          </p>
          <p className="mt-3 break-all font-mono text-sm" style={{ color: "var(--text)" }}>
            {sshDirectory}
          </p>
        </div>
        <div className="panel-ghost p-6 text-sm text-muted">
          <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            No active SSH key detected
          </p>
          <p className="mt-2">
            SSH-Switch looks for canonical active files such as <code>id_ed25519</code> and{" "}
            <code>id_rsa</code>.
          </p>
        </div>
      </div>
    );
  }

  const filename = keyBasename(activeKey.key_name);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="panel-subtle p-5 sm:col-span-2 xl:col-span-1">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Configured Directory
        </p>
        <p className="mt-3 break-all font-mono text-sm" style={{ color: "var(--text)" }}>
          {sshDirectory}
        </p>
      </div>
      <div className="panel-subtle p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Key Name</p>
        <code className="mt-3 block break-all rounded-xl bg-[var(--surface)] px-3 py-2 text-sm">
          {filename}
        </code>
      </div>
      <div className="panel-subtle p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Email</p>
        <p className="mt-3 break-all text-lg" style={{ color: "var(--text)" }}>
          {activeKey.email ?? "Unavailable"}
        </p>
      </div>
      <div className="panel-subtle p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Algorithm</p>
        <p className="mt-3 text-lg font-semibold" style={{ color: "var(--text)" }}>
          {activeKey.algorithm ?? "Unknown"}
        </p>
      </div>
    </div>
  );
};
