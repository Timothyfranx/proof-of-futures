"use client";

import { useMemo, useCallback, memo, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { SimulationState } from "../lib/types";

interface NodeGraphProps {
  state: SimulationState | null;
  phase: string;
}

// Custom node component optimized with memo and hardware acceleration
const BeliefNode = memo(({ data }: NodeProps) => {
  const hasBelief = data.color !== "#374151";
  return (
    <div
      className={`${hasBelief ? "animate-pulse-glow" : ""}`}
      style={{
        width: data.size,
        height: data.size,
        borderRadius: "50%",
        backgroundColor: data.color,
        boxShadow: hasBelief 
          ? `0 0 15px ${data.color}` 
          : "none",
        border: hasBelief ? "1px solid rgba(255,255,255,0.5)" : "1px solid #4B5563",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "8px",
        color: hasBelief ? "#fff" : "#9CA3AF",
        transform: "translateZ(0)", // Force GPU acceleration
        willChange: "transform, opacity",
        cursor: "default",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {hasBelief ? "" : data.id}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
});

BeliefNode.displayName = "BeliefNode";

const nodeTypes = { belief: BeliefNode };

export default function NodeGraph({ state, phase }: NodeGraphProps) {
  // Convert simulation state to React Flow nodes + edges
  const { rfNodes, rfEdges } = useMemo(() => {
    if (!state || state.nodes.length === 0) {
      return { rfNodes: [], rfEdges: [] };
    }

    const count = state.nodes.length;
    const radius = 220;
    const cx = 300;
    const cy = 280;

    // Position nodes in a circle
    const rfNodes: Node[] = state.nodes.map((node, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      // Nodes with beliefs pulse more
      const hasBelief = node.belief !== null;
      const strength = hasBelief && state.ideas[node.belief!]
        ? state.ideas[node.belief!].strength
        : 0;
      const size = 20 + Math.min(strength * 0.5, 14);

      return {
        id: `n${node.id}`,
        type: "belief",
        position: { x: x - size / 2, y: y - size / 2 },
        data: {
          id: node.id,
          color: node.color,
          border: hasBelief ? node.color : "#6B7280",
          size,
          glowing: hasBelief && strength > 8,
        },
        draggable: false,
      };
    });

    // Create edges (deduplicated)
    const edgeSet = new Set<string>();
    const rfEdges: Edge[] = [];

    for (const node of state.nodes) {
      for (const neighborId of node.neighbors) {
        const key = [Math.min(node.id, neighborId), Math.max(node.id, neighborId)].join("-");
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          const isSameBelief = node.belief !== null && state.nodes[neighborId]?.belief === node.belief;
          const sameBeliefColor = isSameBelief ? node.color : "#374151";

          rfEdges.push({
            id: `e${key}`,
            source: `n${node.id}`,
            target: `n${neighborId}`,
            className: isSameBelief ? "animate-glow-line" : "",
            style: {
              stroke: sameBeliefColor,
              strokeWidth: isSameBelief ? 2.5 : 0.5,
              opacity: isSameBelief ? 0.9 : 0.15,
            },
            animated: isSameBelief,
          });
        }
      }
    }

    return { rfNodes, rfEdges };
  }, [state]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Sync state changes when simulation updates
  useEffect(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);

  useEffect(() => {
    setEdges(rfEdges);
  }, [rfEdges, setEdges]);

  if (phase === "idle" && !state) return null;

  return (
    <div className="w-full h-full bg-[#020617]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={true}
        panOnScroll={true}
        panOnDrag={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1e293b"
        />
      </ReactFlow>

      {/* Tick counter overlay */}
      {state && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Timeline {state.timelineId} · Tick {state.tick}
          </div>
          <div className="w-64 h-1.5 bg-slate-800/50 rounded-full overflow-hidden border border-white/5 flex">
            {state.ideas.map(idea => (
              <div 
                key={idea.id}
                style={{ 
                  width: `${(idea.strength / state.nodes.length) * 100}%`,
                  backgroundColor: idea.color,
                  boxShadow: `0 0 10px ${idea.color}`
                }}
                className="h-full transition-all duration-1000"
              />
            ))}
          </div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Belief Saturation: {state.nodes.filter(n => n.belief !== null).length}/{state.nodes.length}
          </div>
        </div>
      )}
    </div>
  );
}
