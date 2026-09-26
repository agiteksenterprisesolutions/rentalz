"use client";

import { Paperclip } from "lucide-react";
import { useRef } from "react";
import { formatBytes } from "@/utils/format";
import { MAX_ATTACHMENTS, MAX_ATTACHMENT_BYTES } from "./session";

const ACCEPT = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt";

/*
 * The paperclip and its hidden file input, with the size and count rules in one place. It is used from both
 * the composer (where files wait in the box until you send) and voice mode (where they go straight away).
 */
export default function AttachButton({ onFiles, onNotice, remaining = MAX_ATTACHMENTS, disabled = false }) {
  const input = useRef(null);

  const choose = (chosen) => {
    const tooBig = chosen.filter((file) => file.size > MAX_ATTACHMENT_BYTES);
    const accepted = chosen.filter((file) => file.size <= MAX_ATTACHMENT_BYTES).slice(0, remaining);

    if (tooBig.length > 0) onNotice?.(`Files must be ${formatBytes(MAX_ATTACHMENT_BYTES)} or smaller.`);
    else if (chosen.length > remaining) onNotice?.(`You can attach up to ${MAX_ATTACHMENTS} files.`);
    else onNotice?.(null);

    if (accepted.length > 0) onFiles(accepted);
  };

  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          choose(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={disabled || remaining <= 0}
        aria-label="Attach a file"
        className="btn btn-ghost btn-icon btn-sm shrink-0 rounded-full"
      >
        <Paperclip />
      </button>
    </>
  );
}
