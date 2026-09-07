"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface WindState {
  x: number;
  y: number;
  strength: number;
}

interface PointerContextValue {
  wind: WindState;
  pointer: { x: number; y: number; active: boolean };
  setPointer: (x: number, y: number, active?: boolean) => void;
}

const PointerContext = createContext<PointerContextValue | null>(null);

export function PointerProvider({ children }: { children: ReactNode }) {
  const [pointer, setPointerState] = useState({
    x: 0.5,
    y: 0.5,
    active: false,
  });
  const [wind, setWind] = useState<WindState>({ x: 0, y: 0, strength: 0.15 });
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  const setPointer = useCallback((x: number, y: number, active = true) => {
    setPointerState({ x, y, active });
    target.current = {
      x: (x - 0.5) * 2,
      y: (y - 0.5) * 2,
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.06;
      current.current.y += (target.current.y - current.current.y) * 0.06;
      const strength =
        Math.hypot(current.current.x, current.current.y) * 0.4 + 0.12;
      setWind({
        x: current.current.x,
        y: current.current.y,
        strength: Math.min(strength, 1),
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return (
    <PointerContext.Provider value={{ wind, pointer, setPointer }}>
      {children}
    </PointerContext.Provider>
  );
}

export function usePointer() {
  const ctx = useContext(PointerContext);
  if (!ctx) throw new Error("usePointer must be used within PointerProvider");
  return ctx;
}
