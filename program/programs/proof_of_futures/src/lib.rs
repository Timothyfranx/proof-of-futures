use anchor_lang::prelude::*;

declare_id!("ProFut11111111111111111111111111111111111111");

pub const MAX_NODES: usize = 64;
pub const MAX_IDEAS: usize = 8;
pub const MAX_NEIGHBORS: usize = 6;
pub const FORK_THRESHOLD: u32 = 500;
pub const GRAVITY_MULTIPLIER: u32 = 10;

#[program]
pub mod proof_of_futures {
    use super::*;

    /// Initialize a new timeline simulation
    pub fn initialize_timeline(
        ctx: Context<InitializeTimeline>,
        timeline_id: u64,
        parent_id: u64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.simulation_state;
        state.timeline_id = timeline_id;
        state.parent_id = parent_id;
        state.tick = 0;
        state.fork_triggered = false;
        state.dominant_idea = u8::MAX; // none yet

        // Seed 32 nodes in a small-world network
        let mut nodes: Vec<NodeData> = Vec::new();
        for i in 0..32u8 {
            let neighbors = get_default_neighbors(i);
            nodes.push(NodeData {
                id: i,
                belief: None,
                neighbors,
                gravity: 0,
            });
        }
        state.nodes = nodes;
        state.ideas = Vec::new();

        msg!("Timeline {} initialized", timeline_id);
        Ok(())
    }

    /// Inject a new idea into the simulation
    pub fn inject_idea(
        ctx: Context<UpdateSimulation>,
        text: String,
        virality: u8,
        seed_node: u8,
    ) -> Result<()> {
        let state = &mut ctx.accounts.simulation_state;

        require!(state.ideas.len() < MAX_IDEAS, ErrorCode::TooManyIdeas);
        require!((seed_node as usize) < state.nodes.len(), ErrorCode::InvalidNode);
        require!(virality <= 100, ErrorCode::InvalidVirality);

        let idea_id = state.ideas.len() as u8;
        state.ideas.push(IdeaData {
            id: idea_id,
            text: text.clone(),
            strength: 1,
            virality,
            gravity: 0,
        });

        // Seed the idea into the starting node
        state.nodes[seed_node as usize].belief = Some(idea_id);

        msg!("Idea '{}' injected at node {}", text, seed_node);
        Ok(())
    }

    /// Run one simulation tick — spread beliefs, update gravity
    /// Called every ~1s from the TypeScript client via ER
    pub fn tick(ctx: Context<UpdateSimulation>, random_seed: u64) -> Result<()> {
        let state = &mut ctx.accounts.simulation_state;

        if state.fork_triggered {
            return Ok(());
        }

        state.tick += 1;

        // Snapshot current beliefs to avoid mutation during iteration
        let node_count = state.nodes.len();
        let mut new_beliefs: Vec<Option<u8>> = state.nodes.iter().map(|n| n.belief).collect();

        // Spread beliefs
        for i in 0..node_count {
            if let Some(idea_id) = state.nodes[i].belief {
                if (idea_id as usize) >= state.ideas.len() {
                    continue;
                }
                let virality = state.ideas[idea_id as usize].virality as u64;
                let gravity = state.ideas[idea_id as usize].gravity as u64;

                let neighbors = state.nodes[i].neighbors.clone();
                for &neighbor_id in &neighbors {
                    if (neighbor_id as usize) >= node_count {
                        continue;
                    }
                    // Pseudo-random spread using tick + node ids + seed
                    let hash = (random_seed
                        .wrapping_add(i as u64)
                        .wrapping_add(neighbor_id as u64)
                        .wrapping_add(state.tick))
                        % 100;
                    let spread_chance = virality.saturating_add(gravity / 10).min(95);

                    if hash < spread_chance {
                        // Only convert if neighbor has no belief or weaker gravity
                        if let Some(existing) = new_beliefs[neighbor_id as usize] {
                            let existing_gravity = state.ideas[existing as usize].gravity;
                            let new_gravity = state.ideas[idea_id as usize].gravity;
                            if new_gravity > existing_gravity {
                                new_beliefs[neighbor_id as usize] = Some(idea_id);
                            }
                        } else {
                            new_beliefs[neighbor_id as usize] = Some(idea_id);
                        }
                    }
                }
            }
        }

        // Apply new beliefs
        for i in 0..node_count {
            state.nodes[i].belief = new_beliefs[i];
        }

        // Recalculate idea strength and gravity
        let idea_count = state.ideas.len();
        let mut strengths = vec![0u32; idea_count];
        for node in &state.nodes {
            if let Some(idea_id) = node.belief {
                if (idea_id as usize) < idea_count {
                    strengths[idea_id as usize] += 1;
                }
            }
        }
        for i in 0..idea_count {
            state.ideas[i].strength = strengths[i];
            state.ideas[i].gravity = strengths[i] * GRAVITY_MULTIPLIER;
        }

        // Check fork threshold
        for idea in &state.ideas {
            if idea.gravity >= FORK_THRESHOLD {
                state.fork_triggered = true;
                state.dominant_idea = idea.id;
                msg!(
                    "FORK TRIGGERED: idea '{}' reached gravity {}",
                    idea.text,
                    idea.gravity
                );
                break;
            }
        }

        Ok(())
    }

