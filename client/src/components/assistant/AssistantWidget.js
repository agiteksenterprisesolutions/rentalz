"use client";

import { Loader2, MessageSquare, Minus, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatThread from "./ChatThread";
import Composer from "./Composer";
import VoiceSession from "./VoiceSession";
import { STATUS, useAssistantSession } from "./session";

const OPENERS = ["Find me an excavator in Dubai", "What does a featured ad cost?", "How do I list my machine?"];

// The nudge beside the launcher: long enough to be read, short enough not to be in the way.
const NUDGE_DELAY_MS = 2500;
const NUDGE_KEY = "assistant-nudge";

function StatusPill({ status }) {
  const shown = {
    [STATUS.CONNECTING]: ["Connecting", "border-neutral-200 bg-canvas text-neutral-700"],
    [STATUS.LIVE]: ["Online", "pill-available pill-dot"],
    [STATUS.ENDED]: ["Ended", "pill-dark"],
    [STATUS.ERROR]: ["Offline", "pill-danger"],
  }[status];

  if (!shown) return null;
  const [label, tone] = shown;
  return <span className={`pill pill-sm ${tone}`}>{label}</span>;
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [voice, setVoice] = useState(false);
  const [nudge, setNudge] = useState(false);
  const { status, messages, agentTyping, error, start, send, end, reset } = useAssistantSession();
  const panel = useRef(null);
  const launcher = useRef(null);

  // The nudge appears once the visitor has settled on the page, and stays away for the rest of the visit
  // as soon as it is dismissed or the assistant is opened.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(NUDGE_KEY) === "seen") return;
    } catch {
      // private browsing: show it, just do not remember
    }
    const timer = setTimeout(() => setNudge(true), NUDGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const hideNudge = () => {
    setNudge(false);
    try {
      sessionStorage.setItem(NUDGE_KEY, "seen");
    } catch {
      // nothing to remember it with; it will show again next page
    }
  };

  // Escape closes the panel and hands focus back to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcher.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const endChat = () => {
    setVoice(false);
    end();
  };

  const startOver = () => {
    setVoice(false);
    reset();
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-space-sm md:bottom-8 md:right-8">
        {nudge && !open && (
          <div className="nudge-in card relative flex max-w-60 items-center py-space-sm pl-space-md pr-space-lg shadow-floating">
            <button
              type="button"
              onClick={() => {
                hideNudge();
                setOpen(true);
              }}
              className="text-left"
            >
              <span className="type-headline-sm block text-[0.9375rem]">Need a hand?</span>
              <span className="type-body-sm block text-neutral-700">Ask me about machines, rates or listing your own.</span>
            </button>
            <button
              type="button"
              onClick={hideNudge}
              aria-label="Dismiss"
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        )}

        <button
          ref={launcher}
          type="button"
          onClick={() => {
            hideNudge();
            setOpen((value) => !value);
          }}
          aria-expanded={open}
          aria-controls="assistant-panel"
          aria-label={open ? "Close the assistant" : "Open the assistant"}
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber text-on-amber shadow-hover transition hover:bg-amber-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          {open ? <X aria-hidden="true" className="size-6" /> : <MessageSquare aria-hidden="true" className="size-6" />}
        </button>
      </div>

      {open && (
        <div
          id="assistant-panel"
          ref={panel}
          role="dialog"
          aria-modal="false"
          aria-label="TheRentalz assistant"
          tabIndex={-1}
          className="card fixed inset-x-0 bottom-0 top-0 z-50 flex flex-col overflow-hidden p-0 shadow-floating outline-none sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(40rem,calc(100dvh-8rem))] sm:w-[27rem] md:bottom-28 md:right-8"
        >
          <header className="flex items-center gap-space-sm border-b border-neutral-200 bg-surface-container-low px-space-md py-space-sm">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-charcoal text-amber">
              <Sparkles className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="type-headline-sm block truncate">Assistant</span>
              <span className="type-label-mono-md block text-neutral-700">TheRentalz</span>
            </span>
            {status === STATUS.LIVE ? (
              <button type="button" onClick={endChat} className="btn btn-danger btn-sm shrink-0 rounded-full px-3">
                End chat
              </button>
            ) : (
              <StatusPill status={status} />
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimise the assistant"
              className="btn btn-ghost btn-icon btn-sm shrink-0 rounded-full"
            >
              <Minus />
            </button>
          </header>

          {status === STATUS.IDLE && (
            <div className="flex flex-1 flex-col justify-center gap-space-lg px-space-lg py-space-xl text-center">
              <div>
                <h2 className="type-headline-sm">How can I help?</h2>
                <p className="type-body-md mt-space-sm text-neutral-700">
                  Ask about machines, rates or listing your own. You can type, attach a photo or document, or talk.
                </p>
              </div>
              <button type="button" onClick={start} className="btn btn-primary btn-block">
                Start chat
              </button>
              <ul className="flex flex-col gap-1.5">
                {OPENERS.map((opener) => (
                  <li key={opener}>
                    <button
                      type="button"
                      onClick={async () => {
                        await start();
                        send(opener);
                      }}
                      className="type-body-sm w-full rounded-control border border-neutral-200 px-3 py-2 text-left text-neutral-700 transition-colors hover:border-amber hover:text-neutral-900"
                    >
                      {opener}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status === STATUS.CONNECTING && (
            <p className="type-body-md flex flex-1 items-center justify-center gap-2 text-neutral-700">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Connecting…
            </p>
          )}

          {status === STATUS.ERROR && (
            <div className="flex flex-1 flex-col items-center justify-center gap-space-md px-space-lg text-center">
              <p className="type-body-md text-neutral-700">{error}</p>
              <button type="button" onClick={start} className="btn btn-ghost btn-sm">
                Try again
              </button>
            </div>
          )}

          {(status === STATUS.LIVE || status === STATUS.ENDED) && (
            <>
              <ChatThread messages={messages} agentTyping={agentTyping} />

              {status === STATUS.LIVE ? (
                <>
                  {/* In voice mode the visualiser takes the text box's place; the paperclip stays either way,
                      and a file chosen while talking is sent on its own. */}
                  {voice ? (
                    <VoiceSession onEnd={() => setVoice(false)} onFiles={(files) => send("", files)} />
                  ) : (
                    <Composer onSend={send} onStartVoice={() => setVoice(true)} voiceActive={voice} />
                  )}
                  <p className="type-body-sm bg-white px-space-md pb-space-sm text-center text-neutral-400">
                    The assistant can make mistakes. Check anything important.
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-between gap-space-md border-t border-neutral-200 bg-surface-container-low px-space-md py-space-sm">
                  <p className="type-label-mono-md text-neutral-700">Chat ended</p>
                  <button type="button" onClick={startOver} className="btn btn-ghost btn-sm">
                    Start a new chat
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
