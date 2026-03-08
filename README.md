# ⚡ Proof of Futures

> "Ideas spread like rumors, compete for belief, and when one becomes strong enough — it literally forks reality into a new universe."

Built for the **MagicBlock Real-Time Hackathon**. **Proof of Futures** is an on-chain multiverse simulation where beliefs exert physical pressure on the fabric of reality.

---

## 🌌 Concept
In this simulation, ideas are viral agents. They live in a decentralized network of 32 nodes, spreading from person to person. When an idea achieves enough "Gravity" (social proof), it triggers a **Timeline Fork**, creating a new, independent universe on the Solana base layer.

## ⚙️ How it Works
- **Node Network**: A small-world topology of 32 agents connected in a ring with long-range "shortcuts."
- **Probabilistic Spread**: Beliefs spread based on a combination of their inherent **Virality** and their current **Gravity**.
- **Gravity Physics**: The more nodes adopt a belief, the more "weight" it exerts on the timeline.
- **On-Chain Forks**: When Gravity hits the threshold (280), the Ephemeral Rollup session is committed to Solana, and a permanent `ForkRecord` is created.

## ⚡ Why MagicBlock?
The simulation requires absolute real-time precision.
- **Latency**: Sub-50ms simulation ticks allow for biological-feeling spread.
- **High Frequency**: Ticking the entire network every second would be prohibitively slow and expensive on a base layer.
- **Ephemeral Rollups**: We use MagicBlock ER as the "Simulation Engine." We delegate the universe to the rollup for the high-intensity belief competition and only settle back to Solana when a reality-altering fork occurs.

## 🚀 Presentation Features
- **Multiverse Viewer**: Archive and view previous timelines to see how different beliefs shaped alternate worlds.
- **Belief Saturation**: Real-time visualization of network conquest.
- **Reality Glitch**: High-impact visual feedback when on-chain state transitions occur.

---

## 🛠️ Setup & Run

### Prerequisites
- Node.js 18+
- Rust + Anchor CLI (0.32.1)
- Solana CLI (1.18.0)

### 1. Build & Deploy
```bash
cd program
anchor build
anchor deploy --provider.cluster devnet
```

### 2. Run the Station
```bash
cd frontend
npm install
npm run dev
```
Access the Monitoring Station at `http://localhost:3000`

---

## 🗺️ Architecture
- **Program (Rust/Anchor)**: Core belief physics and fork logic.
- **Simulation Driver (TS)**: Real-time tick engine running on ER.
- **Frontend (Next.js 14)**: React Flow visualization + Multiverse tracking.

---

## 📜 Lore
> "Every belief is a seed. Every spread is a heartbeat. Every fork is a future."
