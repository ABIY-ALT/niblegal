'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { LitigationRisk, LitigationRole } from '@prisma/client';
import {
  ArrowLeft, Save, Gavel, Scale, Coins, Users, Info,
  AlertCircle, ShieldCheck, Building2,
} from 'lucide-react';
import { useSystemLookups } from '@/hooks/useSystemLookups';
import { litigationCaseSchema, type LitigationCaseFormData } from '@/lib/validations/litigation';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { caseCategoryLabel, riskLabel } from '@/lib/litigationStatus';

type Department = { id: string; name: string };
type Officer = { id: string; firstName: string; lastName: string };

function NewCaseForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await (await fetch('/api/advisory/departments')).json()).data,
  });

  const { lookups } = useSystemLookups();

  const { data: officers } = useQuery<Officer[]>({
    queryKey: ['litigation-officers'],
    queryFn: async () => (await (await fetch('/api/advisory/officers')).json()).data,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LitigationCaseFormData>({
    resolver: zodResolver(litigationCaseSchema) as never,
    defaultValues: {
      category: 'OTHER',
      riskLevel: LitigationRisk.MEDIUM,
      bankRole: LitigationRole.DEFENDANT,
      currency: 'ETB',
      tags: [],
    },
  });

  const onSubmit = async (data: LitigationCaseFormData) => {
    setServerError('');
    try {
      const res = await fetch('/api/litigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to create case');
      router.push(`/litigation/${json.data.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to submit case file.');
    }
  };

  const fieldError = (msg?: string) =>
    msg ? <span className="cm-form-hint" style={{ color: 'var(--danger)' }}>{msg}</span> : null;

  return (
    <div className="enterprise-page" style={{ maxWidth: 1040 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <div className="enterprise-kicker">
              <span className="enterprise-id">NEW CASE</span>
              <span className="badge status-pending">Pending</span>
            </div>
            <h1 className="enterprise-title">New Case File</h1>
            <p className="enterprise-subtitle">
              Open a litigation case file. Hearings and case documents are added from
              the case page once it exists.
            </p>
          </div>
          <Link href="/litigation" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> Back to Litigation
          </Link>
        </div>
      </div>

      {serverError && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Case identity ──────────────────────────────────────────────── */}
        <section className="enterprise-panel cm-form-section">
          <div className="enterprise-panel-header">
            <div className="enterprise-panel-title"><Gavel /> Case Identity</div>
          </div>
          <div className="enterprise-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div className="form-group">
              <label className="form-label" htmlFor="title">
                Case Title<span className="cm-required">*</span>
              </label>
              <input
                id="title"
                {...register('title')}
                className="form-control"
                style={errors.title ? { borderColor: 'var(--danger)' } : undefined}
                placeholder="e.g. Nib Bank vs. Global Tech PLC"
                aria-invalid={!!errors.title}
              />
              {fieldError(errors.title?.message) ??
                <span className="cm-form-hint">Use the parties as they appear on the court filing.</span>}
            </div>

            <div className="form-row cols-3">
              <div className="form-group">
                <label className="form-label" htmlFor="category">
                  Category<span className="cm-required">*</span>
                </label>
                <select id="category" {...register('category')} className="form-control">
                  {lookups.LitigationCategory.map((c) => (
                    <option key={c} value={c}>{caseCategoryLabel(c)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="bankRole">Bank&apos;s Role</label>
                <select id="bankRole" {...register('bankRole')} className="form-control">
                  <option value="PLAINTIFF">Plaintiff</option>
                  <option value="DEFENDANT">Defendant</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="filedDate">Filed Date</label>
                <input id="filedDate" type="date" {...register('filedDate')} className="form-control" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea
                id="description"
                {...register('description')}
                className="form-control"
                rows={4}
                placeholder="Describe the nature and background of the case…"
              />
            </div>
          </div>
        </section>

        {/* ── Parties & court ────────────────────────────────────────────── */}
        <section className="enterprise-panel cm-form-section">
          <div className="enterprise-panel-header">
            <div className="enterprise-panel-title"><Scale /> Parties &amp; Court</div>
          </div>
          <div className="enterprise-panel-body">
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label" htmlFor="opposingParty">
                  Opposing Party<span className="cm-required">*</span>
                </label>
                <input
                  id="opposingParty"
                  {...register('opposingParty')}
                  className="form-control"
                  style={errors.opposingParty ? { borderColor: 'var(--danger)' } : undefined}
                  placeholder="Third party name"
                  aria-invalid={!!errors.opposingParty}
                />
                {fieldError(errors.opposingParty?.message)}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="court">
                  <Building2 size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                  Court
                </label>
                <input id="court" {...register('court')} className="form-control" placeholder="e.g. Federal High Court" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Risk & exposure ────────────────────────────────────────────── */}
        <section className="enterprise-panel cm-form-section">
          <div className="enterprise-panel-header">
            <div className="enterprise-panel-title"><Coins /> Risk &amp; Exposure</div>
          </div>
          <div className="enterprise-panel-body">
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label" htmlFor="riskLevel">Risk Level</label>
                <select id="riskLevel" {...register('riskLevel')} className="form-control">
                  {Object.keys(LitigationRisk).map((r) => (
                    <option key={r} value={r}>{riskLabel(r)}</option>
                  ))}
                </select>
                <span className="cm-form-hint">High and critical cases surface on the board risk panel.</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="exposureAmount">Exposure Amount</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="exposureAmount"
                    type="number"
                    step="0.01"
                    {...register('exposureAmount')}
                    className="form-control"
                    placeholder="0.00"
                    style={{ flex: 1 }}
                  />
                  <input
                    {...register('currency')}
                    className="form-control"
                    style={{ width: 90 }}
                    aria-label="Currency"
                  />
                </div>
                <span className="cm-form-hint">The bank&apos;s maximum financial exposure in this matter.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ownership ──────────────────────────────────────────────────── */}
        <section className="enterprise-panel cm-form-section">
          <div className="enterprise-panel-header">
            <div className="enterprise-panel-title"><Users /> Ownership</div>
          </div>
          <div className="enterprise-panel-body">
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label" htmlFor="requestingDepartmentId">Requesting Department</label>
                <select id="requestingDepartmentId" {...register('requestingDepartmentId')} className="form-control">
                  <option value="">— Use my department —</option>
                  {(departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="assignedOfficerId">Assigned Officer</label>
                <select id="assignedOfficerId" {...register('assignedOfficerId')} className="form-control">
                  <option value="">Unassigned</option>
                  {(officers ?? []).map((o) => (
                    <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
                  ))}
                </select>
                <span className="cm-form-hint">Can be assigned later from the case page.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Submit bar ─────────────────────────────────────────────────── */}
        <div className="enterprise-actionbar">
          <div className="enterprise-actionbar-left">
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Fields marked <span className="cm-required">*</span> are required.
            </span>
          </div>
          <div className="enterprise-actionbar-actions">
            <Link href="/litigation" className="btn btn-ghost btn-sm">Cancel</Link>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              {isSubmitting
                ? <><span className="login-spinner" style={{ width: 14, height: 14 }} /> Submitting…</>
                : <><Save size={14} /> Open Case File</>}
            </button>
          </div>
        </div>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-muted)', justifyContent: 'center' }}>
        <ShieldCheck size={13} />
        All case files are recorded in the audit trail.
      </div>
    </div>
  );
}

export default function NewCasePage() {
  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant']}>
      <NewCaseForm />
    </RoleGuard>
  );
}
