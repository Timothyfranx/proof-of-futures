import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { erConnection, baseConnection, IDEA_COLORS, getSimulationPDA, getForkRecordPDA } from "./config";

// ── Types ──────────────────────────────────────────────────────────────────

export interface NodeData {
  id: number;
  belief: number | null;
  neighbors: number[];
  gravity: number;
  color: string; // derived from belief
}

export interface IdeaData {
  id: number;
  text: string;
  strength: number;
  virality: number;
  gravity: number;
  color: string;
  gravityPercent: number; // 0-100 toward fork threshold
}

export interface SimulationState {
  timelineId: number;
  parentId: number;
  tick: number;
  forkTriggered: boolean;
  dominantIdea: number;
  nodes: NodeData[];
  ideas: IdeaData[];
}

export interface ForkRecord {
  parentTimelineId: number;
  childTimelineId: number;
  dominantIdea: string;
  forkedAtTick: number;
  timestamp: number;
}

export interface TimelineNode {
  id: number;
  parentId: number | null;
  dominantIdea: string;
  forkedAtTick: number;
  children: TimelineNode[];
}

// ── Parsers ────────────────────────────────────────────────────────────────

export function parseSimulationState(raw: any): SimulationState {
  const ideas: IdeaData[] = raw.ideas.map((idea: any, i: number) => ({
    id: idea.id,
    text: idea.text,
    strength: idea.strength,
    virality: idea.virality,
    gravity: idea.gravity,
    color: IDEA_COLORS[i % IDEA_COLORS.length],
    gravityPercent: Math.min(100, (idea.gravity / 500) * 100),
  }));

  const nodes: NodeData[] = raw.nodes.map((node: any) => ({
    id: node.id,
    belief: node.belief !== null ? node.belief : null,
    neighbors: node.neighbors,
    gravity: node.gravity,
    color:
      node.belief !== null && ideas[node.belief]
        ? ideas[node.belief].color
        : "#374151", // gray = no belief
  }));

  return {
    timelineId: raw.timelineId.toNumber(),
    parentId: raw.parentId.toNumber(),
    tick: raw.tick.toNumber(),
    forkTriggered: raw.forkTriggered,
    dominantIdea: raw.dominantIdea,
    nodes,
    ideas,
  };
}

// ── Fetchers ───────────────────────────────────────────────────────────────

/**
 * Fetch simulation state from ER (live, fast)
 */
export async function fetchERState(
  program: anchor.Program,
  wallet: anchor.Wallet,
  timelineId: bigint
): Promise<SimulationState | null> {
  try {
    const erProvider = new anchor.AnchorProvider(erConnection, wallet, {
      commitment: "processed",
    });
    const erProgram = new anchor.Program(program.idl, erProvider);
    const [simulationPDA] = getSimulationPDA(timelineId);

    const raw = await erProgram.account.simulationState.fetch(simulationPDA);
    return parseSimulationState(raw);
  } catch (err) {
    console.error("Failed to fetch ER state:", err);
    return null;
  }
}

/**
 * Fetch simulation state from base layer (after commit)
 */
export async function fetchBaseState(
  program: anchor.Program,
  timelineId: bigint
): Promise<SimulationState | null> {
  try {
    const [simulationPDA] = getSimulationPDA(timelineId);
    const raw = await program.account.simulationState.fetch(simulationPDA);
    return parseSimulationState(raw);
  } catch (err) {
    console.error("Failed to fetch base state:", err);
    return null;
  }
}

/**
 * Fetch all fork records from base layer to build the timeline tree
 */
export async function fetchAllForks(
  program: anchor.Program
): Promise<ForkRecord[]> {
  try {
    const forks = await program.account.forkRecord.all();
    return forks.map((f) => ({
      parentTimelineId: f.account.parentTimelineId.toNumber(),
      childTimelineId: f.account.childTimelineId.toNumber(),
      dominantIdea: f.account.dominantIdea,
      forkedAtTick: f.account.forkedAtTick.toNumber(),
      timestamp: f.account.timestamp.toNumber(),
    }));
  } catch (err) {
    console.error("Failed to fetch fork records:", err);
    return [];
  }
}

/**
 * Build a timeline tree from fork records
 */
export function buildTimelineTree(forks: ForkRecord[]): TimelineNode {
  const root: TimelineNode = {
    id: 0,
    parentId: null,
    dominantIdea: "Origin",
    forkedAtTick: 0,
    children: [],
  };

  const nodeMap = new Map<number, TimelineNode>();
  nodeMap.set(0, root);

  // Build nodes for each fork
  for (const fork of forks) {
    if (!nodeMap.has(fork.parentTimelineId)) {
      nodeMap.set(fork.parentTimelineId, {
        id: fork.parentTimelineId,
        parentId: null,
        dominantIdea: "Unknown",
        forkedAtTick: 0,
        children: [],
      });
    }
    const child: TimelineNode = {
      id: fork.childTimelineId,
      parentId: fork.parentTimelineId,
      dominantIdea: fork.dominantIdea,
      forkedAtTick: fork.forkedAtTick,
      children: [],
    };
    nodeMap.set(fork.childTimelineId, child);
    nodeMap.get(fork.parentTimelineId)!.children.push(child);
  }

  return root;
}

/**
 * Subscribe to ER account changes (websocket)
 */
export function subscribeToSimulation(
  program: anchor.Program,
  wallet: anchor.Wallet,
  timelineId: bigint,
  onChange: (state: SimulationState) => void
): number {
  const erProvider = new anchor.AnchorProvider(erConnection, wallet, {
    commitment: "processed",
  });
  const erProgram = new anchor.Program(program.idl, erProvider);
  const [simulationPDA] = getSimulationPDA(timelineId);

  const listenerId = erProgram.account.simulationState.subscribe(
    simulationPDA,
    "processed"
  );

  erProgram.account.simulationState
    .subscribe(simulationPDA)
    .on("change", (raw: any) => {
      onChange(parseSimulationState(raw));
    });

  return listenerId as unknown as number;
}
