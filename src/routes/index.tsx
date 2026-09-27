import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/components/game-shell";
import { useP2PRoom } from "@/lib/multiplayer/use-p2p-room";
import type { GameMode, SpeedPreset } from "@/game/types";
import { MODE_INFO, SPEED_INFO, loadScores, overallBest, type ScoreRow } from "@/game/scores";

export const Route = createFileRoute("/")({ component: Home });

type Session = {
  name: string;
  room: string;
  online: boolean;
  joinLabel: string;
  mode: GameMode;
  speed: SpeedPreset;
};

const MODES: GameMode[] = ["cruise", "circuit", "rush", "survival"];
const SPEEDS: SpeedPreset[] = ["touring", "sport", "super", "insane"];

function lobbyFromIpPort(ip: string, port: string): { room: string; label: string } {
  const host = ip.trim() || "127.0.0.1";
  const p = port.replace(/[^0-9]/g, "").slice(0, 5) || "5555";
  const room = `${host.replace(/[^a-zA-Z0-9]/g, "-")}-${p}`.replace(/-+/g, "-").slice(0, 64);
  return { room: room || "FASTND", label: `${host}:${p}` };
}

function Home() {
  const [session, setSession] = useState<Session | null>(null);
  if (!session) return <Menu onPlay={setSession} />;
  if (session.online) {
    return <OnlineRace key={session.room + session.name} session={session} onExit={() => setSession(null)} />;
  }
  return <GameShell {...session} p2p={null} onExit={() => setSession(null)} />;
}

function OnlineRace({ session, onExit }: { session: Session; onExit: () => void }) {
  const p2p = useP2PRoom({ room: session.room, name: session.name });
  return <GameShell {...session} p2p={p2p} onExit={onExit} />;
}

function Menu({ onPlay }: { onPlay: (s: Session) => void }) {
  const [name, setName] = useState("Racer");
  const [host, setHost] = useState("127.0.0.1");
  const [port, setPort] = useState("5555");
  const [online, setOnline] = useState(false);
  const [mode, setMode] = useState<GameMode>("circuit");
  const [speed, setSpeed] = useState<SpeedPreset>("sport");
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [best, setBest] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fnp-name");
      if (saved) setName(saved);
    } catch {
      /* ignore */
    }
    setScores(loadScores());
    setBest(overallBest());
  }, []);

  const hint = useMemo(() => MODE_INFO[mode].blurb, [mode]);

  const go = () => {
    const n = name.trim().slice(0, 16) || "Racer";
    const { room, label } = lobbyFromIpPort(host, port);
    try {
      localStorage.setItem("fnp-name", n);
    } catch {
      /* ignore */
    }
    onPlay({ name: n, room, online, joinLabel: label, mode, speed });
  };

  return (
    <main className="flex min-h-dvh items-start justify-center bg-bg px-4 py-5 text-fg md:items-center">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-border bg-surface p-4 md:p-6">
          <p className="text-xs font-medium tracking-[0.32em] text-muted">INSERT COIN</p>
          <h1 className="mt-1 font-display text-4xl tracking-wide md:text-5xl">FAST ND PRAISE</h1>
          <p className="mt-2 text-sm text-muted">Classic arcade select. Double-tap nitro for blue flame.</p>

          <label className="mt-4 block text-xs font-medium tracking-widest text-muted" htmlFor="racer">
            DRIVER
          </label>
          <input
            id="racer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Callsign"
            className="mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg outline-none ring-accent focus:ring-2"
          />

          <p className="mt-4 text-xs font-medium tracking-widest text-muted">MODE</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  "h-12 rounded-md px-3 text-left text-sm font-medium " +
                  (mode === m ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted")
                }
              >
                {MODE_INFO[m].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-subtle">{hint}</p>

          <p className="mt-4 text-xs font-medium tracking-widest text-muted">SPEED CLASS</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={
                  "h-11 rounded-md text-xs font-medium sm:text-sm " +
                  (speed === s ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted")
                }
              >
                {SPEED_INFO[s].label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-medium tracking-widest text-muted">PLAY</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOnline(false)}
              className={
                "h-11 rounded-md text-sm font-medium " +
                (!online ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted")
              }
            >
              Solo
            </button>
            <button
              type="button"
              onClick={() => setOnline(true)}
              className={
                "h-11 rounded-md text-sm font-medium " +
                (online ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted")
              }
            >
              Online
            </button>
          </div>

          {online && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted" htmlFor="host">
                  Server IP
                </label>
                <input
                  id="host"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  maxLength={40}
                  className="mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none ring-accent focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted" htmlFor="port">
                  Port
                </label>
                <input
                  id="port"
                  value={port}
                  onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                  inputMode="numeric"
                  className="mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none ring-accent focus:ring-2"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={go}
            className="mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold tracking-wide text-accent-fg"
          >
            Start Engine
          </button>
          <p className="mt-3 text-xs text-subtle">W gas · A/D steer · tap nitro twice for blue flame</p>
        </section>

        <aside className="rounded-xl border border-border bg-surface p-4 md:p-6">
          <p className="text-xs font-medium tracking-[0.32em] text-muted">HIGH SCORES</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{best || "—"}</p>
          <p className="text-xs text-subtle">All-time best</p>
          <ol className="mt-5 space-y-2">
            {scores.length === 0 && <li className="text-sm text-subtle">No records yet. Take a run.</li>}
            {scores.slice(0, 8).map((row, i) => (
              <li
                key={`${row.at}-${row.name}-${i}`}
                className="flex items-baseline justify-between gap-3 border-b border-border pb-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  <span className="mr-2 font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  {row.name}
                </span>
                <span className="shrink-0 font-mono tabular-nums text-fg">{row.score}</span>
              </li>
            ))}
          </ol>
          {scores[0] && (
            <p className="mt-4 text-xs text-subtle">
              Top run: {MODE_INFO[scores[0].mode].label} · {SPEED_INFO[scores[0].speed].label}
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
