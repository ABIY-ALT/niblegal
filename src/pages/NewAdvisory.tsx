import { useState } from 'react';
import { addAdvisoryRequest, generateAdvisoryId, generateAuditEntry } from '../data/store';
import { ADVISORY_CATEGORY_LABELS } from '../utils/formatters';
import { ArrowLeft, Save } from 'lucide-react';
import type { User, AdvisoryRequest, AdvisoryCategory } from '../types';
import { addHours } from 'date-fns';

interface Props { onBack: () => void; onSaved: () => void; currentUser: User; }

const SLA_HOURS: Record<string, number> = { low: 120, medium: 72, high: 48, critical: 24 };

export default function NewAdvisory({ onBack, onSaved, currentUser }: Props) {
  const [form, setForm] = useState({
    title: '', category: 'general_advisory' as AdvisoryCategory,
    requestingDepartment: '', description: '',
    urgency: 'medium', tags: '',
  });
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = generateAdvisoryId();
    const now = new Date().toISOString();
    const slaHours = SLA_HOURS[form.urgency] ?? 72;
    const req: AdvisoryRequest = {
      id, title: form.title, category: form.category,
      status: 'submitted', urgency: form.urgency as any,
      requestingDepartment: form.requestingDepartment,
      requestedBy: currentUser.name,
      description: form.description,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      slaHours, slaDeadline: addHours(new Date(), slaHours).toISOString(),
      createdAt: now, updatedAt: now,
      attachments: [], comments: [],
      auditTrail: [generateAuditEntry(currentUser.id, currentUser.name, 'submitted', 'Advisory request submitted via LAHD', 'LAHD')],
    };
    addAdvisoryRequest(req);
    setSaved(true);
    setTimeout(onSaved, 1200);
  };

  if (saved) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontSize: 20, marginBottom: 8 }}>Advisory Request Submitted!</h3>
      <p style={{ color: 'var(--text-muted)' }}>Redirecting...</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Submit Legal Advisory Request</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Request Details</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Request Title *</label>
                  <input className="form-control" required placeholder="e.g. Legal Opinion on NBE Directive..." value={form.title} onChange={e => set('title', e.target.value)} />
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
                      {(Object.keys(ADVISORY_CATEGORY_LABELS) as AdvisoryCategory[]).map(c => (
                        <option key={c} value={c}>{ADVISORY_CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Urgency *</label>
                    <select className="form-control" value={form.urgency} onChange={e => set('urgency', e.target.value)}>
                      <option value="low">Low (SLA: 120h)</option>
                      <option value="medium">Medium (SLA: 72h)</option>
                      <option value="high">High (SLA: 48h)</option>
                      <option value="critical">Critical (SLA: 24h)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Requesting Department *</label>
                  <input className="form-control" required placeholder="e.g. Finance, Compliance, IT..." value={form.requestingDepartment} onChange={e => set('requestingDepartment', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Detailed Description *</label>
                  <textarea className="form-control" required style={{ minHeight: 140 }} placeholder="Describe the legal issue, context, and what advisory output you need..." value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="form-control" placeholder="e.g. NBE, compliance, forex" value={form.tags} onChange={e => set('tags', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Submitted By</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{currentUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentUser.department} · {currentUser.email}</div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">SLA Preview</span></div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Based on urgency <strong style={{ color: 'var(--text-primary)' }}>{form.urgency}</strong>, the SLA deadline will be set to <strong style={{ color: 'var(--accent-hover)' }}>{SLA_HOURS[form.urgency]} hours</strong> from submission.
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
              <Save size={15} /> Submit Advisory Request
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
