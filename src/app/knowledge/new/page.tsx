'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Send, X } from 'lucide-react';
import {
  knowledgeDocumentSchema,
  type KnowledgeDocumentFormData,
  type KnowledgeDocumentFormInput,
} from '@/lib/validations/knowledge';
import { AttachmentManager } from '@/components/knowledge/AttachmentManager';
import { TagSelector } from '@/components/knowledge/TagSelector';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import type { KnowledgeCategoryOption } from '@/types/knowledge';

interface DepartmentOption {
  id: string;
  name: string;
}
interface ContractOption {
  id: string;
  contractNumber: string;
  title: string;
}
interface LegalRequestOption {
  id: string;
  requestNumber: string;
  subject: string;
}

function KeywordInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
  };
  return (
    <div>
      {value.length > 0 && (
        <div className="tags-list mb-2">
          {value.map((k) => (
            <span key={k} className="tag flex items-center gap-1">
              {k}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== k))}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="form-control"
        placeholder="Type a keyword and press Enter..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
      />
    </div>
  );
}

export default function UploadKnowledgeItemPage() {
  const router = useRouter();
  const [file, setFile] = useState<File[]>([]);
  const [coverImage, setCoverImage] = useState<File[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [selectedTopCategoryId, setSelectedTopCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: categoryTree } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/categories');
      const json = await res.json();
      return json.data as KnowledgeCategoryOption[];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['knowledge-departments'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/departments');
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

  const { data: legalRequests } = useQuery({
    queryKey: ['legal-requests-lookup'],
    queryFn: async () => {
      const res = await fetch('/api/advisory/requests?limit=100');
      const json = await res.json();
      return (json.data ?? []) as LegalRequestOption[];
    },
  });

  const subcategories = useMemo(
    () => categoryTree?.find((c) => c.id === selectedTopCategoryId)?.children ?? [],
    [categoryTree, selectedTopCategoryId],
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<KnowledgeDocumentFormInput, unknown, KnowledgeDocumentFormData>({
    resolver: zodResolver(knowledgeDocumentSchema),
    defaultValues: {
      confidentiality: 'PUBLIC_INTERNAL',
      keywords: [],
      tagNames: [],
    },
  });

  const submitDocument = async (data: KnowledgeDocumentFormData, submit: boolean) => {
    setSubmitting(true);
    setServerError('');
    try {
      const fd = new FormData();
      fd.append('title', data.title);
      fd.append('categoryId', data.categoryId);
      if (data.description) fd.append('description', data.description);
      fd.append('keywords', JSON.stringify(keywords));
      fd.append('tagNames', JSON.stringify(tagNames));
      fd.append('confidentiality', data.confidentiality);
      if (data.relatedContractId) fd.append('relatedContractId', data.relatedContractId);
      if (data.relatedLegalRequestId) fd.append('relatedLegalRequestId', data.relatedLegalRequestId);
      if (data.relatedDepartmentId) fd.append('relatedDepartmentId', data.relatedDepartmentId);
      if (data.effectiveDate) fd.append('effectiveDate', new Date(data.effectiveDate).toISOString());
      if (data.reviewDate) fd.append('reviewDate', new Date(data.reviewDate).toISOString());
      if (data.expiryDate) fd.append('expiryDate', new Date(data.expiryDate).toISOString());
      if (data.lawName) fd.append('lawName', data.lawName);
      if (data.articleNumber) fd.append('articleNumber', data.articleNumber);
      if (data.sectionNumber) fd.append('sectionNumber', data.sectionNumber);
      fd.append('submit', String(submit));
      if (file[0]) fd.append('file', file[0]);
      if (coverImage[0]) fd.append('coverImage', coverImage[0]);

      const res = await fetch('/api/knowledge/documents', { method: 'POST', body: fd });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to save document');
      }
      const { data: created } = await res.json();
      router.push(`/knowledge/${created.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant', 'requesting_organ']}>
      <div className="max-w-4xl mx-auto flex flex-col gap-5">
        <div>
          <Link href="/knowledge" className="btn btn-ghost btn-sm pl-0 mb-3">
            <ArrowLeft size={16} /> Back to Repository
          </Link>
          <h1 className="text-2xl font-bold mb-1">Upload Knowledge Item</h1>
          <p className="text-muted text-sm">Add a document, template, opinion, policy, or regulation to the repository.</p>
        </div>

        {serverError && <div className="login-alert login-alert-error">{serverError}</div>}

        <div className="card">
          <form onSubmit={handleSubmit((d) => submitDocument(d, false))} className="flex flex-col gap-5">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                {...register('title')}
                className={`form-control ${errors.title ? 'border-[var(--danger)]' : ''}`}
                placeholder="Document title"
              />
              {errors.title && <span className="text-danger text-sm mt-1">{errors.title.message}</span>}
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  {...register('categoryId')}
                  className="form-control"
                  onChange={(e) => setSelectedTopCategoryId(e.target.value)}
                >
                  <option value="">Select category...</option>
                  {categoryTree?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <span className="text-danger text-sm mt-1">{errors.categoryId.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Subcategory</label>
                <select
                  className="form-control"
                  disabled={subcategories.length === 0}
                  onChange={(e) => {
                    if (e.target.value) setValue('categoryId', e.target.value);
                  }}
                >
                  <option value="">{subcategories.length === 0 ? 'No subcategories' : 'Select subcategory...'}</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea {...register('description')} className="form-control" rows={4} placeholder="Describe the document..." />
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Keywords</label>
                <KeywordInput value={keywords} onChange={setKeywords} />
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <TagSelector value={tagNames} onChange={setTagNames} />
              </div>
            </div>

            <div className="form-row cols-2">
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
                <label className="form-label">Related Department</label>
                <select {...register('relatedDepartmentId')} className="form-control">
                  <option value="">None</option>
                  {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Related Contract (Optional)</label>
                <select {...register('relatedContractId')} className="form-control">
                  <option value="">None</option>
                  {contracts?.map((c) => <option key={c.id} value={c.id}>{c.contractNumber} — {c.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Related Legal Request (Optional)</label>
                <select {...register('relatedLegalRequestId')} className="form-control">
                  <option value="">None</option>
                  {legalRequests?.map((r) => <option key={r.id} value={r.id}>{r.requestNumber} — {r.subject}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row cols-3">
              <div className="form-group">
                <label className="form-label">Effective Date</label>
                <input type="date" {...register('effectiveDate')} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Review Date</label>
                <input type="date" {...register('reviewDate')} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input type="date" {...register('expiryDate')} className="form-control" />
              </div>
            </div>

            <div className="form-row cols-3">
              <div className="form-group">
                <label className="form-label">Law Name</label>
                <input {...register('lawName')} className="form-control" placeholder="e.g. Commercial Code" />
              </div>
              <div className="form-group">
                <label className="form-label">Article Number</label>
                <input {...register('articleNumber')} className="form-control" placeholder="e.g. Art. 42" />
              </div>
              <div className="form-group">
                <label className="form-label">Section Number</label>
                <input {...register('sectionNumber')} className="form-control" placeholder="e.g. Sec. 3" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Upload File</label>
              <AttachmentManager mode="local" files={file} onFilesChange={(f) => setFile(f.slice(-1))} />
            </div>

            <div className="form-group">
              <label className="form-label">Cover Image (Optional)</label>
              <AttachmentManager mode="local" files={coverImage} onFilesChange={(f) => setCoverImage(f.slice(-1))} />
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-border">
              <Link href="/knowledge" className="btn btn-ghost">Cancel</Link>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={handleSubmit((d) => submitDocument(d, false))}
              >
                <Save size={16} /> Save Draft
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={handleSubmit((d) => submitDocument(d, true))}
              >
                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}
