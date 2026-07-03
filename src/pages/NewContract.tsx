import { useState } from 'react';
import { addContract, generateContractId, generateAuditEntry } from '../data/store';
import { CONTRACT_CATEGORY_LABELS } from '../utils/formatters';
import { ArrowLeft, Save } from 'lucide-react';
import type { User, Contract, ContractCategory } from '../types';
import { addDays } from 'date-fns';

interface Props { onBack: () => void; onSaved: () => void; currentUser: User; }

export default function NewContract({ onBack, onSaved, currentUser }: Props) {
  const [form, setForm] = useState({
    title: '', category: 'service_agreement' as ContractCategory,
    counterparty: '', requestingDepartment: '', description: '',
    value: '', currency: 'ETB', startDate: '', expiryDate: '',
    tags: '', renewalAlertDays: '30',
  });
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = generateContractId();
    const now = new Date().toISOString();
    const contract: Contract = {
      id, title: form.title, category: form.category,
      status: 'draft', counterparty: form.counterparty,
      requestingDepartment: form.requestingDepartment,
      requestedBy: currentUser.name,
      description: form.description,
      value: form.value ? Number(form.value) : undefined,
      currency: form.currency,
      startDate: form.startDate || undefined,
      expiryDate: form.expiryDate || undefined,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      renewalAlertDays: Number(form.renewalAlertDays) || 30,
      slaDeadline: addDays(new Date(), 7).toISOString(),
      createdAt: now, updatedAt: now,
      versions: [{
        version: 1, uploadedBy: currentUser.name,
        uploadedAt: now, notes: 'Initial draft', fileSize: '—',
      }],
      comments: [],
      auditTrail: [generateAuditEntry(currentUser.id, currentUser.name, 'submitted', 'Contract request submitted via CMS', 'CMS')],
    };
    addContract(contract);
    setSaved(true);
    setTimeout(onSaved, 1200);
  };

  if (saved) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontSize: 20, marginBottom: 8 }}>Contract Registered!</h3>
      <p style={{ color: 'var(--text-muted)' }}>Redirecting to contracts list...</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Register New Contract Request</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Contract Details</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Contract Title *</label>
                  <input className="form-control" required placeholder="e.g. IT Support Services Agreement" value={form.title} onChange={e => set('title', e.target.value)} />
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
                      {(Object.keys(CONTRACT_CATEGORY_LABELS) as ContractCategory[]).map(c => (
                        <option key={c} value={c}>{CONTRACT_CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Counterparty / Vendor *</label>
                    <input className="form-control" required placeholder="Third party name" value={form.counterparty} onChange={e => set('counterparty', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Requesting Department *</label>
                  <input className="form-control" required placeholder="e.g. Operations, IT, Finance..." value={form.requestingDepartment} onChange={e => set('requestingDepartment', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Purpose *</label>
                  <textarea className="form-control" required placeholder="Describe the purpose and scope of this contract..." value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="form-control" placeholder="e.g. IT, maintenance, annual" value={form.tags} onChange={e => set('tags', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Financial & Dates</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Contract Value</label>
                    <input className="form-control" type="number" placeholder="0.00" value={form.value} onChange={e => set('value', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select className="form-control" value={form.currency} onChange={e => set('currency', e.target.value)}>
                      <option>ETB</option><option>USD</option><option>EUR</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-control" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input className="form-control" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Renewal Alert (days before expiry)</label>
                  <input className="form-control" type="number" value={form.renewalAlertDays} onChange={e => set('renewalAlertDays', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Submitted By</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{currentUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentUser.department} · {currentUser.email}</div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              <Save size={15} /> Submit Contract Request
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
