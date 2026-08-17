'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Paperclip, X, FileText, Info, Building2,
  Calendar, Coins, AlertCircle, ShieldCheck, UploadCloud,
} from 'lucide-react';
import { contractSchema, type ContractFormData } from '@/lib/validations/contract';
import { useSystemLookups } from '@/hooks/useSystemLookups';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { categoryLabel } from '@/lib/contractStatus';

type Department = { id: string; name: string };

/** Mirrors MAX_UPLOAD_SIZE_BYTES in src/lib/upload.ts. */
const MAX_UPLOAD_MB = 20;

const fmtSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export default function NewContractPage() {
  const router = useRouter();
  const { data: me } = useCurrentUser();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'error' | 'info'; msg: string } | null>(null);

  /* The version-upload endpoint rejects requesting_organ (403), so for that role
     the attachment picker is hidden rather than silently dropping their files. */
  const canUpload = !!me && me.role !== 'requesting_organ';

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await (await fetch('/api/advisory/departments')).json()).data,
  });

  const { lookups } = useSystemLookups();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema) as never,
    defaultValues: {
      category: 'SERVICE_AGREEMENT',
      currency: 'ETB',
      renewalAlertDays: 30,
      tags: [],
    },
  });

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const incoming = Array.from(files);
    const tooBig = incoming.filter((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024);
    if (tooBig.length) {
      setBanner({
        kind: 'error',
        msg: `${tooBig.map((f) => f.name).join(', ')} exceeds the ${MAX_UPLOAD_MB}MB limit and was not added.`,
      });
    }
    const accepted = incoming.filter((f) => f.size <= MAX_UPLOAD_MB * 1024 * 1024);
    if (accepted.length) setSelectedFiles((prev) => [...prev, ...accepted]);
  };

  const removeFile = (index: number) =>
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = async (data: ContractFormData) => {
    setBanner(null);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const created = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(created?.error ?? 'Failed to create the contract request.');
      }

      /* Attachments are stored as contract versions. The contract exists at this
         point, so an upload failure must not read as a failed submission —
         report which files need re-attaching on the detail page instead. */
      const failed: string[] = [];
      if (canUpload && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const form = new FormData();
          form.append('file', file);
          const up = await fetch(`/api/contracts/${created.id}/versions`, {
            method: 'POST',
            body: form,
          });
          if (!up.ok) failed.push(file.name);
        }
      }

      if (failed.length) {
        setBanner({
          kind: 'info',
          msg: `Contract created, but these files did not upload: ${failed.join(', ')}. You can attach them from the contract page.`,
        });
        setTimeout(() => router.push(`/contracts/${created.id}`), 2500);
        return;
      }

      router.push(`/contracts/${created.id}`);
    } catch (error) {
      setBanner({
        kind: 'error',
        msg: error instanceof Error ? error.message : 'Failed to submit the contract request.',
      });
    }
  };

  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant', 'requesting_organ']} permission="contract.create">
      <div className="enterprise-page" style={{ maxWidth: 1040 }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="enterprise-hero">
          <div className="enterprise-hero-content">
            <div style={{ minWidth: 0 }}>
              <div className="enterprise-kicker">
                <span className="enterprise-id">NEW REQUEST</span>
                <span className="badge status-draft">Draft</span>
              </div>
              <h1 className="enterprise-title">New Contract Request</h1>
              <p className="enterprise-subtitle">
                Submit a contract for legal review. The request is created as a draft and
                enters the review workflow once submitted.
              </p>
            </div>
            <Link href="/contracts" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> Back to Contracts
            </Link>
          </div>
        </div>

        {banner && (
          <div className={`alert ${banner.kind === 'error' ? 'alert-danger' : 'alert-warning'}`}>
            <AlertCircle size={16} />
            <span>{banner.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Contract details ─────────────────────────────────────────── */}
          <section className="enterprise-panel cm-form-section">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><FileText /> Contract Details</div>
            </div>
            <div className="enterprise-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  Contract Title<span className="cm-required">*</span>
                </label>
                <input
                  id="title"
                  {...register('title')}
                  className="form-control"
                  style={errors.title ? { borderColor: 'var(--danger)' } : undefined}
                  placeholder="e.g. IT Support Services Agreement"
                  aria-invalid={!!errors.title}
                />
                {errors.title
                  ? <span className="cm-form-hint" style={{ color: 'var(--danger)' }}>{errors.title.message}</span>
                  : <span className="cm-form-hint">A short, descriptive name used across the register.</span>}
              </div>

              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="requestingDepartmentId">Requesting Department</label>
                  <select id="requestingDepartmentId" {...register('requestingDepartmentId')} className="form-control">
                    <option value="">— Use my department —</option>
                    {(departments ?? []).map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="category">
                    Category<span className="cm-required">*</span>
                  </label>
                  <select id="category" {...register('category')} className="form-control">
                    {lookups.ContractCategory.map((c) => (
                      <option key={c} value={c}>{categoryLabel(c)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  {...register('description')}
                  className="form-control"
                  rows={4}
                  placeholder="Describe the purpose, scope and key obligations of this contract…"
                />
              </div>
            </div>
          </section>

          {/* ── Counterparty & value ─────────────────────────────────────── */}
          <section className="enterprise-panel cm-form-section">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><Building2 /> Counterparty &amp; Value</div>
            </div>
            <div className="enterprise-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="counterparty">
                    Vendor / Counterparty<span className="cm-required">*</span>
                  </label>
                  <input
                    id="counterparty"
                    {...register('counterparty')}
                    className="form-control"
                    style={errors.counterparty ? { borderColor: 'var(--danger)' } : undefined}
                    placeholder="Third party name"
                    aria-invalid={!!errors.counterparty}
                  />
                  {errors.counterparty && (
                    <span className="cm-form-hint" style={{ color: 'var(--danger)' }}>
                      {errors.counterparty.message}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="value">
                    <Coins size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                    Contract Value
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      id="value"
                      type="number"
                      step="0.01"
                      {...register('value')}
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
                  <span className="cm-form-hint">Leave blank if the value is not yet determined.</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Term ─────────────────────────────────────────────────────── */}
          <section className="enterprise-panel cm-form-section">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><Calendar /> Contract Term</div>
            </div>
            <div className="enterprise-panel-body">
              <div className="form-row cols-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="startDate">Start Date</label>
                  <input id="startDate" type="date" {...register('startDate')} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="expiryDate">Expiry Date</label>
                  <input id="expiryDate" type="date" {...register('expiryDate')} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="renewalAlertDays">Renewal Alert</label>
                  <input
                    id="renewalAlertDays"
                    type="number"
                    min={1}
                    {...register('renewalAlertDays')}
                    className="form-control"
                  />
                  <span className="cm-form-hint">Days before expiry to raise a renewal alert.</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Attachments ──────────────────────────────────────────────── */}
          {canUpload && (
            <section className="enterprise-panel cm-form-section">
              <div className="enterprise-panel-header">
                <div className="enterprise-panel-title"><Paperclip /> Supporting Documents</div>
              </div>
              <div className="enterprise-panel-body">
                <div
                  className={`upload-zone${dragging ? ' dragging' : ''}`}
                  style={{ position: 'relative', marginBottom: selectedFiles.length ? 16 : 0 }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                >
                  <input
                    type="file"
                    multiple
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    aria-label="Add supporting documents"
                  />
                  <div className="upload-content">
                    <div className="upload-illustration"><UploadCloud /></div>
                    <div style={{ minWidth: 0 }}>
                      <div className="upload-title">Drag files here, or click to browse</div>
                      <div className="upload-copy">
                        Attached documents are stored as the contract&apos;s first versions.
                        Maximum {MAX_UPLOAD_MB}MB per file.
                      </div>
                      <div className="upload-types">
                        {['PDF', 'DOCX', 'XLSX', 'PNG', 'JPG'].map((t) => (
                          <span key={t} className="upload-chip">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="attachment-grid">
                    {selectedFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="attachment-card">
                        <div className="attachment-preview"><FileText /></div>
                        <div style={{ minWidth: 0 }}>
                          <div className="attachment-name">{file.name}</div>
                          <div className="attachment-meta">{fmtSize(file.size)}</div>
                        </div>
                        <div className="attachment-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => removeFile(index)}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Submit bar ───────────────────────────────────────────────── */}
          <div className="enterprise-actionbar">
            <div className="enterprise-actionbar-left">
              <Info size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Fields marked <span className="cm-required">*</span> are required.
                {!canUpload && ' Documents can be attached by the legal team after submission.'}
              </span>
            </div>
            <div className="enterprise-actionbar-actions">
              <Link href="/contracts" className="btn btn-ghost btn-sm">Cancel</Link>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                {isSubmitting
                  ? <><span className="login-spinner" style={{ width: 14, height: 14 }} /> Submitting…</>
                  : <><Save size={14} /> Submit Request</>}
              </button>
            </div>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-muted)', justifyContent: 'center' }}>
          <ShieldCheck size={13} />
          All contract submissions are recorded in the audit trail.
        </div>
      </div>
    </RoleGuard>
  );
}
