# Assistant widget (frontend only)

The floating chat widget on every page. This is the interface alone — there is no agent behind it yet, and
nothing typed, attached or spoken leaves the browser.

## Files

| File | What it is |
| --- | --- |
| `components/assistant/AssistantWidget.js` | Launcher button and panel shell: open/close, the start screen, status pill, end chat and start again. Mounted once in `app/layout.js`. |
| `components/assistant/session.js` | All widget state (`status`, `messages`, `agentTyping`) **and the LiveKit seam**. |
| `components/assistant/ChatThread.js` | The transcript: message bubbles, attachment chips, the typing bubble. |
| `components/assistant/Composer.js` | Text box (Enter sends, Shift+Enter newlines), mic and send. Files wait in the box until you send. |
| `components/assistant/VoiceSession.js` | Voice mode, in the composer's place: microphone permission, the visualiser, mute, hang up. A file chosen here is sent on its own. |
| `components/assistant/AttachButton.js` | The paperclip and its hidden input, with the size and count rules. Shared by both of the above. |

Bubble and typing-dot styles are `.bubble`, `.bubble-user`, `.bubble-agent` and `.typing-dot` in
`styles/components.css`; dark mode turns the visitor's bubble amber (`styles/dark.css`).

## Statuses

`idle → connecting → live → ended`, plus `error`. Each has its own view in the panel. Ending a chat keeps the
transcript on screen with a "Start a new chat" button; starting again clears it.

## Wiring in LiveKit

Everything to replace is in `session.js`, under the `LiveKit seam` comment. The components above it only ever
see sessions, messages and a status, so they should not need changing.

1. **`openSession()`** — call the API for a room and a token (`POST /assistant/session`), then
   `const room = new Room(); await room.connect(url, token)`. Return the room so the other two can use it.
2. **`sendToAgent(session, payload, onReply)`** — upload any attachments first and send their URLs rather than
   the `File` objects, then `room.localParticipant.publishData(...)`. Replies should stop coming from the
   `onReply` callback and start arriving on `RoomEvent.DataReceived`, with the agent's own "thinking" events
   driving `agentTyping` instead of the current local flag.
3. **`closeSession(session)`** — `room.disconnect()`.

For voice, `VoiceSession.js` already holds a `MediaStream` from `getUserMedia`. Publish it with
`room.localParticipant.publishTrack(...)` and render the agent's reply track in an `<audio>` element added
there. The level meter, mute and timer stay as they are — mute already toggles `track.enabled`.

## Still to decide

- Whether the widget should appear on the dashboard and admin pages (it currently does, via the root layout).
- Where attachments are uploaded: the ad photo pipeline already uses R2, so it may be reusable.
- Whether transcripts are kept, and what to say about that in the privacy policy.
