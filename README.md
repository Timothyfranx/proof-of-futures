# ⚡ Proof of Futures

> Ideas spread like rumors, compete for belief, and when one becomes strong enough — it literally forks reality into a new universe. All running on-chain in real time.

Built for the **MagicBlock Real-Time Hackathon** using **Ephemeral Rollups**.

---

## What It Does

Proof of Futures is a live, on-chain multiverse simulation where ideas compete to shape alternate realities.

1. **Inject ideas** (rumors, beliefs, theories) into a network of 32 nodes
2. **Watch them spread** in real time via the MagicBlock Ephemeral Rollup
3. **Gravity builds** as more nodes adopt an idea
4. **When gravity threshold hits** → the timeline **forks** into a new universe on Solana base layer
5. **Explore multiple timelines** — each evolves independently

### Why MagicBlock?

Each timeline is an Ephemeral Rollup session. The simulation runs inside the ER at sub-50ms per tick. When an idea dominates, we commit state back to Solana and create a permanent, immutable fork record on-chain. **The ER is the simulation engine — not cosmetic.**

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           Solana Base Layer (devnet)         │
│  SimulationState account (initialized here) │
│  ForkRecord accounts (written on each fork) │
└──────────────────┬──────────────────────────┘
                   │ delegate()
                   ▼
┌─────────────────────────────────────────────┐
│     MagicBlock Ephemeral Rollup (ER)         │
│  tick() — runs spread logic every 1s        │
│  inject_idea() — user injects beliefs       │
│  All updates at <50ms, zero fees            │
└──────────────────┬──────────────────────────┘
                   │ commit_and_undelegate() on fork
                   ▼
┌─────────────────────────────────────────────┐
│        New Timeline → New ER Session         │
│  record_fork() writes permanent fork record  │
│  Child timeline delegated to fresh ER       │
└─────────────────────────────────────────────┘
```

---

## Project Structure

```
proof-of-futures/
├── program/                    # Anchor Solana program
│   ├── programs/proof_of_futures/src/lib.rs
│   ├── Anchor.toml
│   └── Cargo.toml
├── client/                     # TypeScript ER client
│   └── src/
│       ├── config.ts           # Endpoints, PDAs, constants
│       ├── delegate.ts         # Init, delegate, undelegate
│       ├── tick-loop.ts        # Simulation tick driver
│       ├── subscribe.ts        # State parsing + subscriptions
│       └── fork.ts             # Fork execution logic
└── frontend/                   # Next.js app
    ├── app/
    │   ├── layout.tsx          # Wallet providers
    │   ├── page.tsx            # Main simulation UI
    │   └── globals.css
    ├── components/
    │   ├── NodeGraph.tsx       # React Flow belief network
    │   ├── TimelineTree.tsx    # Branching timeline panel
    │   ├── IdeaPanel.tsx       # Inject ideas + gravity meters
    │   └── StatusBar.tsx       # Live ER status
    └── lib/
        ├── types.ts
        └── config.ts
```

---

## Setup & Run

### Prerequisites

- Node.js 18+
- Rust + Anchor CLI (`avm install latest`)
- Solana CLI (`solana-install init 1.18.0`)
- Phantom wallet (devnet)

### 1. Deploy the Program

```bash
cd program
anchor build
anchor deploy --provider.cluster devnet
```

Copy the deployed program ID and update:
- `program/programs/proof_of_futures/src/lib.rs` → `declare_id!("YOUR_ID")`
- `program/Anchor.toml` → `proof_of_futures = "YOUR_ID"`
- `frontend/lib/config.ts` → `PROGRAM_ID`
- `client/src/config.ts` → `PROGRAM_ID`

### 2. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

### 3. Demo Flow

1. Connect Phantom wallet (devnet)
2. Click **Initialize Simulation** → creates on-chain account
3. Click **Delegate to MagicBlock ER** → locks account for ER
4. Click **Start Simulation** → tick loop begins
5. **Inject ideas** using presets or custom text + virality
6. Watch nodes light up as beliefs spread
7. When gravity hits 500 → **FORK** → new timeline created on-chain

---

## On-Chain Accounts

| Account | Purpose | Lives on |
|---|---|---|
| `SimulationState` | All node + idea state | ER (while running), Base (after commit) |
| `ForkRecord` | Permanent fork history | Solana base layer |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Onchain | Anchor 0.30 + Solana devnet |
| Real-time | MagicBlock Ephemeral Rollups |
| Frontend | Next.js 14 + React Flow + Tailwind |
| Wallet | Solana Wallet Adapter + Phantom |

---

## Pitch

> "Ideas shape the future. We built a system where beliefs literally compete to create alternate realities on-chain. Watch how rumors spread, evolve, and fork entire timelines in real time — powered by MagicBlock Ephemeral Rollups."
