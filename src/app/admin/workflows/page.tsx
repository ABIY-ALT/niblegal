'use client';

import { GitMerge, ArrowRight, Settings } from 'lucide-react';

export default function WorkflowsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* CMS Workflow */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Contract Management (CMS) Workflow Engine</span>
          <button className="btn btn-secondary btn-sm"><Settings size={14} /> Configure</button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 20, overflowX: 'auto', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
          {['Draft Entry', 'Legal Review', 'Manager Approval', 'Execution', 'Active/Archived'].map((step, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: '12px 20px', background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 13, color: 'var(--accent)', boxShadow: 'var(--shadow-sm)' }}>
                {step}
              </div>
              {i < arr.length - 1 && <ArrowRight size={16} color="var(--text-muted)" />}
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h4 style={{ fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>SLA Configuration</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
              <span>Standard Contract Review</span> <strong>72 Hours</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
              <span>Critical/Urgent Review</span> <strong>24 Hours</strong>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Automations</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
              <span>Expiry Alert (Renewal)</span> <strong>60 days prior</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
              <span>Auto-Archive Expired</span> <strong>Enabled</strong>
            </div>
          </div>
        </div>
      </div>

      {/* LAHD Workflow */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Legal Advisory Help Desk (LAHD) Workflow Engine</span>
          <button className="btn btn-secondary btn-sm"><Settings size={14} /> Configure</button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 20, overflowX: 'auto', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
          {['Request Intake', 'Officer Assignment', 'Drafting Opinion', 'Manager Approval', 'Dispatch'].map((step, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: '12px 20px', background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 13, color: 'var(--gold)', boxShadow: 'var(--shadow-sm)' }}>
                {step}
              </div>
              {i < arr.length - 1 && <ArrowRight size={16} color="var(--text-muted)" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
