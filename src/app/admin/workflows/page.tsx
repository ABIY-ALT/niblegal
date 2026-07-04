'use client';

import { 
  GitMerge, ArrowRight, Settings, Plus, Activity, Clock, ShieldCheck, 
  Workflow, FileText, Gavel, CheckCircle2, AlertTriangle, PlayCircle
} from 'lucide-react';

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-10">
      
      {/* ── Header ── */}
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-3 text-primary">
            <GitMerge size={24} className="text-accent" /> Workflow Configuration
          </h1>
          <p className="text-sm text-muted mt-1">Design, monitor, and optimize automated business processes.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><Activity size={16}/> View Executions</button>
          <button className="btn btn-primary"><Plus size={16}/> New Workflow</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="card card-sm border-l-4 border-l-success">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Active Workflows</div>
          <div className="text-2xl font-bold font-mono text-primary">2</div>
        </div>
        <div className="card card-sm border-l-4 border-l-accent">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Total Executions</div>
          <div className="text-2xl font-bold font-mono text-primary">14.2K</div>
        </div>
        <div className="card card-sm border-l-4 border-l-info">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Avg. Turnaround</div>
          <div className="text-2xl font-bold font-mono text-primary">38 hrs</div>
        </div>
        <div className="card card-sm border-l-4 border-l-warning">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Bottlenecks</div>
          <div className="text-2xl font-bold font-mono text-primary">1</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CMS Workflow */}
        <div className="card flex flex-col h-full border border-border shadow-sm">
          <div className="p-6 border-b border-border bg-bg-surface flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary">Contract Management (CMS)</h2>
                <div className="text-xs text-muted flex items-center gap-2 mt-1">
                  <span className="badge bg-success/10 text-success text-[10px]">Active v2.1</span>
                  <span>12,045 runs</span>
                </div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm border border-border hover:bg-bg-input"><Settings size={14} /> Configure</button>
          </div>
          
          <div className="p-6 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2"><Workflow size={12}/> Pipeline Stages</h3>
            <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
              {['Draft Entry', 'Legal Review', 'Manager Approval', 'Execution', 'Active/Archived'].map((step, i, arr) => (
                <div key={i} className="relative flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-full border-2 border-bg-card bg-bg-surface text-accent shadow-sm flex items-center justify-center shrink-0 z-10 group-hover:bg-accent group-hover:text-white transition-colors">
                    {i === arr.length - 1 ? <CheckCircle2 size={14}/> : <ArrowRight size={14}/>}
                  </div>
                  <div className="flex-1 p-3 rounded-lg border border-border bg-bg-surface shadow-sm group-hover:border-accent/30 transition-colors">
                    <span className="font-semibold text-sm">{step}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-border bg-bg-card grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5"><Clock size={12}/> SLA Triggers</h4>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs p-2 bg-bg-input rounded border border-border">
                  <span className="font-medium">Standard Review</span> <span className="font-mono text-accent">72h</span>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-bg-input rounded border border-border">
                  <span className="font-medium">Critical Review</span> <span className="font-mono text-danger">24h</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5"><PlayCircle size={12}/> Automations</h4>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs p-2 bg-bg-input rounded border border-border">
                  <span className="font-medium">Expiry Alert</span> <span className="font-mono text-warning">60d</span>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-bg-input rounded border border-border">
                  <span className="font-medium">Auto-Archive</span> <span className="badge bg-success/10 text-success text-[10px]">On</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LAHD Workflow */}
        <div className="card flex flex-col h-full border border-border shadow-sm">
          <div className="p-6 border-b border-border bg-bg-surface flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                <Gavel size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary">Legal Advisory (LAHD)</h2>
                <div className="text-xs text-muted flex items-center gap-2 mt-1">
                  <span className="badge bg-success/10 text-success text-[10px]">Active v1.4</span>
                  <span>2,192 runs</span>
                </div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm border border-border hover:bg-bg-input"><Settings size={14} /> Configure</button>
          </div>
          
          <div className="p-6 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2"><Workflow size={12}/> Pipeline Stages</h3>
            <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
              {['Request Intake', 'Officer Assignment', 'Drafting Opinion', 'Manager Approval', 'Dispatch'].map((step, i, arr) => (
                <div key={i} className="relative flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-full border-2 border-bg-card bg-bg-surface text-gold shadow-sm flex items-center justify-center shrink-0 z-10 group-hover:bg-gold group-hover:text-black transition-colors">
                    {i === arr.length - 1 ? <CheckCircle2 size={14}/> : <ArrowRight size={14}/>}
                  </div>
                  <div className="flex-1 p-3 rounded-lg border border-border bg-bg-surface shadow-sm group-hover:border-gold/30 transition-colors">
                    <span className="font-semibold text-sm">{step}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-border bg-bg-card grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5"><Clock size={12}/> SLA Triggers</h4>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs p-2 bg-bg-input rounded border border-border">
                  <span className="font-medium">Opinion Drafting</span> <span className="font-mono text-accent">48h</span>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-bg-input rounded border border-border">
                  <span className="font-medium">Urgent Intake</span> <span className="font-mono text-danger">4h</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5"><AlertTriangle size={12}/> Bottleneck Alerts</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center text-xs p-2 bg-warning/10 text-warning-hover rounded border border-warning/20">
                  Manager Approval stage is averaging 36h (12h over target).
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
