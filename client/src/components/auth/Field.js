"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

// Labelled input. Pass `type="password"` for a show/hide toggle. `hint` and `error` are linked with aria-describedby.
export default function Field({ label, hint, error, type = "text", className = "", ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={`input ${isPassword ? "pr-12" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-neutral-700 hover:text-neutral-900"
          >
            {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          </button>
        )}
      </div>
      {hint && !error && <span id={`${id}-hint`} className="field-hint">{hint}</span>}
      {error && <span id={`${id}-error`} className="field-error">{error}</span>}
    </div>
  );
}
