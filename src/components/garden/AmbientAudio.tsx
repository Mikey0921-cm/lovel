"use client";

import { useEffect, useRef, useState } from "react";
import type { TimeOfDay } from "@/lib/types";

const AUDIO_SRC = "/メロディー.mp3";

export function AmbientAudio({
  timeOfDay,
  enabled,
}: {
  timeOfDay: TimeOfDay;
  enabled: boolean;
}) {
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      const audio = new Audio(AUDIO_SRC);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.38;
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    if (!enabled || muted) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    audio.play().catch(() => {
      // Browser autoplay restrictions require a user gesture before playback.
    });
  }, [enabled, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const volumeByTime: Record<TimeOfDay, number> = {
      day: 0.35,
      dawn: 0.38,
      dusk: 0.42,
      "dusk-peach": 0.45,
      "dusk-rose": 0.45,
      "dusk-violet": 0.46,
      night: 0.48,
    };

    audio.volume = volumeByTime[timeOfDay] ?? 0.4;
  }, [timeOfDay]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setMuted((m) => !m)}
      className="fixed bottom-5 right-5 z-50 font-sans text-[11px] tracking-[0.2em] text-sage-deep/40 transition-colors hover:text-sage-deep/70"
      style={{
        color: timeOfDay === "night" ? "rgba(247,243,234,0.35)" : undefined,
      }}
      aria-label={muted ? "音をオンにする" : "音をオフにする"}
      title={muted ? "クリックして音をオンにする" : "クリックして音をオフにする"}
    >
      {muted ? "SOUND OFF" : "SOUND ON"}
    </button>
  );
}
