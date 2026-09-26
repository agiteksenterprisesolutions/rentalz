"use client";

import { FileText } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatBytes } from "@/utils/format";

function Attachment({ file }) {
  return (
    <span className="mt-1.5 flex items-center gap-2 rounded-control border border-current/25 px-2 py-1.5 font-mono text-[11px] tracking-[0.04em] uppercase opacity-90">
      <FileText aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="truncate">{file.name}</span>
      <span className="shrink-0 opacity-70">{formatBytes(file.size)}</span>
    </span>
  );
}

function Message({ message }) {
  if (message.role === "system") {
    return (
      <li className="type-body-sm mx-auto max-w-[90%] text-center text-neutral-700">{message.text}</li>
    );
  }

  const mine = message.role === "user";
  return (
    <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`bubble ${mine ? "bubble-user" : "bubble-agent"}`}>
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
        {message.attachments?.map((file) => (
          <Attachment key={file.id} file={file} />
        ))}
      </div>
    </li>
  );
}

// Three dots in a bubble while the agent is composing its answer.
function TypingBubble() {
  return (
    <li className="flex justify-start">
      <p className="bubble bubble-agent flex items-center gap-1.5 py-space-md" aria-label="The assistant is typing">
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden="true" className="typing-dot size-1.5 rounded-full bg-neutral-400" />
        ))}
      </p>
    </li>
  );
}

export default function ChatThread({ messages, agentTyping }) {
  const endRef = useRef(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, agentTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-space-md py-space-md">
      <ul className="flex flex-col gap-space-sm" aria-live="polite" aria-relevant="additions">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {agentTyping && <TypingBubble />}
      </ul>
      <div ref={endRef} />
    </div>
  );
}
