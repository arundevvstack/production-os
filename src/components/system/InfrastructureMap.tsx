'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TelemetryData } from '@/hooks/useThrottledTelemetry';

// Initial Nodes
const initialNodes = [
  { id: 'ingress', position: { x: 50, y: 150 }, data: { label: 'Webhooks Ingress' }, style: { background: '#1c1c1c', color: '#fff', border: '1px solid #333' } },
  { id: 'event-bus', position: { x: 250, y: 150 }, data: { label: 'Global Event Bus' }, style: { background: '#1c1c1c', color: '#fff', border: '1px solid #333' } },
  { id: 'queue', position: { x: 450, y: 150 }, data: { label: 'Worker Queue' }, style: { background: '#1c1c1c', color: '#fff', border: '1px solid #333' } },
  { id: 'openai', position: { x: 700, y: 50 }, data: { label: 'OpenAI (Primary)' }, style: { background: '#1c1c1c', color: '#fff', border: '1px solid #333' } },
  { id: 'anthropic', position: { x: 700, y: 250 }, data: { label: 'Anthropic (Failover)' }, style: { background: '#1c1c1c', color: '#fff', border: '1px solid #333' } },
];

// Base Edges
const baseEdges = [
  { id: 'e1-2', source: 'ingress', target: 'event-bus', animated: true, style: { stroke: '#4caf50' } },
  { id: 'e2-3', source: 'event-bus', target: 'queue', animated: true, style: { stroke: '#4caf50' } },
  { id: 'e3-4', source: 'queue', target: 'openai', animated: true, style: { stroke: '#00bcd4' } },
  { id: 'e3-5', source: 'queue', target: 'anthropic', animated: false, style: { stroke: '#333', strokeDasharray: '5 5' } },
];

export function InfrastructureMap({ telemetry }: { telemetry: TelemetryData }) {
  
  // Dynamically compute nodes based on telemetry state
  const nodes = useMemo(() => {
    return initialNodes.map((node) => {
      // If there is an incident, make OpenAI red and pulse Anthropic
      if (telemetry.incident_active) {
        if (node.id === 'openai') {
          return { ...node, style: { ...node.style, background: '#4a0f0f', border: '1px solid #ff4444' } };
        }
        if (node.id === 'anthropic') {
          return { ...node, style: { ...node.style, background: '#1c1c1c', border: '1px solid #00bcd4', boxShadow: '0 0 15px #00bcd4' } };
        }
      }
      return node;
    });
  }, [telemetry.incident_active]);

  // Dynamically compute edges based on telemetry state
  const edges = useMemo(() => {
    return baseEdges.map((edge) => {
      if (telemetry.incident_active) {
        // Stop routing to OpenAI, route to Anthropic
        if (edge.id === 'e3-4') {
            return { ...edge, animated: false, style: { stroke: '#ff4444', opacity: 0.5 } };
        }
        if (edge.id === 'e3-5') {
            return { ...edge, animated: true, style: { stroke: '#00bcd4', strokeWidth: 2 } };
        }
      }
      return edge;
    });
  }, [telemetry.incident_active]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={16} />
      </ReactFlow>
    </div>
  );
}
