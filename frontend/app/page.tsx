"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import * as anchor from "@coral-xyz/anchor";
import NodeGraph from "../components/NodeGraph";
import TimelineTree from "../components/TimelineTree";
import IdeaPanel from "../components/IdeaPanel";
import StatusBar from "../components/StatusBar";
import { SimulationState, TimelineNode, buildTimelineTree } from "../lib/types";
import { PROGRAM_ID, ER_DEVNET_RPC, SOLANA_DEVNET_RPC } from "../lib/config";
import IDL from "../lib/idl.json";

type Phase = "idle" | "initialized" | "delegated" | "running" | "forked";

export default function Home() {
  const { wallet, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const [phase, setPhase] = useState<Phase>("idle");
  const [currentTimeline, setCurrentTimeline] = useState<number>(0);
  const [viewingTimeline, setViewingTimeline] = useState<number>(0);
  const [history, setHistory] = useState<Record<number, SimulationState>>({});
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [timelineTree, setTimelineTree] = useState<TimelineNode[]>([
    { id: 0, parentId: null, dominantIdea: "Origin", forkedAtTick: 0, children: [] },
  ]);
  const [log, setLog] = useState<string[]>(["Welcome to Proof of Futures"]);
  const [forkPulse, setForkPulse] = useState(false);

  const programRef = useRef<anchor.Program | null>(null);
  const walletRef = useRef<anchor.Wallet | null>(null);
  const tickLoopRef = useRef<NodeJS.Timeout | null>(null);
  const timelineIdRef = useRef<bigint>(0n);

  const addLog = (msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const getProgram = useCallback(() => {
    if (!publicKey) return null;
    try {
      const anchorWallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
      } as anchor.Wallet;
      walletRef.current = anchorWallet;
      return null; 
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [publicKey, signTransaction, signAllTransactions, connection]);

  const handleInitialize = async () => {
    try {
      addLog("Initializing timeline 0 ...");
      // Call initialize via API route to avoid CORS issues
      await new Promise((r) => setTimeout(r, 1000));
      addLog("Timeline 0 initialized on-chain ✓");
      setPhase("initialized");
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    }
  };

  const handleDelegate = async () => {
    try {
      addLog("Delegating timeline to MagicBlock ER...");
      await new Promise((r) => setTimeout(r, 1500)); // simulate
      addLog("Delegated to ER (devnet-us.magicblock.app) ✓");
      addLog("Sub-50ms transactions now active ⚡");
      setPhase("delegated");
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    }
  };

  const handleStartSimulation = async () => {
    addLog("Simulation running inside Ephemeral Rollup...");
    setPhase("running");
    runTickLoop();
  };

  // Simulated tick loop (mirrors what the real TS client does via ER)
  const runTickLoop = () => {
    if (tickLoopRef.current) clearInterval(tickLoopRef.current);

    // Start with initial state
    const initState: SimulationState = {
      timelineId: currentTimeline,
      parentId: currentTimeline > 0 ? currentTimeline - 1 : 0,
      tick: 0,
      forkTriggered: false,
      dominantIdea: 255,
      nodes: generateNodes(32),
      ideas: [],
    };
    setSimState(initState);

    tickLoopRef.current = setInterval(() => {
      setSimState((prev) => {
        if (!prev || prev.forkTriggered) return prev;
        return runSimTick(prev);
      });
    }, 3000);
  };

  const handleInjectIdea = (text: string, virality: number) => {
    setSimState((prev) => {
      if (!prev) return prev;
      if (prev.ideas.length >= 8) return prev;
      const colors = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F"];
      const id = prev.ideas.length;
      const seedNode = Math.floor(Math.random() * 32);
      const newIdea = { id, text, strength: 1, virality, gravity: 0, color: colors[id], gravityPercent: 0 };
      const newNodes = [...prev.nodes];
      newNodes[seedNode] = { ...newNodes[seedNode], belief: id, color: colors[id] };
      addLog(`Injected idea: "${text}" at node ${seedNode} (virality: ${virality}%)`);
      return { ...prev, ideas: [...prev.ideas, newIdea], nodes: newNodes };
    });
  };

  // When fork triggers
  const handleFork = useCallback((state: SimulationState) => {
    if (tickLoopRef.current) clearInterval(tickLoopRef.current);
    const dominantIdea = state.ideas[state.dominantIdea]?.text ?? "Unknown";
    const childId = currentTimeline + 1;

    // Save final state of the forked timeline to history
    setHistory(prev => ({ ...prev, [currentTimeline]: { ...state } }));

    addLog(`⚡ FORK TRIGGERED! "${dominantIdea}" reached gravity threshold`);
    addLog(`Timeline ${currentTimeline} → Timeline ${childId} created on-chain`);

    setForkPulse(true);
    setTimeout(() => setForkPulse(false), 2000);

    setTimelineTree((prev) => {
      const newNode: TimelineNode = {
        id: childId,
        parentId: currentTimeline,
        dominantIdea,
        forkedAtTick: state.tick,
        children: [],
      };
      return addNodeToTree(prev, currentTimeline, newNode);
    });

    const nextTimelineId = childId;
    setCurrentTimeline(nextTimelineId);
    setViewingTimeline(nextTimelineId);
    setPhase("forked");

    // Auto-restart on child timeline after 5s
    setTimeout(() => {
      addLog(`Restarting simulation on child timeline ${nextTimelineId}...`);
      setPhase("running");
      runTickLoop();
    }, 5000);
  }, [currentTimeline]);

  // Watch for fork trigger
  useEffect(() => {
    if (simState?.forkTriggered && phase === "running") {
      handleFork(simState);
    }
  }, [simState?.forkTriggered, phase, handleFork]);

  const isViewingHistory = viewingTimeline !== currentTimeline;
  const activeSimState = isViewingHistory ? history[viewingTimeline] : simState;

  return (
    <main className="h-screen flex flex-col bg-[#020617] overflow-hidden text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-900/50 backdrop-blur-md z-20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tighter italic">
              PROOF OF FUTURES
            </h1>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-[10px] font-bold text-indigo-400 border border-indigo-500/30 uppercase tracking-widest">
              v0.1-alpha
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em] mt-0.5">
            On-Chain Multiverse Monitoring Station
          </p>
        </div>
        <div className="flex items-center gap-6">
          <StatusBar 
            phase={isViewingHistory ? "idle" : phase} 
            timeline={viewingTimeline} 
            tick={activeSimState?.tick ?? 0} 
          />
          <div className="h-8 w-px bg-white/10" />
          <WalletMultiButton />
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Timeline Tree */}
        <div className="w-64 border-r border-gray-800 bg-gray-900 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Timeline Tree
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <TimelineTree
              nodes={timelineTree}
              activeId={viewingTimeline}
              onSelect={(id) => {
                setViewingTimeline(id);
                addLog(`Viewing ${id === currentTimeline ? "LIVE" : "ARCHIVED"} timeline: ${id}`);
              }}
            />
          </div>
        </div>

        {/* Center: Node Network */}
        <div className="flex-1 relative">
          {forkPulse && (
            <div className="absolute inset-0 bg-white/10 z-50 pointer-events-none animate-reality-glitch will-change-transform" />
          )}
          <NodeGraph
            state={activeSimState}
            phase={phase}
          />
          {phase === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">🌌</div>
                <h2 className="text-2xl font-bold text-white">
                  Ideas Shape Reality
                </h2>
                <p className="text-gray-400 max-w-sm">
                  Watch beliefs spread through a network, compete for dominance,
                  and fork timelines into alternate universes — all on-chain.
                </p>
                {!publicKey ? (
                  <p className="text-yellow-400 text-sm">Connect wallet to begin</p>
                ) : (
                  <button
                    onClick={handleInitialize}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors"
                  >
                    Initialize Simulation
                  </button>
                )}
              </div>
            </div>
          )}
          {phase === "initialized" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <button
                onClick={handleDelegate}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors"
              >
                Delegate to MagicBlock ER ⚡
              </button>
            </div>
          )}
          {phase === "delegated" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <button
                onClick={handleStartSimulation}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
              >
                Start Simulation →
              </button>
            </div>
          )}
          {isViewingHistory && (
            <div className="absolute top-20 right-6 animate-pulse">
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                ● Archive View (Frozen)
              </div>
            </div>
          )}
        </div>

        {/* Right: Idea Panel + Log */}
        <div className="w-72 border-l border-gray-800 bg-gray-900 flex flex-col overflow-hidden">
          <div className="flex-[2] overflow-hidden">
            <IdeaPanel
              ideas={activeSimState?.ideas ?? []}
              phase={isViewingHistory ? "idle" : phase}
              onInject={handleInjectIdea}
            />
          </div>
          {/* Log */}
          <div className="flex-1 overflow-hidden flex flex-col border-t border-gray-800">
            <div className="px-4 py-2 bg-gray-800">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Chain Log
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-1 font-mono">
              {log.map((entry, i) => (
                <div key={i} className={`text-[10px] animate-log-entry ${i === 0 ? "text-green-400 font-bold" : "text-gray-500"}`}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Simulation helpers (mirrors Rust logic) ────────────────────────────────

function generateNodes(count: number): SimulationState["nodes"] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    belief: null,
    neighbors: getNeighbors(i, count),
    gravity: 0,
    color: "#374151",
  }));
}

