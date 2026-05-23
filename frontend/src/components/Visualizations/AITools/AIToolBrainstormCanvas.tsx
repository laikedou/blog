'use client';

import { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Position,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Network } from 'lucide-react';

interface Props {
  content: string;
}

interface MindNode {
  id: string;
  label: string;
  level: number;
  children: MindNode[];
  parent?: MindNode;
}

// ── Markdown parser ──

function parseMarkdownToMindmap(md: string): MindNode | null {
  // Strip code fences if AI wrapped the output
  let cleaned = md.replace(/^```[a-z]*\s*\n/gm, '').replace(/^```\s*$/gm, '');
  // Remove preamble text before first heading
  const firstHeading = cleaned.search(/^#{1,4} /m);
  if (firstHeading > 0) cleaned = cleaned.slice(firstHeading);

  const lines = cleaned.split('\n');
  let root: MindNode | null = null;
  const stack: MindNode[] = []; // stack tracks current nesting path

  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    const h4 = line.match(/^#### (.+)/);
    const bullet = line.match(/^- \*\*(.+?)\*\*:?(.*)$/);
    const plainBullet = line.match(/^- (.+)$/);
    const subBullet = line.match(/^  - (.+)$/);

    if (h2) {
      const node: MindNode = { id: '', label: h2[1].trim(), level: 0, children: [] };
      if (!root) {
        root = node;
        stack.length = 0;
        stack.push(node);
      } else {
        // Additional ## becomes a top-level sibling under root
        root.children.push(node);
        node.parent = root;
        stack.length = 0;
        stack.push(node);
      }
    } else if (h3) {
      if (!root) {
        // No ## yet — create artificial root
        root = { id: '', label: 'Central Concept', level: 0, children: [] };
        stack.length = 0;
        stack.push(root);
      }
      const node: MindNode = { id: '', label: h3[1].trim(), level: 1, children: [], parent: root };
      root.children.push(node);
      // Reset stack to just root + this branch
      stack.length = 1;
      stack.push(node);
    } else if (h4 && stack.length > 0) {
      const parent = stack[stack.length - 1];
      if (!parent) continue;
      const node: MindNode = { id: '', label: h4[1].trim(), level: (parent.level || 0) + 1, children: [], parent };
      parent.children.push(node);
      stack.push(node);
    } else if (bullet) {
      const label = bullet[2]?.trim() ? `${bullet[1].trim()}: ${bullet[2].trim()}` : bullet[1].trim();
      const parent = stack.length > 0 ? stack[stack.length - 1] : root;
      if (!parent) continue;
      const node: MindNode = { id: '', label, level: parent.level + 1, children: [], parent };
      parent.children.push(node);
      stack.push(node);
    } else if (plainBullet) {
      const parent = stack.length > 0 ? stack[stack.length - 1] : root;
      if (!parent) continue;
      const node: MindNode = { id: '', label: plainBullet[1].trim(), level: parent.level + 1, children: [], parent };
      parent.children.push(node);
      stack.push(node);
    } else if (subBullet) {
      const parent = stack.length > 0 ? stack[stack.length - 1] : root;
      if (!parent) continue;
      const node: MindNode = { id: '', label: subBullet[1].trim(), level: parent.level + 1, children: [], parent };
      parent.children.push(node);
      stack.push(node);
    }
  }
  return root;
}

// ── Helpers ──

let nodeIdCounter = 0;
function assignIds(node: MindNode): void {
  node.id = `n${nodeIdCounter++}`;
  for (const child of node.children) assignIds(child);
}

function flattenTree(node: MindNode): MindNode[] {
  return [node, ...node.children.flatMap(flattenTree)];
}

// ── Dagre layout ──

function estimateNodeSize(label: string): { width: number; height: number } {
  // CJK chars are roughly 2x width of ASCII in monospace context
  const cjkCount = (label.match(/[一-鿿㐀-䶿豈-﫿　-〿＀-￯]/g) || []).length;
  const asciiCount = label.length - cjkCount;
  const effectiveLen = cjkCount * 2 + asciiCount;

  const charsPerLine = 16;
  const lines = Math.max(1, Math.ceil(effectiveLen / charsPerLine));
  const width = Math.min(Math.max(effectiveLen * 9 + 32, 100), 240);
  const height = Math.max(lines * 22 + 24, 44);
  return { width, height };
}

function applyDagreLayout(root: MindNode, direction: 'TB' | 'LR'): { initialNodes: Node[]; initialEdges: Edge[] } {
  nodeIdCounter = 0;
  assignIds(root);
  const allNodes = flattenTree(root);

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  // LR (left-to-right) for mind-map feel; generous spacing
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 120,
    marginx: 60,
    marginy: 60,
  });

  for (const node of allNodes) {
    const { width, height } = estimateNodeSize(node.label);
    g.setNode(node.id, { width, height });
  }

  for (const node of allNodes) {
    for (const child of node.children) {
      g.setEdge(node.id, child.id);
    }
  }

  dagre.layout(g);

  const flowNodes: Node[] = allNodes.map(node => {
    const pos = g.node(node.id);
    return {
      id: node.id,
      type: node.level === 0 ? 'rootNode' : 'childNode',
      position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 },
      data: {
        label: node.label,
        level: node.level,
        hasChildren: node.children.length > 0,
      },
      sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
      targetPosition: direction === 'TB' ? Position.Top : Position.Left,
    };
  });

  const flowEdges: Edge[] = [];
  for (const node of allNodes) {
    for (const child of node.children) {
      flowEdges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: 'smoothstep',
        animated: child.level <= 2,
        style: {
          stroke: child.level <= 1 ? 'rgba(167, 139, 250, 0.4)' : 'rgba(255,255,255,0.12)',
          strokeWidth: child.level <= 1 ? 2 : 1,
        },
      });
    }
  }

  return { initialNodes: flowNodes, initialEdges: flowEdges };
}

