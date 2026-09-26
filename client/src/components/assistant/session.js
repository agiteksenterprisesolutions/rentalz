"use client";

import { useCallback, useRef, useState } from "react";

/*
 * State for the assistant widget, and the single place the real backend will be wired in.
 *
 * Everything below the "LiveKit seam" comment is a stand-in: no message leaves the browser, and the
 * assistant's replies are a fixed placeholder saying so. When the agent service exists, only the three
 * seam functions change — the components above them already speak in sessions, messages and status.
 */

export const STATUS = {
  IDLE: "idle", // nothing started yet
  CONNECTING: "connecting", // asking for a room and joining it
  LIVE: "live", // connected, messages can flow
  ENDED: "ended", // the visitor ended the chat; the transcript stays on screen
  ERROR: "error",
};

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;

let counter = 0;
const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(counter += 1)}`;

const describeFile = (file) => ({ id: nextId("file"), name: file.name, size: file.size, type: file.type });

/* ──────────────────────────────────────────────────────────────────────────────
 * LiveKit seam. Replace these three with the real client:
 *
 *   openSession()  → POST /assistant/session for { url, token }, then
 *                    `const room = new Room(); await room.connect(url, token)`
 *   sendToAgent()  → room.localParticipant.publishData(encode(payload), { reliable: true }),
 *                    and upload any attachments first, sending their URLs rather than the files
 *   closeSession() → room.disconnect()
 *
 * Replies will then arrive on RoomEvent.DataReceived instead of from the placeholder below, and the
 * typing indicator will be driven by the agent's own "thinking" events.
 * ────────────────────────────────────────────────────────────────────────────── */

const PLACEHOLDER_REPLY =
  "Thanks — I have your message. The assistant is not connected yet: this is the chat interface only, and the agent that answers is still being built. Nothing you send here is stored or forwarded.";

const openSession = async () => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { room: null, name: nextId("room") };
};

const sendToAgent = async (_session, _payload, onReply) => {
  await new Promise((resolve) => setTimeout(resolve, 900));
  onReply(PLACEHOLDER_REPLY);
};

const closeSession = async (_session) => {};

/* ────────────────────────────────────────────────────────────────────────────── */

export function useAssistantSession() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [messages, setMessages] = useState([]);
  const [agentTyping, setAgentTyping] = useState(false);
  const [error, setError] = useState(null);
  const session = useRef(null);

  const append = useCallback((message) => {
    setMessages((current) => [...current, { id: nextId("msg"), at: new Date().toISOString(), ...message }]);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus(STATUS.CONNECTING);
    try {
      session.current = await openSession();
      setStatus(STATUS.LIVE);
      append({
        role: "assistant",
        text: "Hello. Tell me what you need — a machine for a job, help with a listing, or a question about how renting here works.",
      });
    } catch {
      setStatus(STATUS.ERROR);
      setError("The assistant could not be reached. Please try again.");
    }
  }, [append]);

  const send = useCallback(
    async (text, files = []) => {
      const trimmed = text.trim();
      if (!trimmed && files.length === 0) return;

      append({ role: "user", text: trimmed, attachments: files.map(describeFile) });
      setAgentTyping(true);
      try {
        await sendToAgent(session.current, { text: trimmed, files }, (reply) => {
          setAgentTyping(false);
          append({ role: "assistant", text: reply });
        });
      } catch {
        setAgentTyping(false);
        append({ role: "system", text: "That message could not be delivered. Please try again." });
      }
    },
    [append],
  );

  const end = useCallback(async () => {
    await closeSession(session.current);
    session.current = null;
    setAgentTyping(false);
    setStatus(STATUS.ENDED);
  }, []);

  const reset = useCallback(async () => {
    await closeSession(session.current);
    session.current = null;
    setMessages([]);
    setAgentTyping(false);
    setError(null);
    setStatus(STATUS.IDLE);
  }, []);

  return { status, messages, agentTyping, error, start, send, end, reset };
}
