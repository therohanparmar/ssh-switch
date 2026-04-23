import type { ToastItem } from "../hooks/useToast";

type ToastViewportProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

const Icon = ({ tone }: { tone: ToastItem["tone"] }) => {
  if (tone === "success") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6.5 9.5 17 4 11.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 9v4.2"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M12 16.9h.01"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path
          d="M10.2 4.8h3.6L22 19.2H2L10.2 4.8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 16.2v-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M12 7.5h.01"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
};

export const ToastViewport = ({ toasts, onDismiss }: ToastViewportProps) => (
  <div
    className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3"
    role="status"
    aria-live="polite"
  >
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className="toast"
        data-tone={toast.tone}
        style={{ ["--ttl-ms" as never]: `${toast.ttlMs}ms` } as React.CSSProperties}
      >
        <div className="toast__icon">
          <Icon tone={toast.tone} />
        </div>
        <div className="toast__body">
          <p className="toast__message">{toast.message}</p>
        </div>
        <button
          className="toast__close"
          onClick={() => onDismiss(toast.id)}
          type="button"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M6.8 6.8 17.2 17.2M17.2 6.8 6.8 17.2"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="toast__bar" />
      </div>
    ))}
  </div>
);
