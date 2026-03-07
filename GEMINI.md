# ⚡ GEMINI.md - Proof of Futures Context

## Project Overview
**Proof of Futures** is an on-chain multiverse simulation where competing ideas (rumors, beliefs, theories) spread through a network of nodes, eventually reaching a "gravity threshold" that triggers a permanent fork in reality.

The project is built for the **MagicBlock Real-Time Hackathon**, leveraging **Ephemeral Rollups (ER)** for sub-50ms simulation ticks and high-frequency state updates, with finality and fork records committed back to the Solana base layer (devnet).

### Core Components
- **`program/`**: Solana Anchor program (written in Rust) containing the simulation logic (`initialize_timeline`, `tick`, `inject_idea`, `record_fork`).
- **`client/`**: TypeScript simulation driver that runs the tick loop, manages delegation to the MagicBlock ER, and executes the fork/undelegate transitions.
- **`frontend/`**: Next.js 14 application providing a real-time visualization of the node graph (via React Flow) and the timeline tree.

### Key Technologies
- **Blockchain**: Solana (Anchor 0.30.1)
- **Real-time Engine**: MagicBlock Ephemeral Rollups (ER)
- **Frontend**: Next.js 14, React Flow, Tailwind CSS, Solana Wallet Adapter
- **Topology**: 32-node small-world network (ring + long-range connections)

---

## Building and Running

### Solana Program (Anchor)
1.  **Build**: `cd program && anchor build`
2.  **Deploy**: `cd program && anchor deploy --provider.cluster devnet`
3.  **Update IDs**: After deployment, update `declare_id!` in `lib.rs`, `Anchor.toml`, and `PROGRAM_ID` in `frontend/lib/config.ts` and `client/src/config.ts`.

### Frontend (Next.js)
1.  **Install**: `cd frontend && npm install`
2.  **Dev**: `cd frontend && npm run dev`
3.  **URL**: [http://localhost:3000](http://localhost:3000)

### Client Simulation (Tick Loop)
The simulation is driven by the `client/src/tick-loop.ts` logic, which is integrated into the frontend. It uses a dedicated `ER_DEVNET_RPC` for high-frequency instructions.

---

## Development Conventions

### State & Accounts
- **`SimulationState`**: Main account holding the 32 nodes, current ideas, and simulation status. Seeds: `[b"simulation", timeline_id.to_le_bytes()]`.
- **`ForkRecord`**: Permanent record of a fork event on the base layer. Seeds: `[b"fork", child_timeline_id.to_le_bytes()]`.

### Simulation Logic
- **Gravity Threshold**: Hit at 500 units (`FORK_THRESHOLD`).
- **Max Capacities**: 64 nodes, 8 ideas, 6 neighbors per node.
- **Spread Mechanism**: Probabilistic based on idea virality and gravity, calculated every ~1s tick.

### Delegation Workflow (MagicBlock)
1.  Initialize `SimulationState` on Solana Devnet.
2.  Delegate account to the MagicBlock ER Validator.
3.  Perform fast `tick` and `inject_idea` calls inside the ER.
4.  On fork, `commit_and_undelegate` state back to Devnet.
5.  Initialize the new (child) timeline and repeat.

---

## Key Files
- `program/programs/proof_of_futures/src/lib.rs`: Core simulation logic.
- `client/src/config.ts`: Network endpoints (Devnet + ER), PDAs, and constants.
- `client/src/tick-loop.ts`: Logic for driving the simulation via ER.
- `frontend/app/page.tsx`: Main UI entry point.
- `frontend/components/NodeGraph.tsx`: React Flow implementation for the node network.
