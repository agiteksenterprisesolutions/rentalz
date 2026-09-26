"use client";

import { Mic, SendHorizontal, X } from "lucide-react";
import { useRef, useState } from "react";
import { formatBytes } from "@/utils/format";
import AttachButton from "./AttachButton";
import { MAX_ATTACHMENTS } from "./session";

export default function Composer({ onSend, onStartVoice, voiceActive, disabled }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [notice, setNotice] = useState(null);
  const textarea = useRef(null);

  const submit = (event) => {
    event.preventDefault();
    if (disabled || (!text.trim() && files.length === 0)) return;
    onSend(text, files);
    setText("");
    setFiles([]);
    setNotice(null);
    if (textarea.current) textarea.current.style.height = "";
  };

  // Enter sends, Shift+Enter starts a new line.
  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) submit(event);
  };

  // The box grows with the message, up to about five lines.
  const grow = (event) => {
    setText(event.target.value);
    const box = event.target;
    box.style.height = "auto";
    // scrollHeight excludes the border, so add it back or the box ends up one scrollbar short.
    box.style.height = `${Math.min(box.scrollHeight + 3, 128)}px`;
  };

  return (
    <form onSubmit={submit} className="border-t border-neutral-200 bg-white px-space-md py-space-sm">
      {files.length > 0 && (
        <ul className="mb-space-sm flex flex-wrap gap-1.5">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center gap-1.5 rounded-control border border-neutral-200 bg-surface-container-low py-1 pl-2 pr-1 font-mono text-[11px]">
              <span className="max-w-32 truncate">{file.name}</span>
              <span className="text-neutral-700">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="flex size-5 items-center justify-center rounded-[2px] text-neutral-700 hover:bg-neutral-900/10 hover:text-neutral-900"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {notice && <p className="type-body-sm mb-space-sm text-error">{notice}</p>}

      <div className="flex items-end gap-1.5">
        <AttachButton
          disabled={disabled}
          remaining={MAX_ATTACHMENTS - files.length}
          onNotice={setNotice}
          onFiles={(chosen) => setFiles((current) => [...current, ...chosen])}
        />

        <label className="sr-only" htmlFor="assistant-message">
          Message the assistant
        </label>
        <textarea
          id="assistant-message"
          ref={textarea}
          rows={1}
          value={text}
          onChange={grow}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="Type a message…"
          className="textarea h-12 max-h-32 min-h-12 flex-1 resize-none overflow-y-auto rounded-[1.5rem] px-4 py-2.5"
        />

        <button
          type="button"
          onClick={onStartVoice}
          disabled={disabled || voiceActive}
          aria-label="Start voice chat"
          className="btn btn-ghost btn-icon btn-sm shrink-0 rounded-full"
        >
          <Mic />
        </button>
        <button type="submit" disabled={disabled || (!text.trim() && files.length === 0)} aria-label="Send message" className="btn btn-primary btn-icon btn-sm shrink-0 rounded-full">
          <SendHorizontal />
        </button>
      </div>
    </form>
  );
}
