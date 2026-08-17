'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Send, FileText, Building2, Paperclip,
  AlertCircle, Info, ShieldCheck, Link2, Lock,
} from 'lucide-react';
import { legalRequestSchema, type LegalRequestFormData, type LegalRequestFormInput } from '@/lib/validations/advisory';
import { AttachmentManager } from '@/components/advisory/AttachmentManager';
import type { LegalRequestCategoryOption } from '@/types/advisory';
import { useSystemLookups } from '@/hooks/useSystemLookups';

interface DepartmentOption { id: string; name: string }
interface ContractOption { id: string; contractNumber: string; title: string }

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'CRITICAL', label: 'Critical' },
];

const CONFIDENTIALITY = [
  { value: 'PUBLIC_INTERNAL', label: 'Public / Internal' },
  { value: 'RESTRICTED', label: 'Restricted' },
  { value: 'CONFIDENTIAL', label: 'Confidential' },
  { value: 'HIGHLY_CONFIDENTIAL', label: 'Highly Confidential' },
];

const prettyEnum = (v: string) =>
  v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

export default function NewAdvisoryRequestPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['advisory-categories'],
    queryFn: async () => (await (await fetch('/api/advisory/categories')).json()).data as LegalRequestCategoryOption[],
  });

  const { data: departments } = useQuery({
    queryKey: ['advisory-departments'],
    queryFn: async () => (await (await fetch('/api/advisory/departments')).json()).data as DepartmentOption[],
  });

  const { data: contracts } = useQuery({
    queryKey: ['contracts-lookup'],
    queryFn: async () => {
      const json = await (await fetch('/api/contracts?limit=100')).json();
      return (json.data ?? []) as ContractOption[];
    },
  });

  const { lookups } = useSystemLookups();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LegalRequestFormInput, unknown, LegalRequestFormData>({
    resolver: zodResolver(legalRequestSchema),
    defaultValues: {
      requestType: 'LEGAL_OPINION',
      priority: 'MEDIUM',
      confidentiality: 'PUBLIC_INTERNAL',
      tags: [],
    },
  });

  const submitRequest = async (data: LegalRequestFormData, submit: boolean) => {
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/advisory/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, submit }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to save request');
      }
      const { data: created } = await res.json();

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        const up = await fetch(`/api/advisory/requests/${created.id}/attachments`, { method: 'POST', body: fd });
        /* The request itself is already saved, so a failed upload must not look
           like a failed submission — surface it and still go to the detail page. */
        if (!up.ok) {
          setServerError('Request saved, but the attachments failed to upload. Add them from the request page.');
          setTimeout(() => router.push(`/advisory/${created.id}`), 2500);
          return;
        }
      }

      router.push(`/advisory/${created.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
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
              <span className="enterprise-id">NEW REQUEST</span>
              <span className="badge status-draft">Draft</span>
            </div>
            <h1 className="enterprise-title">New Legal Advisory Request</h1>
            <p className="enterprise-subtitle">
              Request a legal opinion, contract review or advisory support. Save as a
              draft to finish later, or submit to start the SLA clock.
            </p>
          </div>
          <Link href="/advisory" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> Back to Legal Advisory
          </Link>
        </div>
      </div>

      {serverError && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit((d) => submitRequest(d, true))}
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >

        {/* ── Request details ────────────────────────────────────────────── */}
        <section className="enterprise-panel cm-form-section">
          <div className="enterprise-panel-header">
            <div className="enterprise-panel-title"><FileText /> Request Details</div>
          </div>
          <div className="enterprise-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div className="form-group">
              <label className="form-label" htmlFor="subject">
                Subject<span className="cm-required">*</span>
              </label>
              <input
                id="subject"
                {...register('subject')}
                className="form-control"
                style={errors.subject ? { borderColor: 'var(--danger)' } : undefined}
                placeholder="Brief subject of the request"
                aria-invalid={!!errors.subject}
              />
              {fieldError(errors.subject?.message) ??
                <span className="cm-form-hint">A one-line summary the legal team will see in their queue.</span>}
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label" htmlFor="categoryId">
                  Category<span className="cm-required">*</span>
                </label>
                <select id="categoryId" {...register('categoryId')} className="form-control">
                  <option value="">Select category…</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {fieldError(errors.categoryId?.message)}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="requestingDepartmentId">
                  Requesting Department<span className="cm-required">*</span>
                </label>
                <select id="requestingDepartmentId" {...register('requestingDepartmentId')} className="form-control">
                  <option value="">Select department…</option>
                  {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {fieldError(errors.requestingDepartmentId?.message)}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Description<span className="cm-required">*</span>
              </label>
              <textarea
                id="description"
                {...register('description')}
                className="form-control"
                style={errors.description ? { borderColor: 'var(--danger)' } : undefined}
                rows={6}
                placeholder="Describe the matter, the question you need answered, and any background the legal team should know…"
                aria-invalid={!!errors.description}
              />
              {fieldError(errors.description?.message) ??
                <span className="cm-form-hint">The more context you give, the faster the opinion can be drafted.</span>}
            </div>
          </div>
        </section>

        {/* ── Handling ───────────────────────────────────────────────────── */}
        <section className="enterprise-panel cm-form-section">
          <div className="enterprise-panel-header">
            <div className="enterprise-panel-title"><Building2 /> Handling &amp; Priority</div>
          </div>
          <div className="enterprise-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-row cols-3">
              <div className="form-group">
                <label className="form-label" htmlFor="requestType">Request Type</label>
                <select id="requestType" {...register('requestType')} className="form-control">
                  {lookups.RequestType.map((r) => (
                    <option key={r} value={r}>{prettyEnum(r)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="priority">Priority</label>
                <select id="priority" {...register('priority')} className="form-control">
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <span className="cm-form-hint">Drives the SLA target for this request.</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dueDate">Due Date</label>
                <input id="dueDate" type="date" {...register('dueDate')} className="form-control" />
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label" htmlFor="relatedContractId">
                  <Link2 size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                  Related Contract
                </label>
                <select id="relatedContractId" {...register('relatedContractId')} className="form-control">
                  <option value="">None</option>
                  {contracts?.map((c) => (
                    <option key={c.id} value={c.id}>{c.contractNumber} — {c.title}</option>
                  ))}
                </select>
                <span className="cm-form-hint">Optional — links this opinion to a contract file.</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confidentiality">
                  <Lock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                  Confidentiality Level
                </label>
                <select id="confidentiality" {...register('confidentiality')} className="form-control">
                  {CONFIDENTIALITY.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ── Attachments ────────────────────────────────────────────────── */}
        <section className="enterprise-panel cm-form-section">
          <div className="enterprise-panel-header">
            <div className="enterprise-panel-title"><Paperclip /> Supporting Documents</div>
          </div>
          <div className="enterprise-panel-body">
            <AttachmentManager mode="local" files={files} onFilesChange={setFiles} />
          </div>
        </section>

        {/* ── Submit bar ─────────────────────────────────────────────────── */}
        <div className="enterprise-actionbar">
          <div className="enterprise-actionbar-left">
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Fields marked <span className="cm-required">*</span> are required. Submitting starts the SLA clock.
            </span>
          </div>
          <div className="enterprise-actionbar-actions">
            <Link href="/advisory" className="btn btn-ghost btn-sm">Cancel</Link>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={submitting}
              onClick={handleSubmit((d) => submitRequest(d, false))}
            >
              <Save size={14} /> Save Draft
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting
                ? <><span className="login-spinner" style={{ width: 14, height: 14 }} /> Submitting…</>
                : <><Send size={14} /> Submit Request</>}
            </button>
          </div>
        </div>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-muted)', justifyContent: 'center' }}>
        <ShieldCheck size={13} />
        All advisory requests are recorded in the audit trail.
      </div>
    </div>
  );
}
