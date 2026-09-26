"use client";

import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AttachButton from "./AttachButton";

const BARS = 18;

/*
 * Voice mode. It takes over from the composer: the visitor sees what the microphone is picking up rather
 * than a text box. The audio stays in the browser — when LiveKit is wired in, this same MediaStream becomes
 * the published local track (room.localParticipant.publishTrack) and the agent's reply arrives as a remote
 * track rendered by an <audio> element added here.
 */
export default function VoiceSession({ onEnd, onFiles }) {
  const [state, setState] = useState("requesting"); // requesting | live | denied
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState(null);
  const stream = useRef(null);
  const context = useRef(null);
  const frame = useRef(null);
  const bars = useRef([]);

  // The bars are driven straight from the analyser onto the DOM: at sixty frames a second this should not
  // be going through React. Muting disables the track, so the analyser reads silence and they settle by themselves.
  useEffect(() => {
    let cancelled = false;

    const open = async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = media;
        setState("live");

        const audio = new (window.AudioContext || window.webkitAudioContext)();
        context.current = audio;
        const analyser = audio.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        audio.createMediaStreamSource(media).connect(analyser);
        const spectrum = new Uint8Array(analyser.frequencyBinCount);

        const draw = () => {
          analyser.getByteFrequencyData(spectrum);
          const perBar = Math.floor(spectrum.length / BARS) || 1;
          bars.current.forEach((bar, i) => {
            if (!bar) return;
            let sum = 0;
            for (let s = 0; s < perBar; s += 1) sum += spectrum[i * perBar + s] ?? 0;
            const level = Math.min(1, sum / perBar / 185);
            // 3px at rest so a quiet bar reads as a dot, up to the full 24px of the track.
            bar.style.height = `${3 + level * 21}px`;
            bar.style.opacity = `${0.25 + level * 0.75}`;
          });
          frame.current = requestAnimationFrame(draw);
        };
        draw();
      } catch {
        if (!cancelled) setState("denied");
      }
    };

    open();
    return () => {
      cancelled = true;
      if (frame.current) cancelAnimationFrame(frame.current);
      stream.current?.getTracks().forEach((track) => track.stop());
      context.current?.close();
    };
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    stream.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  };

  if (state === "denied") {
    return (
      <div className="flex items-center justify-between gap-space-md border-t border-neutral-200 bg-surface-container-low px-space-md py-space-md">
        <p className="type-body-sm text-neutral-700">Microphone blocked. Allow it in your browser to talk.</p>
        <button type="button" onClick={onEnd} className="btn btn-ghost btn-sm rounded-full">
          Close
        </button>
      </div>
    );
  }

  const label = state === "requesting" ? "Connecting" : muted ? "Muted" : "Listening";

  // Same footer row as the composer: the paperclip stays put and the visualiser stands where the text box was.
  return (
    <div className="border-t border-neutral-200 bg-white px-space-md py-space-sm">
      {notice && <p className="type-body-sm mb-space-sm text-error">{notice}</p>}

      <div className="flex items-center gap-1.5">
        <AttachButton disabled={state !== "live"} onFiles={onFiles} onNotice={setNotice} />

        <div
          role="status"
          aria-label={`${label}. Voice chat is on.`}
          className="flex h-12 min-w-0 flex-1 items-center gap-space-sm overflow-hidden rounded-[1.5rem] border-[1.5px] border-neutral-200 bg-surface-container-low px-4"
        >
          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${muted ? "bg-neutral-400" : "bg-error motion-safe:animate-pulse"}`} />
          <span className="type-body-sm shrink-0 text-neutral-700">{label}</span>
          <span aria-hidden="true" className="flex h-6 flex-1 items-center justify-center gap-0.75 overflow-hidden">
            {Array.from({ length: BARS }, (_, i) => (
              <span
                key={i}
                ref={(node) => {
                  bars.current[i] = node;
                }}
                className="w-0.75 shrink-0 rounded-full bg-amber transition-[height] duration-75"
                style={{ height: "3px", opacity: 0.25 }}
              />
            ))}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          disabled={state !== "live"}
          aria-pressed={muted}
          aria-label={muted ? "Unmute microphone" : "Mute microphone"}
          className={`btn btn-icon btn-sm shrink-0 rounded-full ${muted ? "btn-danger" : "btn-ghost"}`}
        >
          {muted ? <MicOff /> : <Mic />}
        </button>
        <button type="button" onClick={onEnd} aria-label="End voice chat" className="btn btn-danger btn-icon btn-sm shrink-0 rounded-full">
          <PhoneOff />
        </button>
      </div>
    </div>
  );
}
