import * as anchor from "@coral-xyz/anchor";
import { erConnection, TICK_INTERVAL_MS, getSimulationPDA } from "./config";
import { SimulationState, parseSimulationState } from "./subscribe";

let tickLoopActive = false;
let tickInterval: NodeJS.Timeout | null = null;

/**
 * Start the simulation tick loop
 * Sends a tick instruction to the ER every TICK_INTERVAL_MS
 */
export function startTickLoop(
  program: anchor.Program,
  wallet: anchor.Wallet,
  timelineId: bigint,
  onTick: (state: SimulationState, tick: number) => void,
  onFork: (state: SimulationState) => void
): void {
  if (tickLoopActive) {
    console.warn("Tick loop already running");
    return;
  }

  tickLoopActive = true;
  console.log(`Starting tick loop for timeline ${timelineId}...`);

  // Use ER connection for tick transactions
  const erProvider = new anchor.AnchorProvider(erConnection, wallet, {
    commitment: "confirmed",
  });
  const erProgram = new anchor.Program(program.idl, erProvider);
  const [simulationPDA] = getSimulationPDA(timelineId);

  let tickCount = 0;

  tickInterval = setInterval(async () => {
    if (!tickLoopActive) return;

    try {
      // Random seed for spread calculation
      const randomSeed = BigInt(
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
      );

      const tx = await erProgram.methods
        .tick(new anchor.BN(randomSeed.toString()))
        .accounts({
          simulationState: simulationPDA,
          authority: wallet.publicKey,
        })
        .rpc({ commitment: "processed" }); // processed for speed in ER

      tickCount++;

      // Fetch updated state
      const rawState = await erProgram.account.simulationState.fetch(
        simulationPDA
      );
      const state = parseSimulationState(rawState);

      onTick(state, tickCount);

      // Check if fork was triggered
      if (state.forkTriggered) {
        console.log(
          `Fork triggered at tick ${tickCount}! Dominant idea: ${
            state.ideas[state.dominantIdea]?.text ?? "unknown"
          }`
        );
        stopTickLoop();
        onFork(state);
      }
    } catch (err) {
      console.error("Tick error:", err);
      // Don't stop loop on single tick failure
    }
  }, TICK_INTERVAL_MS);
}

/**
 * Stop the tick loop
 */
export function stopTickLoop(): void {
  tickLoopActive = false;
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  console.log("Tick loop stopped");
}

/**
 * Inject a new idea into the running simulation (via ER)
 */
export async function injectIdea(
  program: anchor.Program,
  wallet: anchor.Wallet,
  timelineId: bigint,
  text: string,
  virality: number,
  seedNode: number
): Promise<string> {
  const erProvider = new anchor.AnchorProvider(erConnection, wallet, {
    commitment: "confirmed",
  });
  const erProgram = new anchor.Program(program.idl, erProvider);
  const [simulationPDA] = getSimulationPDA(timelineId);

  console.log(`Injecting idea "${text}" at node ${seedNode}...`);

  const tx = await erProgram.methods
    .injectIdea(text, virality, seedNode)
    .accounts({
      simulationState: simulationPDA,
      authority: wallet.publicKey,
    })
    .rpc({ commitment: "confirmed" });

  console.log(`Idea injected! Tx: ${tx}`);
  return tx;
}
