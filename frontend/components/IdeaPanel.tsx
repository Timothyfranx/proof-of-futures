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
    { text: "AI replaces devs", virality: 45 },
    { text: "Crypto fixes this", virality: 55 },
    { text: "Web3 is dead", virality: 35 },
    { text: "Simulation theory", virality: 40 },
  ];

  return (
    <div className="flex flex-col">
      {/* Inject form */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Inject Idea
        </h2>

        <input
          type="text"
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Enter a belief..."
          disabled={!canInject}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
        />

        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Virality</span>
            <span>{virality}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={90}
            value={virality}
            onChange={(e) => setVirality(Number(e.target.value))}
            disabled={!canInject}
            className="w-full accent-indigo-500 disabled:opacity-40"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canInject || !ideaText.trim()}
          className="w-full mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
        >
          Inject into Network
        </button>

        {/* Presets */}
        <div className="mt-2 grid grid-cols-2 gap-1">
          {presets.map((p) => (
            <button
              key={p.text}
              onClick={() => {
                setIdeaText(p.text);
                setVirality(p.virality);
              }}
              disabled={!canInject}
              className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-400 hover:text-white transition-colors disabled:opacity-30 truncate"
            >
              {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* Active ideas + gravity meters */}
      <div className="px-4 py-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Active Ideas ({ideas.length}/8)
        </h3>

        {ideas.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">
            No ideas injected yet.
            {phase === "running" && " Inject one above to start!"}
          </p>
        )}

        <div className="space-y-3">
          {ideas.map((idea) => (
            <div key={idea.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: idea.color }}
                  />
                  <span className="text-xs text-white truncate max-w-[140px]">
                    {idea.text}
                  </span>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-1">
                  {idea.strength} nodes
                </span>
              </div>

              {/* Gravity bar */}
              <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${idea.gravityPercent}%`,
                    backgroundColor: idea.color,
                    boxShadow: idea.gravityPercent > 80 ? `0 0 6px ${idea.color}` : "none",
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span>gravity {idea.gravity}</span>
                <span
                  className={
                    idea.gravityPercent > 80 ? "text-yellow-400 animate-pulse" : ""
                  }
                >
                  {idea.gravityPercent > 80
                    ? "⚡ fork imminent"
                    : `${idea.gravityPercent.toFixed(0)}% to fork`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
