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
            ? "bg-indigo-600/30 border border-indigo-500/50"
            : "hover:bg-gray-800 border border-transparent"
        }`}
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isActive ? "bg-indigo-400 animate-pulse" : "bg-gray-500"
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                isActive ? "text-indigo-300" : "text-gray-300"
              }`}
            >
              Timeline {node.id}
            </span>
          </div>
          {!isRoot && (
            <div className="ml-4 mt-0.5">
              <div className="text-xs text-gray-500 truncate max-w-[140px]">
                "{node.dominantIdea}"
              </div>
              <div className="text-xs text-gray-600">
                tick {node.forkedAtTick}
              </div>
            </div>
          )}
          {isRoot && (
            <div className="ml-4 mt-0.5 text-xs text-gray-500">
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
