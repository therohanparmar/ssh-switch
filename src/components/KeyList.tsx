import type { SshKeySummary } from "../types";

type KeyListProps = {
  keys: SshKeySummary[];
  switching: string | null;
  deleting: string | null;
  onSwitch: (keyName: string) => void;
  onDelete: (keyName: string) => void;
};

const splitKeyPath = (value: string) => {
  const normalized = value.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return { identity: null as string | null, filename: value };
  }
  return {
    identity: parts.slice(0, -1).join("/"),
    filename: parts[parts.length - 1]
  };
};

export const KeyList = ({ keys, switching, deleting, onSwitch, onDelete }: KeyListProps) => {
  if (keys.length === 0) {
    return (
      <div className="panel-ghost p-6 text-sm text-muted">
        No SSH key pairs were found in the configured directory.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keys.map((key) => (
        <div
          key={key.key_name}
          className="panel-subtle flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
        >
          <div>
            {(() => {
              const { identity, filename } = splitKeyPath(key.key_name);
              return (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {identity ? (
                      <>
                        <span className="chip">Identity</span>
                        <code className="break-all text-sm">{identity}</code>
                      </>
                    ) : null}
                    {key.is_active ? <span className="chip-success">Active</span> : null}
                  </div>
                  <code
                    className="mt-2 block break-all rounded-xl bg-[var(--surface)] px-3 py-2 text-sm"
                    style={{ color: "var(--text)" }}
                  >
                    {filename}
                  </code>
                </>
              );
            })()}
            <p className="mt-2 text-sm text-muted">
              {key.email ?? "No email comment"} · {key.algorithm ?? "Unknown algorithm"}
            </p>
            <p className="mt-1 text-xs text-soft">{key.public_key_name}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-55"
              onClick={() => onSwitch(key.key_name)}
              type="button"
              disabled={switching === key.key_name || key.is_active}
            >
              {key.is_active ? "Current" : switching === key.key_name ? "Switching..." : "Switch"}
            </button>
            <button
              className="btn-danger px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-55"
              onClick={() => onDelete(key.key_name)}
              type="button"
              disabled={deleting === key.key_name}
            >
              {deleting === key.key_name ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
