"use client";

import { useMemo, useCallback } from "react";
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

// Custom node component
function BeliefNode({ data }: NodeProps) {
  return (
    <div
      style={{
        width: data.size,
        height: data.size,
        borderRadius: "50%",
        backgroundColor: data.color,
        border: `2px solid ${data.border}`,
        boxShadow: data.glowing ? `0 0 12px ${data.color}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "8px",
        fontWeight: "bold",
        color: "#fff",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {data.id}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

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
          // Color edge if both nodes share a belief
          const sameBeliefColor =
            node.belief !== null &&
            state.nodes[neighborId]?.belief === node.belief
              ? node.color
              : "#374151";

          rfEdges.push({
            id: `e${key}`,
            source: `n${node.id}`,
            target: `n${neighborId}`,
            style: {
              stroke: sameBeliefColor,
              strokeWidth: sameBeliefColor !== "#374151" ? 2 : 1,
              opacity: 0.6,
            },
            animated: sameBeliefColor !== "#374151",
          });
        }
      }
    }

    return { rfNodes, rfEdges };
  }, [state]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  // Sync state changes
  const currentNodes = rfNodes.length > 0 ? rfNodes : nodes;
  const currentEdges = rfEdges.length > 0 ? rfEdges : edges;

  if (phase === "idle") return null;

  return (
    <div className="w-full h-full bg-gray-950">
      <ReactFlow
        nodes={currentNodes}
        edges={currentEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1f2937"
        />
      </ReactFlow>

      {/* Tick counter overlay */}
      {state && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur px-4 py-1 rounded-full border border-gray-700 text-xs text-gray-300">
          Timeline {state.timelineId} · Tick {state.tick} · {state.nodes.filter(n => n.belief !== null).length}/{state.nodes.length} nodes converted
        </div>
      )}
    </div>
  );
}