// ── Custom node components (sci-fi theme) ──

function RootNode({ data }: NodeProps) {
  return (
    <>
      <Handle type="source" position={Position.Right} id="source" style={{ background: 'transparent' }} />
      <div
        className="px-5 py-3 rounded-2xl text-center font-semibold shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.08))',
          border: '1px solid rgba(167,139,250,0.35)',
          color: '#c4b5fd',
          fontSize: '1rem',
          minWidth: 140,
          maxWidth: 240,
          boxShadow: '0 0 40px rgba(167,139,250,0.12)',
        }}
      >
        {data.label as string}
      </div>
    </>
  );
}

const LEVEL_COLORS: Record<number, { bg: string; border: string; text: string; glow: string }> = {
  1: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.85)', glow: 'rgba(167,139,250,0.06)' },
  2: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.7)', glow: 'rgba(167,139,250,0.03)' },
  3: { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.04)', text: 'rgba(255,255,255,0.55)', glow: 'transparent' },
  4: { bg: 'rgba(255,255,255,0.015)', border: 'rgba(255,255,255,0.03)', text: 'rgba(255,255,255,0.45)', glow: 'transparent' },
};

function ChildNode({ data }: NodeProps) {
  const level = (data.level as number) || 1;
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS[4];
  const fontSize = level === 1 ? '0.82rem' : level === 2 ? '0.75rem' : '0.7rem';
  const padding = level === 1 ? 'px-4 py-2.5' : level === 2 ? 'px-3 py-2' : 'px-2.5 py-1.5';

  return (
    <>
      <Handle type="target" position={Position.Left} id="target" style={{ background: 'transparent' }} />
      <Handle type="source" position={Position.Right} id="source" style={{ background: 'transparent' }} />
      <div
        className={`rounded-xl text-center leading-snug ${padding}`}
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize,
          minWidth: 80,
          maxWidth: 200,
          boxShadow: `0 0 20px ${colors.glow}`,
          wordBreak: 'break-word',
        }}
      >
        {data.label as string}
      </div>
    </>
  );
}

const nodeTypes = { rootNode: RootNode, childNode: ChildNode };

// ── Main component ──

export default function AIToolBrainstormCanvas({ content }: Props) {
  const root = useMemo(() => parseMarkdownToMindmap(content), [content]);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!root) return { initialNodes: [], initialEdges: [] };
    try {
      return applyDagreLayout(root, 'LR');
    } catch {
      return { initialNodes: [], initialEdges: [] };
    }
  }, [root]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Re-sync when content changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onInit = useCallback(() => {}, []);

  if (!root || initialNodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2">
        <Network className="h-8 w-8 text-white/10" />
        <p className="text-sm text-white/25">Generate content to see mind map</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full" style={{ minHeight: 400 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="rgba(255,255,255,0.03)"
          gap={32}
          size={1}
        />
        <Controls
          className="!bg-white/[0.04] !border-white/[0.06] !rounded-xl !overflow-hidden"
          style={{
            background: 'rgba(12,16,32,0.95)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const lvl = (n.data?.level as number) || 0;
            if (lvl === 0) return '#a78bfa';
            if (lvl === 1) return 'rgba(255,255,255,0.15)';
            return 'rgba(255,255,255,0.06)';
          }}
          maskColor="rgba(12, 16, 32, 0.85)"
          className="!bg-white/[0.03] !border-white/[0.06] !rounded-xl"
          style={{
            background: 'rgba(12,16,32,0.95)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}
        />
      </ReactFlow>
    </div>
  );
}
