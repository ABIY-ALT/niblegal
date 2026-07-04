'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { legalRequestSchema, type LegalRequestFormData, type LegalRequestFormInput } from '@/lib/validations/advisory';
import { AttachmentManager } from '@/components/advisory/AttachmentManager';
import type { LegalRequestCategoryOption } from '@/types/advisory';

interface DepartmentOption {
  id: string;
  name: string;
}
interface ContractOption {
  id: string;
  contractNumber: string;
  title: string;
}

export default function NewAdvisoryRequestPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['advisory-categories'],
    queryFn: async () => {
      const res = await fetch('/api/advisory/categories');
      return (await res.json()).data as LegalRequestCategoryOption[];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['advisory-departments'],
    queryFn: async () => {
      const res = await fetch('/api/advisory/departments');
      return (await res.json()).data as DepartmentOption[];
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ['contracts-lookup'],
    queryFn: async () => {
      const res = await fetch('/api/contracts?limit=100');
      const json = await res.json();
      return (json.data ?? []) as ContractOption[];
    },
  });

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
        await fetch(`/api/advisory/requests/${created.id}/attachments`, { method: 'POST', body: fd });
      }

      router.push(`/advisory/${created.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <div>
        <Link href="/advisory" className="btn btn-ghost btn-sm pl-0 mb-3">
          <ArrowLeft size={16} /> Back to Legal Advisory
        </Link>
        <h1 className="text-2xl font-bold mb-1">New Legal Advisory Request</h1>
        <p className="text-muted text-sm">Submit a request for legal opinion, review, or advisory support.</p>
      </div>

      {serverError && <div className="login-alert login-alert-error">{serverError}</div>}

      <div className="card">
        <form onSubmit={handleSubmit((d) => submitRequest(d, false))} className="flex flex-col gap-5">
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input
              {...register('subject')}
              className={`form-control ${errors.subject ? 'border-[var(--danger)]' : ''}`}
              placeholder="Brief subject of the request"
            />
            {errors.subject && <span className="text-danger text-sm mt-1">{errors.subject.message}</span>}
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select {...register('categoryId')} className="form-control">
                <option value="">Select category...</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <span className="text-danger text-sm mt-1">{errors.categoryId.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Requesting Department *</label>
              <select {...register('requestingDepartmentId')} className="form-control">
                <option value="">Select department...</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.requestingDepartmentId && (
                <span className="text-danger text-sm mt-1">{errors.requestingDepartmentId.message}</span>
              )}
            </div>
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Request Type</label>
              <select {...register('requestType')} className="form-control">
                <option value="LEGAL_OPINION">Legal Opinion</option>
                <option value="CONTRACT_REVIEW_REQUEST">Contract Review</option>
                <option value="COMPLIANCE_ADVICE">Compliance Advice</option>
                <option value="DISPUTE_ADVICE">Dispute Advice</option>
                <option value="GENERAL_INQUIRY">General Inquiry</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select {...register('priority')} className="form-control">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              {...register('description')}
              className={`form-control ${errors.description ? 'border-[var(--danger)]' : ''}`}
              rows={5}
              placeholder="Describe the matter in detail..."
            />
            {errors.description && <span className="text-danger text-sm mt-1">{errors.description.message}</span>}
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Related Contract (Optional)</label>
              <select {...register('relatedContractId')} className="form-control">
                <option value="">None</option>
                {contracts?.map((c) => (
                  <option key={c.id} value={c.id}>{c.contractNumber} — {c.title}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" {...register('dueDate')} className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confidentiality Level</label>
            <select {...register('confidentiality')} className="form-control">
              <option value="PUBLIC_INTERNAL">Public / Internal</option>
              <option value="RESTRICTED">Restricted</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="HIGHLY_CONFIDENTIAL">Highly Confidential</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Supporting Documents</label>
            <AttachmentManager mode="local" files={files} onFilesChange={setFiles} />
          </div>

          <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-border">
            <Link href="/advisory" className="btn btn-ghost">Cancel</Link>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={submitting}
              onClick={handleSubmit((d) => submitRequest(d, false))}
            >
              <Save size={16} /> Save Draft
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting}
              onClick={handleSubmit((d) => submitRequest(d, true))}
            >
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
