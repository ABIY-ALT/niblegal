'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, 
  BackgroundVariant, MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, Play, Settings, Plus, Layout, GitMerge, FileText, CheckCircle, Zap } from 'lucide-react';

const initialNodes = [
  { id: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' }, type: 'input' },
  { id: 'task-1', position: { x: 250, y: 150 }, data: { label: 'Initial Review' } },
  { id: 'approval-1', position: { x: 250, y: 250 }, data: { label: 'Manager Approval' } },
  { id: 'end', position: { x: 250, y: 350 }, data: { label: 'End' }, type: 'output' },
];

const initialEdges = [
  { id: 'e1-2', source: 'start', target: 'task-1', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-3', source: 'task-1', target: 'approval-1', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3-4', source: 'approval-1', target: 'end', markerEnd: { type: MarkerType.ArrowClosed }, label: 'Approved' },
];

export default function WorkflowDesigner() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const router = useRouter();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const res = await fetch(`/api/workflows/${id}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      return res.json();
    }
  });

  useEffect(() => {
    if (data?.workflow) {
      const currentVersion = data.workflow.versions?.[0];
      if (currentVersion?.flowData?.nodes?.length > 0) {
        setNodes(currentVersion.flowData.nodes);
        setEdges(currentVersion.flowData.edges);
      } else {
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    }
  }, [data, setNodes, setEdges]);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

  const saveMutation = useMutation({
    mutationFn: async (flowData: any) => {
      const versionId = data?.workflow?.versions?.[0]?.id;
      if (!versionId) throw new Error('No version found to save to');
      await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'update_flow', versionId, flowData })
      });
    },
    onSuccess: () => {
      alert('Workflow saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    }
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const versionId = data?.workflow?.versions?.[0]?.id;
      if (!versionId) throw new Error('No version found');
      await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'publish', versionId })
      });
    },
    onSuccess: () => {
      alert('Workflow published successfully!');
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ nodes, edges });
  };

  if (isLoading) return <div className="text-center p-20 text-muted">Loading Designer...</div>;
  if (!data?.workflow) return <div className="text-center p-20 text-danger">Workflow not found</div>;

  const workflow = data.workflow;
  const currentVersion = workflow.versions?.[0];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] -mx-7 -mb-7 bg-bg-base overflow-hidden">
      {/* ── Topbar ────────────────────────────────────────────── */}
      <div className="h-14 bg-bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/workflows" className="btn btn-ghost btn-sm p-1.5"><ArrowLeft size={18}/></Link>
          <div className="h-6 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold m-0 text-primary">{workflow.name}</h1>
            <span className={`badge ${workflow.status === 'PUBLISHED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'} text-[10px]`}>
              {workflow.status} (v{currentVersion?.versionNumber}.0)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            <Settings size={14} /> {isSidebarOpen ? 'Close Properties' : 'Properties'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save size={14} /> Save Draft
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending || workflow.status === 'PUBLISHED'}>
            <Play size={14} /> Publish
          </button>
        </div>
      </div>

      {/* ── Main Area ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Toolbox Sidebar */}
        <div className="w-60 bg-bg-surface border-r border-border shrink-0 flex flex-col z-10">
          <div className="p-3 border-b border-border font-semibold text-xs text-muted uppercase tracking-wider">Toolbox</div>
          <div className="p-3 flex flex-col gap-2 overflow-y-auto">
            <div className="text-xs font-semibold text-muted mb-1 mt-2">Core Nodes</div>
            <div className="p-2 bg-card border border-border rounded text-sm cursor-grab flex items-center gap-2 hover:border-accent"><Play size={14} className="text-success"/> Start Node</div>
            <div className="p-2 bg-card border border-border rounded text-sm cursor-grab flex items-center gap-2 hover:border-accent"><FileText size={14} className="text-info"/> User Task</div>
            <div className="p-2 bg-card border border-border rounded text-sm cursor-grab flex items-center gap-2 hover:border-accent"><CheckCircle size={14} className="text-warning"/> Approval</div>
            <div className="p-2 bg-card border border-border rounded text-sm cursor-grab flex items-center gap-2 hover:border-accent"><Zap size={14} className="text-accent"/> Action Node</div>
            
            <div className="text-xs font-semibold text-muted mb-1 mt-4">Logic & Routing</div>
            <div className="p-2 bg-card border border-border rounded text-sm cursor-grab flex items-center gap-2 hover:border-accent"><GitMerge size={14} className="text-secondary"/> Condition</div>
            <div className="p-2 bg-card border border-border rounded text-sm cursor-grab flex items-center gap-2 hover:border-accent"><Layout size={14} className="text-secondary"/> Parallel</div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-bg-base relative h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-bg-base"
          >
            <Controls className="bg-bg-surface border border-border rounded-md shadow-sm fill-text-primary" />
            <MiniMap className="bg-bg-surface border border-border rounded-md shadow-sm" maskColor="rgba(0,0,0,0.2)" />
            <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="var(--border)" />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {isSidebarOpen && (
          <div className="w-80 bg-bg-surface border-l border-border shrink-0 flex flex-col z-10 animate-in slide-in-from-right-10">
            <div className="p-4 border-b border-border font-semibold text-sm flex justify-between items-center">
              Configuration
              <button onClick={() => setSidebarOpen(false)} className="text-muted hover:text-primary">&times;</button>
            </div>
            <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
              <div className="p-4 bg-info/10 text-info border border-info/20 rounded-md text-sm">
                Select a node on the canvas to configure its properties, SLA rules, and assignments.
              </div>
              
              <div className="form-group">
                <label className="form-label">Workflow Module</label>
                <input type="text" className="form-control bg-bg-base" disabled value={workflow.module} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} defaultValue={workflow.description || ''} />
              </div>

              <div className="border-t border-border mt-2 pt-4">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Global Rules</h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                    <input type="checkbox" className="rounded border-border text-accent focus:ring-accent" /> Enable SLA Tracking
                  </label>
                  <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                    <input type="checkbox" className="rounded border-border text-accent focus:ring-accent" defaultChecked /> Auto-assign on creation
                  </label>
                  <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                    <input type="checkbox" className="rounded border-border text-accent focus:ring-accent" defaultChecked /> Email Notifications
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
