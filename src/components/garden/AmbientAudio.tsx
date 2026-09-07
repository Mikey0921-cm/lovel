"use client";

import { useEffect, useRef, useState } from "react";
import type { TimeOfDay } from "@/lib/types";

/**
 * Soft procedural ambience — no external audio files.
 * Day: gentle pad. Dusk: slightly warmer. Night: quieter.
 */
export function AmbientAudio({
  timeOfDay,
  enabled,
}: {
  timeOfDay: TimeOfDay;
  enabled: boolean;
}) {
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const mixRef = useRef<Record<string, GainNode> | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const playNoteRef = useRef<((frequency: number) => void) | null>(null);
  const melodyTimerRef = useRef<number | null>(null);

  const ensureAudio = async () => {
    if (typeof window === "undefined") return;
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const mix = {
        piano: ctx.createGain(),
        strings: ctx.createGain(),
        ambience: ctx.createGain(),
        nature: ctx.createGain(),
      };
      Object.values(mix).forEach((bus) => {
        bus.gain.value = 0;
        bus.connect(master);
      });

      const makeVoice = (
        freq: number,
        type: OscillatorType,
        vol: number,
        destination: GainNode,
      ) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.value = vol;
        lfo.frequency.value = 0.04 + Math.random() * 0.04;
        lfoGain.gain.value = 1.5;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(g);
        g.connect(destination);
        osc.start();
        lfo.start();
        nodesRef.current.push(osc, lfo);
      };

      const makeNoise = (destination: GainNode) => {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) {
          data[i] = (Math.random() * 2 - 1) * 0.35;
        }
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        source.buffer = buffer;
        source.loop = true;
        filter.type = "lowpass";
        filter.frequency.value = 900;
        gain.gain.value = 0.12;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        source.start();
        nodesRef.current.push(source);
      };

      makeVoice(261.63, "sine", 0.018, mix.piano);
      makeVoice(329.63, "triangle", 0.012, mix.piano);
      makeVoice(392, "sine", 0.008, mix.piano);
      makeVoice(196, "triangle", 0.012, mix.strings);
      makeVoice(293.66, "sine", 0.008, mix.strings);
      makeVoice(880, "sine", 0.0025, mix.nature);
      makeVoice(1174.66, "sine", 0.0015, mix.nature);
      makeNoise(mix.ambience);
      makeNoise(mix.nature);

      playNoteRef.current = (frequency: number) => {
        const osc = ctx.createOscillator();
        const envelope = ctx.createGain();
        const now = ctx.currentTime;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(frequency, now);
        envelope.gain.setValueAtTime(0.0001, now);
        envelope.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
        osc.connect(envelope);
        envelope.connect(mix.piano);
        osc.start(now);
        osc.stop(now + 1.4);
      };

      ctxRef.current = ctx;
      gainRef.current = master;
      mixRef.current = mix;
    }

    if (ctxRef.current.state === "suspended") {
      await ctxRef.current.resume();
    }
    setReady(true);
  };

  useEffect(() => {
    const unlock = () => {
      void ensureAudio();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (!gainRef.current || !mixRef.current || !ctxRef.current || !ready) {
      return;
    }
    const target =
      !enabled || muted
        ? 0
        : timeOfDay === "night"
          ? 0.28
          : timeOfDay.startsWith("dusk")
            ? 0.4
            : 0.35;
    gainRef.current.gain.setTargetAtTime(
      target,
      ctxRef.current.currentTime,
      1.4,
    );

    const dusk = timeOfDay.startsWith("dusk");
    const night = timeOfDay === "night";
    const levels = {
      piano: night ? 0.22 : dusk ? 0.2 : 0.26,
      strings: dusk ? 0.2 : 0,
      ambience: night ? 0.18 : 0.24,
      nature: night ? 0.04 : dusk ? 0.06 : 0.08,
    };
    Object.entries(levels).forEach(([name, level]) => {
      mixRef.current?.[name]?.gain.setTargetAtTime(
        level,
        ctxRef.current!.currentTime,
        2.2,
      );
    });

    if (melodyTimerRef.current) {
      window.clearInterval(melodyTimerRef.current);
      melodyTimerRef.current = null;
    }

    if (!enabled || muted || !playNoteRef.current) return;

    const notes =
      timeOfDay === "night"
        ? [261.63, 329.63, 392, 329.63]
        : timeOfDay.startsWith("dusk")
          ? [293.66, 349.23, 440, 349.23]
          : [261.63, 329.63, 392, 329.63];
    let index = 0;
    playNoteRef.current(notes[index]);
    melodyTimerRef.current = window.setInterval(() => {
      index = (index + 1) % notes.length;
      playNoteRef.current?.(notes[index]);
    }, 1800);
  }, [enabled, muted, timeOfDay, ready]);

  useEffect(() => {
    const nodes = nodesRef.current;
    const contextRef = ctxRef;

    return () => {
      if (melodyTimerRef.current) {
        window.clearInterval(melodyTimerRef.current);
      }
      nodes.forEach((n) => {
        if ("stop" in n && typeof n.stop === "function") {
          try {
            (n as OscillatorNode).stop();
          } catch {
            /* ignore */
          }
        }
      });
      void contextRef.current?.close();
      playNoteRef.current = null;
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        void ensureAudio().then(() => setMuted((m) => !m));
      }}
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
