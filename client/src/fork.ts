import * as anchor from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { baseConnection, getSimulationPDA, getForkRecordPDA } from "./config";
import { commitAndUndelegate } from "./delegate";
import { initializeTimeline, delegateToER } from "./delegate";
import { startTickLoop, stopTickLoop } from "./tick-loop";
import { SimulationState } from "./subscribe";

let currentTimelineId = 0n;
const forkHistory: Array<{ parent: bigint; child: bigint; idea: string }> = [];

/**
 * Execute a full fork:
 * 1. Stop tick loop
 * 2. Commit + undelegate current ER state to base layer
 * 3. Record fork on-chain
 * 4. Initialize new child timeline
 * 5. Delegate child to new ER
 * 6. Restart tick loop on child
 */
export async function executeFork(
  program: anchor.Program,
  wallet: anchor.Wallet,
  parentTimelineId: bigint,
  forkState: SimulationState,
  onTick: (state: SimulationState, tick: number) => void,
  onFork: (state: SimulationState) => void
): Promise<bigint> {
  console.log(`Executing fork from timeline ${parentTimelineId}...`);

  // Stop tick loop on parent
  stopTickLoop();

  // Commit parent state back to base layer
  await commitAndUndelegate(program, wallet, parentTimelineId);

  // Get dominant idea text
  const dominantIdeaText =
    forkState.ideas[forkState.dominantIdea]?.text ?? "Unknown Idea";

  // Create new child timeline ID
  const childTimelineId = parentTimelineId + 1n + BigInt(forkHistory.length);
  console.log(`Creating child timeline ${childTimelineId}...`);

  // Record fork on base layer
  const [simulationPDA] = getSimulationPDA(parentTimelineId);
  const [forkRecordPDA] = getForkRecordPDA(childTimelineId);

  await program.methods
    .recordFork(
      new anchor.BN(childTimelineId.toString()),
      dominantIdeaText
    )
    .accounts({
      forkRecord: forkRecordPDA,
      simulationState: simulationPDA,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log(`Fork recorded on-chain!`);

  // Track fork history
  forkHistory.push({
    parent: parentTimelineId,
    child: childTimelineId,
    idea: dominantIdeaText,
  });

  // Initialize child timeline (inherits parent state)
  await initializeTimeline(program, wallet, childTimelineId, parentTimelineId);

  // Delegate child to fresh ER session
  await delegateToER(program, wallet, childTimelineId);

  // Resume tick loop on child timeline
  currentTimelineId = childTimelineId;
  startTickLoop(program, wallet, childTimelineId, onTick, onFork);

  console.log(`Child timeline ${childTimelineId} is live on ER!`);
  return childTimelineId;
}

export function getForkHistory() {
  return [...forkHistory];
}

export function getCurrentTimelineId() {
  return currentTimelineId;
}

export function setCurrentTimelineId(id: bigint) {
  currentTimelineId = id;
}