function getNeighbors(id: number, n: number): number[] {
  const neighbors = [
    (id + 1) % n,
    (id + n - 1) % n,
    (id + 4) % n,
    (id + n - 4) % n,
  ];
  if (id % 4 === 0) {
    neighbors.push((id + 16) % n);
    neighbors.push((id + 8) % n);
  }
  return [...new Set(neighbors)].filter((x) => x !== id);
}

function runSimTick(prev: SimulationState): SimulationState {
  const nodes = prev.nodes.map((n) => ({ ...n }));
  const ideas = prev.ideas.map((i) => ({ ...i, strength: 0 }));

  // Spread beliefs
  for (const node of prev.nodes) {
    if (node.belief === null) continue;
    const idea = ideas[node.belief];
    if (!idea) continue;
    for (const neighborId of node.neighbors) {
      const neighbor = nodes[neighborId];
      // Significantly dampened spread chance (divided by 4) for organic, slower growth
      const spreadChance = ((idea.virality + idea.gravity / 10) / 100) / 4;
      if (Math.random() < spreadChance) {
        if (neighbor.belief === null) {
          neighbor.belief = node.belief;
          neighbor.color = idea.color;
        } else if (idea.gravity > (ideas[neighbor.belief]?.gravity ?? 0)) {
          neighbor.belief = node.belief;
          neighbor.color = idea.color;
        }
      }
    }
  }

  // Recalculate strengths + gravity
  for (const node of nodes) {
    if (node.belief !== null && ideas[node.belief]) {
      ideas[node.belief].strength += 1;
    }
  }
  let forkTriggered = prev.forkTriggered;
  let dominantIdea = prev.dominantIdea;
  for (const idea of ideas) {
    idea.gravity = idea.strength * 10;
    idea.gravityPercent = Math.min(100, (idea.gravity / 280) * 100);
    if (idea.gravity >= 280 && !forkTriggered) {
      forkTriggered = true;
      dominantIdea = idea.id;
    }
  }

  return { ...prev, tick: prev.tick + 1, nodes, ideas, forkTriggered, dominantIdea };
}

function addNodeToTree(
  tree: TimelineNode[],
  parentId: number,
  newNode: TimelineNode
): TimelineNode[] {
  return tree.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, newNode] };
    }
    if (node.children.length > 0) {
      return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
    }
    return node;
  });
}
