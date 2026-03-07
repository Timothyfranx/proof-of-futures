import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  baseConnection,
  erConnection,
  PROGRAM_ID,
  DELEGATION_PROGRAM_ID,
  ER_VALIDATOR,
  getSimulationPDA,
} from "./config";

/**
 * Step 1: Initialize a new timeline on Solana base layer
 */
export async function initializeTimeline(
  program: anchor.Program,
  wallet: anchor.Wallet,
  timelineId: bigint,
  parentId: bigint = 0n
): Promise<PublicKey> {
  const [simulationPDA] = getSimulationPDA(timelineId);

  console.log(`Initializing timeline ${timelineId}...`);
  console.log(`PDA: ${simulationPDA.toBase58()}`);

  const tx = await program.methods
    .initializeTimeline(
      new anchor.BN(timelineId.toString()),
      new anchor.BN(parentId.toString())
    )
    .accounts({
      simulationState: simulationPDA,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log(`Timeline initialized! Tx: ${tx}`);
  return simulationPDA;
}

/**
 * Step 2: Delegate the simulation account to the Ephemeral Rollup
 * After this, all tick() and inject_idea() calls go to the ER
 */
export async function delegateToER(
  program: anchor.Program,
  wallet: anchor.Wallet,
  timelineId: bigint
): Promise<string> {
  const [simulationPDA] = getSimulationPDA(timelineId);

  console.log(`Delegating timeline ${timelineId} to ER...`);

  // Build delegate instruction using MagicBlock SDK pattern
  // This calls the delegation program to lock the account for ER use
  const delegateTx = await program.methods
    .delegate()
    .accounts({
      payer: wallet.publicKey,
      pda: simulationPDA,
      ownerProgram: PROGRAM_ID,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      erValidator: ER_VALIDATOR,
    })
    .rpc({ commitment: "confirmed" });

  console.log(`Delegated to ER! Tx: ${delegateTx}`);
  console.log(`ER endpoint: ${erConnection.rpcEndpoint}`);
  return delegateTx;
}

/**
 * Commit and undelegate: push ER state back to base layer
 * Called before recording a fork
 */
export async function commitAndUndelegate(
  program: anchor.Program,
  wallet: anchor.Wallet,
  timelineId: bigint
): Promise<string> {
  const [simulationPDA] = getSimulationPDA(timelineId);

  console.log(`Committing timeline ${timelineId} back to base layer...`);

  // Send undelegate instruction to the ER (it handles the commit)
  const erProvider = new anchor.AnchorProvider(
    erConnection,
    wallet,
    { commitment: "confirmed" }
  );
  const erProgram = new anchor.Program(program.idl, erProvider);

  const tx = await erProgram.methods
    .undelegate()
    .accounts({
      payer: wallet.publicKey,
      pda: simulationPDA,
      ownerProgram: PROGRAM_ID,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  console.log(`Committed and undelegated! Tx: ${tx}`);

  // Wait for base layer to reflect the committed state
  await new Promise((r) => setTimeout(r, 2000));
  return tx;
}
