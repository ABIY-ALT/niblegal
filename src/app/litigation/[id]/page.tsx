'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, Gavel, Calendar, History, Scale, Building2, Plus,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { caseCategoryLabel, caseStatusBadgeClass } from '@/lib/litigationStatus';

const STATUS_OPTIONS = ['ACTIVE', 'PENDING', 'ON_HOLD', 'SETTLED', 'WON', 'LOST', 'DISMISSED', 'CLOSED'];
const HEARING_TYPES = ['HEARING', 'VERDICT', 'FILING', 'MEDIATION', 'OTHER'];
const catLabel = caseCategoryLabel;
const statusBadge = caseStatusBadgeClass;
const fmtMoney = (v: string | number | null, cur: string | null) =>
  v == null ? '—' : `${Number(v).toLocaleString()} ${cur ?? 'ETB'}`;

interface CaseDetail {
  id: string; caseNumber: string; title: string; category: string; status: string; riskLevel: string;
  bankRole: string; opposingParty: string; court: string | null; description: string | null;
  exposureAmount: string | number | null; currency: string | null;
  filedDate: string | null; closedDate: string | null; outcome: string | null;
  assignedOfficer?: { id: string; firstName: string; lastName: string } | null;
  createdBy: { firstName: string; lastName: string };
  requestingDepartment?: { name: string } | null;
  hearings: { id: string; type: string; status: string; scheduledAt: string; location: string | null; notes: string | null }[];
  history: { id: string; action: string; description: string; createdAt: string; actor?: { firstName: string; lastName: string } | null }[];
}

function CaseDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? '';
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const isStaff = me?.role === 'manager' || me?.role === 'legal_officer' || me?.role === 'admin_assistant';

  const [tab, setTab] = useState<'overview' | 'hearings' | 'history'>('overview');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [outcomeDraft, setOutcomeDraft] = useState('');
  const [showHearingForm, setShowHearingForm] = useState(false);
  const [hearingType, setHearingType] = useState('HEARING');
  const [hearingAt, setHearingAt] = useState('');
  const [hearingLocation, setHearingLocation] = useState('');

  const { data: item, isLoading, error } = useQuery<CaseDetail>({
    queryKey: ['litigation-case', id],
    queryFn: async () => {
      const res = await fetch(`/api/litigation/${id}`);
      if (!res.ok) throw new Error('Failed to fetch case');
      return (await res.json()).data;
    },
    enabled: !!id,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['litigation-case', id] });

  const saveStatus = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/litigation/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDraft, outcome: outcomeDraft || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to update case');
      setBanner({ kind: 'ok', msg: 'Case updated.' });
      refresh();
    } catch (e) {
      setBanner({ kind: 'err', msg: e instanceof Error ? e.message : 'Update failed' });
    } finally {
      setBusy(false);
    }
  };

  const addHearing = async () => {
    if (!hearingAt) { setBanner({ kind: 'err', msg: 'Pick a date/time for the hearing.' }); return; }
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/litigation/${id}/hearings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: hearingType, scheduledAt: hearingAt, location: hearingLocation || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to schedule hearing');
      setBanner({ kind: 'ok', msg: 'Hearing scheduled.' });
      setShowHearingForm(false);
      setHearingAt(''); setHearingLocation('');
      refresh();
    } catch (e) {
      setBanner({ kind: 'err', msg: e instanceof Error ? e.message : 'Failed to schedule hearing' });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <div className="text-center py-20"><div className="spinner-sm border-accent mx-auto" /></div>;
  if (error || !item) return <div className="text-center py-20 text-danger font-semibold">Case not found</div>;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div>
        <Link href="/litigation/active" className="btn btn-ghost btn-sm pl-0 mb-3">
          <ArrowLeft size={16} /> Back to Cases
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold m-0">{item.title}</h1>
              <span className={`${statusBadge(item.status)} text-xs font-bold`}>{catLabel(item.status)}</span>
            </div>
            <p className="text-muted text-sm mt-1 font-mono">{item.caseNumber}</p>
          </div>
        </div>
      </div>

      {banner && <div className={`login-alert ${banner.kind === 'ok' ? 'login-alert-success' : 'login-alert-error'}`}>{banner.msg}</div>}

      <div className="flex gap-2 border-b border-border">
        {(['overview', 'hearings', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}>
            {t === 'overview' ? 'Overview' : t === 'hearings' ? 'Hearings' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card lg:col-span-2 flex flex-col gap-4">
            <h3 className="font-bold flex items-center gap-2"><Scale size={16} className="text-accent" /> Case Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Category</div><div className="font-medium">{catLabel(item.category)}</div></div>
              <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Risk Level</div><div className="font-medium">{catLabel(item.riskLevel)}</div></div>
              <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Bank's Role</div><div className="font-medium">{catLabel(item.bankRole)}</div></div>
              <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Opposing Party</div><div className="font-medium">{item.opposingParty}</div></div>
              <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Court</div><div className="font-medium">{item.court ?? '—'}</div></div>
              <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Exposure</div><div className="font-medium font-mono">{fmtMoney(item.exposureAmount, item.currency)}</div></div>
              <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Filed Date</div><div className="font-medium">{item.filedDate ? format(new Date(item.filedDate), 'MMM d, yyyy') : '—'}</div></div>
              <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Assigned Officer</div><div className="font-medium flex items-center gap-1.5"><Building2 size={12} className="text-muted" />{item.assignedOfficer ? `${item.assignedOfficer.firstName} ${item.assignedOfficer.lastName}` : 'Unassigned'}</div></div>
              {item.requestingDepartment && <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Department</div><div className="font-medium">{item.requestingDepartment.name}</div></div>}
              {item.closedDate && <div><div className="text-muted text-xs uppercase tracking-wider mb-1">Closed Date</div><div className="font-medium">{format(new Date(item.closedDate), 'MMM d, yyyy')}</div></div>}
            </div>
            {item.description && (
              <div>
                <div className="text-muted text-xs uppercase tracking-wider mb-1">Description</div>
                <p className="text-sm">{item.description}</p>
              </div>
            )}
            {item.outcome && (
              <div>
                <div className="text-muted text-xs uppercase tracking-wider mb-1">Outcome</div>
                <p className="text-sm">{item.outcome}</p>
              </div>
            )}
          </div>

          {isStaff && (
            <div className="card flex flex-col gap-4">
              <h3 className="font-bold flex items-center gap-2"><Gavel size={16} className="text-accent" /> Update Case</h3>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={statusDraft || item.status} onChange={(e) => setStatusDraft(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{catLabel(s)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Outcome (optional)</label>
                <textarea className="form-control" rows={3} value={outcomeDraft} onChange={(e) => setOutcomeDraft(e.target.value)} placeholder="Result / resolution notes..." />
              </div>
              <button className="btn btn-primary w-full justify-center" disabled={busy} onClick={saveStatus}>
                {busy ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'hearings' && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-bg-surface flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Calendar size={16} className="text-warning" /> Hearings</h3>
            {isStaff && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowHearingForm((v) => !v)}>
                <Plus size={14} /> Schedule Hearing
              </button>
            )}
          </div>
          {showHearingForm && (
            <div className="p-4 border-b border-border bg-bg-card grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={hearingType} onChange={(e) => setHearingType(e.target.value)}>
                  {HEARING_TYPES.map((t) => <option key={t} value={t}>{catLabel(t)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date &amp; Time</label>
                <input type="datetime-local" className="form-control" value={hearingAt} onChange={(e) => setHearingAt(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-control" value={hearingLocation} onChange={(e) => setHearingLocation(e.target.value)} placeholder={item.court ?? 'Courtroom / location'} />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button className="btn btn-primary btn-sm" disabled={busy} onClick={addHearing}>{busy ? 'Saving...' : 'Add Hearing'}</button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-input text-muted text-[11px] uppercase tracking-wider font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Scheduled</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {item.hearings.map((h) => (
                  <tr key={h.id}>
                    <td className="py-3 px-4">{catLabel(h.type)}</td>
                    <td className="py-3 px-4">{format(new Date(h.scheduledAt), 'MMM d, yyyy p')}</td>
                    <td className="py-3 px-4 text-secondary">{h.location ?? '—'}</td>
                    <td className="py-3 px-4"><span className="badge bg-info/10 text-info text-[10px] font-bold">{catLabel(h.status)}</span></td>
                  </tr>
                ))}
                {item.hearings.length === 0 && (
                  <tr><td colSpan={4} className="py-10 text-center text-muted">No hearings scheduled yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <h3 className="font-bold flex items-center gap-2 mb-4"><History size={16} className="text-accent" /> Activity History</h3>
          <div className="flex flex-col gap-3">
            {item.history.map((h) => (
              <div key={h.id} className="flex justify-between items-start text-sm border-b border-border pb-3 last:border-0">
                <div>
                  <div className="font-medium">{h.description}</div>
                  <div className="text-xs text-muted mt-0.5">{h.actor ? `${h.actor.firstName} ${h.actor.lastName}` : 'System'}</div>
                </div>
                <div className="text-xs text-muted font-mono whitespace-nowrap">{format(new Date(h.createdAt), 'MMM d, yyyy p')}</div>
              </div>
            ))}
            {item.history.length === 0 && <div className="text-center py-10 text-muted">No history yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LitigationCaseDetailPage() {
  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant', 'requesting_organ']}>
      <CaseDetailPage />
    </RoleGuard>
  );
}
