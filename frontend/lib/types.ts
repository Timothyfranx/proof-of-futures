export interface NodeData {
  id: number;
  belief: number | null;
  neighbors: number[];
  gravity: number;
  color: string;
}

export interface IdeaData {
  id: number;
  text: string;
  strength: number;
  virality: number;
  gravity: number;
  color: string;
  gravityPercent: number;
}

export interface SimulationState {
  timelineId: number;
  parentId: number;
  tick: number;
  forkTriggered: boolean;
  dominantIdea: number;
  nodes: NodeData[];
  ideas: IdeaData[];
}

export interface TimelineNode {
  id: number;
  parentId: number | null;
  dominantIdea: string;
  forkedAtTick: number;
  children: TimelineNode[];
}

export function buildTimelineTree(
  forks: Array<{
    parentTimelineId: number;
    childTimelineId: number;
    dominantIdea: string;
    forkedAtTick: number;
  }>
): TimelineNode[] {
  const root: TimelineNode = {
    id: 0,
    parentId: null,
    dominantIdea: "Origin",
    forkedAtTick: 0,
    children: [],
  };
  const nodeMap = new Map<number, TimelineNode>();
  nodeMap.set(0, root);

  for (const fork of forks) {
    if (!nodeMap.has(fork.parentTimelineId)) {
      nodeMap.set(fork.parentTimelineId, {
        id: fork.parentTimelineId,
        parentId: null,
        dominantIdea: "Unknown",
        forkedAtTick: 0,
        children: [],
      });
    }
    const child: TimelineNode = {
      id: fork.childTimelineId,
      parentId: fork.parentTimelineId,
      dominantIdea: fork.dominantIdea,
      forkedAtTick: fork.forkedAtTick,
      children: [],
    };
    nodeMap.set(fork.childTimelineId, child);
    nodeMap.get(fork.parentTimelineId)!.children.push(child);
  }

  return [root];
}
