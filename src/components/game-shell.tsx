import { useEffect, useRef, useState } from "react";
import { Gauge, Pause, RotateCcw, Users, Zap } from "lucide-react";
import { createGame, type GameApi } from "@/game/engine";
import type { GameHud, GameMode, RemoteSnapshot, SpeedPreset } from "@/game/types";
import { MODE_INFO, SPEED_INFO } from "@/game/scores";
import type { P2PRoomHandle } from "@/lib/multiplayer/use-p2p-room";

type Props = {
  name: string;
  room: string;
  joinLabel?: string;
  online: boolean;
  mode: GameMode;
  speed: SpeedPreset;
  p2p: P2PRoomHandle | null;
  onExit: () => void;
};

const emptyHud: GameHud = {
  score: 0,
  best: 0,
  speed: 0,
  nitro: 0,
  stage: 1,
  crashed: false,
  paused: false,
  playing: false,
  boosting: false,
  doubleNitro: false,
  isHigh: false,
  mode: "circuit",
  speedPreset: "sport",
};

export function GameShell({ name, room, joinLabel, online, mode, speed, p2p, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<GameApi | null>(null);
  const [hud, setHud] = useState<GameHud>(emptyHud);
  const [ready, setReady] = useState(false);
  const remotesRef = useRef<Record<string, RemoteSnapshot>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const api = createGame(canvas, setHud, { name, mode, speed });
    api.setName(name);
    apiRef.current = api;
    const t = window.setTimeout(() => {
      api.start();
      setReady(true);
    }, 420);
    return () => {
      window.clearTimeout(t);
      api.destroy();
      apiRef.current = null;
    };
  }, [name, mode, speed]);

  useEffect(() => {
    if (!p2p) return;
    return p2p.onMessage((from, data) => {
      const d = data as RemoteSnapshot;
      if (!d || typeof d.x !== "number") return;
      remotesRef.current[from] = { ...d, id: from };
      apiRef.current?.setRemotes(Object.values(remotesRef.current));
    });
  }, [p2p]);

  useEffect(() => {
    if (!p2p) return;
    const alive = new Set(p2p.peers.map((p) => p.id));
    for (const id of Object.keys(remotesRef.current)) {
      if (!alive.has(id)) delete remotesRef.current[id];
    }
    apiRef.current?.setRemotes(Object.values(remotesRef.current));
  }, [p2p, p2p?.peers]);

  useEffect(() => {
    if (!p2p) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last >= 50) {
        last = now;
        const local = apiRef.current?.getLocal();
        if (local) p2p.broadcast(local);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [p2p]);

  const press = (partial: Parameters<GameApi["setTouch"]>[0], down: boolean) => {
    const next = { ...partial };
    if (!down) {
      for (const k of Object.keys(next) as (keyof typeof next)[]) next[k] = 0;
    }
    apiRef.current?.setTouch(next);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-none" />

      {!ready && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg">
          <p className="font-display text-2xl tracking-wide text-fg">FAST ND PRAISE</p>
          <p className="mt-3 text-sm text-muted">Installing graphics pack</p>
          <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-elevated">
            <div className="h-full w-2/3 animate-pulse bg-accent" />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="rounded-xl bg-surface/80 px-4 py-3">
          <p className="font-mono text-xs tracking-widest text-muted">SCORE</p>
          <p className="font-display text-3xl tabular-nums leading-none">{hud.score}</p>
          <p className="mt-1 text-xs text-subtle">Best {hud.best}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-surface/80 px-3 py-2">
            <Gauge className="size-4 text-muted" />
            <span className="font-mono text-lg tabular-nums">{hud.speed}</span>
            <span className="text-xs text-subtle">km/h</span>
          </div>
          <div className="rounded-xl bg-surface/80 px-3 py-2 text-right">
            <p className="text-xs text-muted">Stage {hud.stage}</p>
            {online && (
              <p className="mt-1 flex items-center justify-end gap-1 text-xs text-subtle">
                <Users className="size-3" />
                {1 + (p2p?.peers.length ?? 0)} · {joinLabel || room}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-28 z-10 flex justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1">
              <Zap className="size-3" /> Nitro
            </span>
            <span className="font-mono tabular-nums">
              {hud.doubleNitro ? "DOUBLE " : hud.boosting ? "NOS " : ""}
              {hud.nitro}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-elevated">
            <div
              className={`h-full ${hud.doubleNitro ? "bg-ice" : hud.boosting ? "bg-flame" : "bg-accent"}`}
              style={{ width: `${hud.nitro}%` }}
            />
          </div>
        </div>
      </div>

      {hud.paused && !hud.crashed && (
        <Overlay
          title="Paused"
          body="W gas · A/D steer · tap Shift or E twice for blue double nitro."
          actions={[
            { label: "Resume", onClick: () => apiRef.current?.resume() },
            { label: "Leave", onClick: onExit, ghost: true },
          ]}
        />
      )}

      {hud.crashed && (
        <Overlay
          title="Crashed"
          body={`${hud.isHigh ? "NEW HIGH SCORE · " : ""}Score ${hud.score} · Best ${hud.best} · ${MODE_INFO[hud.mode].label} ${SPEED_INFO[hud.speedPreset].label}`}
          actions={[
            { label: "Retry", onClick: () => apiRef.current?.retry(), icon: true },
            { label: "Menu", onClick: onExit, ghost: true },
          ]}
        />
      )}

      <button
        type="button"
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-10 flex -translate-x-1/2 rounded-full bg-surface/80 p-3 text-fg"
        onClick={() => (hud.paused ? apiRef.current?.resume() : apiRef.current?.pause())}
        aria-label="Pause"
      >
        <Pause className="size-4" />
      </button>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="flex gap-2">
          <TouchBtn
            label="Left"
            onDown={() => press({ steer: 1 }, true)}
            onUp={() => press({ steer: 1 }, false)}
          />
          <TouchBtn
            label="Right"
            onDown={() => press({ steer: -1 }, true)}
            onUp={() => press({ steer: -1 }, false)}
          />
        </div>
        <div className="flex gap-2">
          <TouchBtn
            label="Brake"
            onDown={() => press({ brake: 1 }, true)}
            onUp={() => press({ brake: 1 }, false)}
          />
          <TouchBtn
            label="Nitro"
            accent
            onDown={() => press({ boost: 1 }, true)}
            onUp={() => press({ boost: 1 }, false)}
          />
          <TouchBtn
            label="Gas"
            primary
            onDown={() => press({ throttle: 1 }, true)}
            onUp={() => press({ throttle: 1 }, false)}
          />
        </div>
      </div>
    </div>
  );
}

function Overlay({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: { label: string; onClick: () => void; ghost?: boolean; icon?: boolean }[];
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-6">
      <div className="w-full max-w-sm rounded-xl bg-surface p-6">
        <h2 className="font-display text-3xl tracking-wide">{title}</h2>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-6 flex flex-col gap-2">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={
                a.ghost
                  ? "h-11 rounded-md border border-border text-sm font-medium text-fg"
                  : "h-11 rounded-md bg-accent text-sm font-medium text-accent-fg"
              }
            >
              <span className="inline-flex items-center gap-2">
                {a.icon ? <RotateCcw className="size-4" /> : null}
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TouchBtn({
  label,
  onDown,
  onUp,
  primary,
  accent,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
  primary?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      className={
        "h-14 min-w-16 rounded-lg px-4 text-sm font-medium select-none " +
        (primary
          ? "bg-accent text-accent-fg"
          : accent
            ? "bg-ok text-accent-fg"
            : "bg-surface/90 text-fg")
      }
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {label}
    </button>
  );
}
