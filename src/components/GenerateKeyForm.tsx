import { FormEvent, useState } from "react";

type GenerateKeyFormProps = {
  loading: boolean;
  onGenerate: (email: string) => Promise<void>;
};

export const GenerateKeyForm = ({ loading, onGenerate }: GenerateKeyFormProps) => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onGenerate(email.trim());
    setEmail("");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="email">
          Email / Key Comment
        </label>
        <input
          id="email"
          className="field"
          placeholder="dev@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="panel-subtle px-4 py-3 text-sm text-muted">
        <p>Key pair files will be created at:</p>
        <div className="mt-2 grid gap-2">
          <code className="block break-all rounded-xl bg-[var(--surface)] px-3 py-2 text-xs">
            {"{sshdir}/{email}/id_ed25519"}
          </code>
          <code className="block break-all rounded-xl bg-[var(--surface)] px-3 py-2 text-xs">
            {"{sshdir}/{email}/id_ed25519.pub"}
          </code>
        </div>
      </div>
      <button
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Generating..." : "Generate Key"}
      </button>
    </form>
  );
};
