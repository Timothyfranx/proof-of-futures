"use client";

type Phase = "idle" | "initialized" | "delegated" | "running" | "forked";

interface StatusBarProps {
  phase: Phase;
  timeline: number;
  tick: number;
}

const phaseConfig: Record<Phase, { label: string; color: string; dot: string }> = {
  idle: { label: "Idle", color: "text-gray-400", dot: "bg-gray-500" },
  initialized: { label: "On-Chain", color: "text-blue-400", dot: "bg-blue-400" },
  delegated: { label: "ER Ready", color: "text-purple-400", dot: "bg-purple-400" },
  running: { label: "Live on ER", color: "text-green-400", dot: "bg-green-400 animate-pulse" },
  forked: { label: "FORK ⚡", color: "text-yellow-400", dot: "bg-yellow-400 animate-ping" },
};

export default function StatusBar({ phase, timeline, tick }: StatusBarProps) {
  const config = phaseConfig[phase];
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className={config.color}>{config.label}</span>
      </div>
      {phase !== "idle" && (
        <>
          <div className="text-gray-500 text-xs">
            Timeline <span className="text-white font-mono">{timeline}</span>
          </div>
          {tick > 0 && (
            <div className="text-gray-500 text-xs">
              Tick <span className="text-white font-mono">{tick}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