    /// Fork: called after commit_and_undelegate — records fork on base layer
    pub fn record_fork(
        ctx: Context<RecordFork>,
        child_timeline_id: u64,
        dominant_idea_text: String,
    ) -> Result<()> {
        let fork = &mut ctx.accounts.fork_record;
        fork.parent_timeline_id = ctx.accounts.simulation_state.timeline_id;
        fork.child_timeline_id = child_timeline_id;
        fork.dominant_idea = dominant_idea_text;
        fork.forked_at_tick = ctx.accounts.simulation_state.tick;
        fork.timestamp = Clock::get()?.unix_timestamp;

        msg!(
            "Fork recorded: timeline {} → {}",
            fork.parent_timeline_id,
            fork.child_timeline_id
        );
        Ok(())
    }
}

// ============================================================
// ACCOUNTS
// ============================================================

#[derive(Accounts)]
#[instruction(timeline_id: u64)]
pub struct InitializeTimeline<'info> {
    #[account(
        init,
        payer = payer,
        space = SimulationState::space(),
        seeds = [b"simulation", timeline_id.to_le_bytes().as_ref()],
        bump
    )]
    pub simulation_state: Account<'info, SimulationState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateSimulation<'info> {
    #[account(mut)]
    pub simulation_state: Account<'info, SimulationState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(child_timeline_id: u64)]
pub struct RecordFork<'info> {
    #[account(
        init,
        payer = payer,
        space = ForkRecord::space(),
        seeds = [b"fork", child_timeline_id.to_le_bytes().as_ref()],
        bump
    )]
    pub fork_record: Account<'info, ForkRecord>,
    pub simulation_state: Account<'info, SimulationState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ============================================================
// STATE
// ============================================================

#[account]
pub struct SimulationState {
    pub timeline_id: u64,
    pub parent_id: u64,
    pub tick: u64,
    pub fork_triggered: bool,
    pub dominant_idea: u8,
    pub nodes: Vec<NodeData>,
    pub ideas: Vec<IdeaData>,
}

impl SimulationState {
    pub fn space() -> usize {
        8   // discriminator
        + 8 // timeline_id
        + 8 // parent_id
        + 8 // tick
        + 1 // fork_triggered
        + 1 // dominant_idea
        + 4 + (MAX_NODES * NodeData::size()) // nodes vec
        + 4 + (MAX_IDEAS * IdeaData::size()) // ideas vec
    }
}

#[account]
pub struct ForkRecord {
    pub parent_timeline_id: u64,
    pub child_timeline_id: u64,
    pub dominant_idea: String,
    pub forked_at_tick: u64,
    pub timestamp: i64,
}

impl ForkRecord {
    pub fn space() -> usize {
        8 + 8 + 8 + 4 + 64 + 8 + 8
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct NodeData {
    pub id: u8,
    pub belief: Option<u8>,
    pub neighbors: Vec<u8>,
    pub gravity: u32,
}

impl NodeData {
    pub fn size() -> usize {
        1 + 2 + (4 + MAX_NEIGHBORS) + 4
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct IdeaData {
    pub id: u8,
    pub text: String,
    pub strength: u32,
    pub virality: u8,
    pub gravity: u32,
}

impl IdeaData {
    pub fn size() -> usize {
        1 + (4 + 64) + 4 + 1 + 4
    }
}

// ============================================================
// HELPERS
// ============================================================

fn get_default_neighbors(node_id: u8) -> Vec<u8> {
    // Ring topology + some cross-links for small-world feel
    let n = 32u8;
    let mut neighbors = vec![
        (node_id + 1) % n,
        (node_id + n - 1) % n,
        (node_id + 4) % n,
        (node_id + n - 4) % n,
    ];
    // Add a few long-range connections based on node id
    if node_id % 4 == 0 {
        neighbors.push((node_id + 16) % n);
        neighbors.push((node_id + 8) % n);
    }
    neighbors
}

// ============================================================
// ERRORS
// ============================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Maximum number of ideas reached")]
    TooManyIdeas,
    #[msg("Invalid node ID")]
    InvalidNode,
    #[msg("Virality must be 0-100")]
    InvalidVirality,
}
