'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContractCategory } from '@prisma/client';
import { contractSchema, type ContractFormData } from '@/lib/validations/contract';
import { ArrowLeft, Save, Paperclip, X, FileText } from 'lucide-react';

export default function NewContractPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      category: ContractCategory.SERVICE_AGREEMENT,
      currency: 'ETB',
      renewalAlertDays: 30,
      tags: [],
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ContractFormData) => {
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create contract');
      
      const newContract = await res.json();
      // Handle file uploads separately if needed...
      
      router.push(`/contracts/${newContract.id}`);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit contract request.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <div>
        <Link href="/contracts" className="btn btn-ghost btn-sm pl-0 mb-3">
          <ArrowLeft size={16} /> Back to Contracts
        </Link>
        <h1 className="text-2xl font-bold mb-1">New Contract Request</h1>
        <p className="text-muted text-sm">Create a new contract request. All required fields are marked with *.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="form-group">
            <label className="form-label">Contract Title *</label>
            <input 
              {...register('title')}
              className={`form-control ${errors.title ? 'border-[var(--danger)]' : ''}`}
              placeholder="e.g. IT Support Services Agreement"
            />
            {errors.title && <span className="text-danger text-sm mt-1">{errors.title.message}</span>}
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Requesting Department *</label>
              <input 
                {...register('requestingDepartment')}
                className={`form-control ${errors.requestingDepartment ? 'border-[var(--danger)]' : ''}`}
                placeholder="e.g. IT Department"
              />
              {errors.requestingDepartment && <span className="text-danger text-sm mt-1">{errors.requestingDepartment.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select {...register('category')} className="form-control">
                {Object.keys(ContractCategory).map(c => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Vendor / Counterparty *</label>
              <input 
                {...register('counterparty')}
                className={`form-control ${errors.counterparty ? 'border-[var(--danger)]' : ''}`}
                placeholder="Third party name"
              />
              {errors.counterparty && <span className="text-danger text-sm mt-1">{errors.counterparty.message}</span>}
            </div>
            <div className="form-group flex gap-2">
              <div className="flex-1">
                <label className="form-label">Value</label>
                <input type="number" {...register('value')} className="form-control" placeholder="0.00" />
              </div>
              <div className="w-24">
                <label className="form-label">Currency</label>
                <input {...register('currency')} className="form-control" defaultValue="ETB" />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              {...register('description')}
              className="form-control" 
              rows={4}
              placeholder="Describe the purpose and scope of this contract..."
            />
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" {...register('startDate')} className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input type="date" {...register('expiryDate')} className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Attachments</label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-[var(--bg-input)] cursor-pointer hover-card relative">
              <input 
                type="file" 
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange} 
              />
              <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-border flex items-center justify-center mx-auto mb-3">
                <Paperclip size={20} className="text-muted" />
              </div>
              <p className="font-medium text-sm mb-2">Drag and drop files here, or click to browse</p>
              <p className="text-xs text-muted">Supported formats: PDF, DOCX (Max 10MB)</p>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-[var(--bg-input)] border border-border rounded-md">
                    <FileText size={20} className="text-accent" />
                    <div className="flex-1">
                      <p className="font-medium text-sm m-0">{file.name}</p>
                      <p className="text-xs text-muted m-0">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="btn btn-ghost btn-sm px-2">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-border">
            <Link href="/contracts" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : <><Save size={16} /> Submit Request</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
