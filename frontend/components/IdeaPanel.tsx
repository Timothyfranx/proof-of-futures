"use client";

import { useState } from "react";
import { IdeaData } from "../lib/types";

interface IdeaPanelProps {
  ideas: IdeaData[];
  phase: string;
  onInject: (text: string, virality: number) => void;
}

export default function IdeaPanel({ ideas, phase, onInject }: IdeaPanelProps) {
  const [ideaText, setIdeaText] = useState("");
  const [virality, setVirality] = useState(30);

  const canInject = phase === "running" && ideas.length < 8;

  const handleSubmit = () => {
    if (!ideaText.trim() || !canInject) return;
    onInject(ideaText.trim(), virality);
    setIdeaText("");
  };

  const presets = [
    { text: "AI replaces devs", virality: 25 },
    { text: "Crypto fixes this", virality: 30 },
    { text: "Web3 is dead", virality: 20 },
    { text: "Simulation theory", virality: 22 },
  ];

  return (
    <div className="flex flex-col overflow-hidden bg-slate-900/30">
      {/* Inject form - Fixed at top */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
          Station // Inject Idea
        </h2>

        <input
          type="text"
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Enter a belief..."
          disabled={!canInject}
          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-40"
        />

        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            <span>Virality</span>
            <span className="text-indigo-400">{virality}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={90}
            value={virality}
            onChange={(e) => setVirality(Number(e.target.value))}
            disabled={!canInject}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-40"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canInject || !ideaText.trim()}
          className="w-full mt-4 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          Inject into Network
        </button>

        {/* Presets */}
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {presets.map((p) => (
            <button
              key={p.text}
              onClick={() => {
                setIdeaText(p.text);
                setVirality(p.virality);
              }}
              disabled={!canInject}
              className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-tight bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded text-slate-400 hover:text-white transition-all disabled:opacity-30 truncate"
            >
              {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* Active ideas + gravity meters - Scrollable section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
          Active Beliefs ({ideas.length}/8)
        </h3>

        {ideas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 opacity-40">
            <div className="text-2xl">🧠</div>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">
              No ideas detected in the current timeline.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {ideas.map((idea) => {
            const isCritical = idea.gravityPercent > 80;
            return (
              <div 
                key={idea.id} 
                className={`space-y-2 p-3 rounded-xl transition-all duration-300 ${
                  isCritical 
                    ? "bg-red-500/10 border border-red-500/30 animate-vibrate shadow-lg shadow-red-500/5" 
                    : "bg-slate-950/50 border border-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: idea.color,
                        boxShadow: `0 0 12px ${idea.color}`
                      }}
                    />
                    <span className="text-[11px] font-bold text-slate-200 truncate max-w-[140px] uppercase tracking-wide">
                      {idea.text}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-slate-500 flex-shrink-0 ml-1">
                    {idea.strength} NODES
                  </span>
                </div>

                {/* Gravity bar */}
                <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${idea.gravityPercent}%`,
                      backgroundColor: idea.color,
                      boxShadow: isCritical ? `0 0 15px ${idea.color}` : `0 0 5px ${idea.color}`,
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.1em]">
                  <span style={{ color: idea.color }}>GRAVITY: {idea.gravity}</span>
                  <span
                    className={
                      isCritical ? "text-yellow-400 animate-pulse" : "text-slate-600"
                    }
                  >
                    {isCritical
                      ? "⚡ FORK IMMINENT"
                      : `${idea.gravityPercent.toFixed(0)}% STRENGTH`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
