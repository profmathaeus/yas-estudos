"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const FOCUS_MINS = 25;
const BREAK_MINS = 5;

export function Timer() {
  const [isRunning, setIsRunning]   = useState(false);
  const [isFocus, setIsFocus]       = useState(true);
  const [seconds, setSeconds]       = useState(FOCUS_MINS * 60);
  const [sessions, setSessions]     = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }, []);

  const reset = useCallback((focus: boolean) => {
    setIsFocus(focus);
    setSeconds(focus ? FOCUS_MINS * 60 : BREAK_MINS * 60);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          playBeep();
          setIsRunning(false);
          if (isFocus) setSessions((n) => n + 1);
          const next = !isFocus;
          setIsFocus(next);
          return next ? FOCUS_MINS * 60 : BREAK_MINS * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isFocus, playBeep]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-3 bg-yas-ink/90 backdrop-blur rounded-2xl px-4 py-2 shadow-lg">
      <div className="text-center">
        <p className="text-xs font-body text-white/40 leading-none mb-0.5">
          {isFocus ? "foco" : "pausa"}
        </p>
        <p className="text-2xl font-display font-semibold text-white leading-none tabular-nums">
          {mins}:{secs}
        </p>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => setIsRunning((r) => !r)}
          className="w-9 h-9 rounded-full bg-yas-lavender/20 hover:bg-yas-lavender/30 flex items-center justify-center transition-colors text-white"
          aria-label={isRunning ? "Pausar" : "Iniciar"}
        >
          {isRunning ? "⏸" : "▶️"}
        </button>
        <button
          onClick={() => reset(isFocus)}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/60"
          aria-label="Reiniciar"
        >
          🔄
        </button>
      </div>

      {sessions > 0 && (
        <span className="text-xs font-body text-yas-yellow">
          {sessions}🍅
        </span>
      )}
    </div>
  );
}
