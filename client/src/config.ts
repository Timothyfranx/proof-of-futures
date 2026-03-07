import { Connection, PublicKey } from "@solana/web3.js";

// ── Endpoints ──────────────────────────────────────────────────────────────
export const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";

// MagicBlock ER devnet endpoint (US)
export const ER_DEVNET_RPC = "https://devnet-us.magicblock.app";

// ── Program IDs ────────────────────────────────────────────────────────────
export const PROGRAM_ID = new PublicKey(
  "ProFut11111111111111111111111111111111111111"
);

// MagicBlock delegation program (devnet)
export const DELEGATION_PROGRAM_ID = new PublicKey(
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
);

// ER validator pubkey (US devnet)
export const ER_VALIDATOR = new PublicKey(
  "MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd"
);

// ── Connections ────────────────────────────────────────────────────────────
export const baseConnection = new Connection(SOLANA_DEVNET_RPC, "confirmed");
export const erConnection = new Connection(ER_DEVNET_RPC, "confirmed");

// ── Simulation constants ────────────────────────────────────────────────────
export const FORK_THRESHOLD = 500;
export const TICK_INTERVAL_MS = 1000; // 1 second ticks
export const IDEA_COLORS = [
  "#FF6B6B", // red
  "#4ECDC4", // teal
  "#45B7D1", // blue
  "#96CEB4", // green
  "#FFEAA7", // yellow
  "#DDA0DD", // plum
  "#98D8C8", // mint
  "#F7DC6F", // gold
];

// ── PDA helpers ─────────────────────────────────────────────────────────────
export function getSimulationPDA(timelineId: bigint): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(timelineId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("simulation"), idBuffer],
    PROGRAM_ID
  );
}

export function getForkRecordPDA(childTimelineId: bigint): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(childTimelineId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("fork"), idBuffer],
    PROGRAM_ID
  );
}
