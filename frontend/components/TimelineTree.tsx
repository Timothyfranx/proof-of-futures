"use client";

import { TimelineNode } from "../lib/types";

interface TimelineTreeProps {
  nodes: TimelineNode[];
  activeId: number;
  onSelect: (id: number) => void;
}

function TreeNode({
  node,
  activeId,
  onSelect,
  depth,
}: {
  node: TimelineNode;
  activeId: number;
  onSelect: (id: number) => void;
  depth: number;
}) {
  const isActive = node.id === activeId;
  const isRoot = node.parentId === null;

  return (
    <div className="relative">
      {/* Connector line */}
      {!isRoot && (
        <div
          className="absolute left-3 -top-3 w-px h-3 bg-gray-600"
          style={{ left: depth * 16 + 12 }}
        />
      )}

      <button
        onClick={() => onSelect(node.id)}
        className={`w-full text-left rounded-lg px-3 py-2 mb-1 transition-all flex items-start gap-2 ${
          isActive
            ? "glass-panel bg-indigo-500/20 border-indigo-500/50"
            : "hover:bg-gray-800/50 border border-transparent"
        }`}
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isActive ? "bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" : "bg-gray-600"
              }`}
            />
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isActive ? "text-indigo-300" : "text-gray-400"
              }`}
            >
              Timeline {node.id}
            </span>
          </div>
          {!isRoot && (
            <div className="ml-3.5 mt-0.5 leading-tight">
              <div className="text-[10px] text-gray-500 italic truncate max-w-[140px]">
                "{node.dominantIdea}"
              </div>
              <div className="text-[9px] text-gray-600 font-mono">
                FORKED @ T{node.forkedAtTick}
              </div>
            </div>
          )}
          {isRoot && (
            <div className="ml-3.5 mt-0.5 text-[10px] text-gray-600 uppercase tracking-tighter">
              Origin Universe
            </div>
          )}
        </div>
      </button>

      {/* Children */}
      {node.children.length > 0 && (
        <div className="relative">
          {/* Vertical connecting line */}
          <div
            className="absolute w-px bg-gray-700"
            style={{
              left: depth * 16 + 12 + 16,
              top: 0,
              height: "100%",
            }}
          />
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeId={activeId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TimelineTree({
  nodes,
  activeId,
  onSelect,
}: TimelineTreeProps) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          activeId={activeId}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}
