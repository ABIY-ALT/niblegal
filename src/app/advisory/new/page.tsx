'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  addAdvisoryRequest, 
  generateAdvisoryId, 
  generateAuditEntry, 
  currentUser 
} from '@/data/store';
import { ADVISORY_CATEGORY_LABELS } from '@/utils/formatters';
import { ArrowLeft, Save, Paperclip, X, FileText } from 'lucide-react';
import type { AdvisoryRequest, AdvisoryCategory } from '@/types';
import { addHours } from 'date-fns';

export default function NewAdvisoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [form, setForm] = useState({
    title: '', 
    category: 'general_advisory' as AdvisoryCategory,
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    requestingDepartment: currentUser.department, 
    description: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await new Promise(r => setTimeout(r, 800));
    
    const id = generateAdvisoryId();
    const now = new Date().toISOString();
    
    // SLA hours based on urgency
    const slaMap = { low: 120, medium: 72, high: 48, critical: 24 };
    
    const request: AdvisoryRequest = {
      id, 
      title: form.title, 
      category: form.category,
      status: 'submitted', 
      requestingDepartment: form.requestingDepartment,
      requestedBy: currentUser.name,
      urgency: form.urgency,
      description: form.description,
      tags: [],
      slaHours: slaMap[form.urgency],
      slaDeadline: addHours(new Date(), slaMap[form.urgency]).toISOString(),
      createdAt: now, 
      updatedAt: now,
      attachments: selectedFiles.map(f => f.name),
      comments: [],
      auditTrail: [
        generateAuditEntry(
          currentUser.id, 
          currentUser.name, 
          'submitted', 
          'Legal advice request submitted via LAHD', 
          'LAHD'
        )
      ],
    };
    
    addAdvisoryRequest(request);
    router.push('/advisory');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/advisory" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back to Legal Requests
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>New Legal Advice Request</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
          Submit a new legal advice request. All required fields are marked with *.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input 
              required
              type="text" 
              className="form-control" 
              placeholder="Brief subject of the legal request..."
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select 
                required
                className="form-control" 
                value={form.category} 
                onChange={e => setForm(p => ({ ...p, category: e.target.value as any }))}
              >
                {(Object.keys(ADVISORY_CATEGORY_LABELS) as AdvisoryCategory[]).map(c => (
                  <option key={c} value={c}>{ADVISORY_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority *</label>
              <select 
                required
                className="form-control" 
                value={form.urgency} 
                onChange={e => setForm(p => ({ ...p, urgency: e.target.value as any }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Department *</label>
            <input 
              required
              className="form-control" 
              placeholder="e.g. Operations, IT, Finance..."
              value={form.requestingDepartment}
              onChange={e => setForm(p => ({ ...p, requestingDepartment: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea 
              required
              className="form-control" 
              rows={6}
              placeholder="Describe your legal query in detail..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attachments</label>
            {selectedFiles.length === 0 ? (
              <label 
                style={{ 
                  display: 'block', border: '2px dashed var(--border)', 
                  borderRadius: 'var(--radius)', padding: '32px 20px', 
                  textAlign: 'center', background: 'var(--bg-input)', cursor: 'pointer' 
                }} 
                className="hover-card"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  multiple
                  accept=".pdf,.docx,.xlsx,.xls" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                />
                <div style={{ 
                  width: 48, height: 48, borderRadius: '50%', 
                  background: 'var(--bg-surface)', border: '1px solid var(--border)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 12px' 
                }}>
                  <Paperclip size={20} color="var(--text-muted)" />
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 500 }}>
                  Drag and drop files here, or click to browse
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  Supported formats: PDF, DOCX, XLSX, XLS (Max 10MB per file)
                </p>
              </label>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 12, 
                      padding: 12, background: 'var(--bg-input)', 
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' 
                    }}
                  >
                    <FileText size={20} color="var(--accent)" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{file.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFile(index)} 
                      className="btn btn-ghost btn-sm" 
                      style={{ padding: '4px 8px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <label 
                  style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 6, 
                    color: 'var(--accent)', cursor: 'pointer', fontSize: 13, 
                    fontWeight: 500, marginTop: 4
                  }}
                >
                  <input 
                    type="file" 
                    multiple
                    accept=".pdf,.docx,.xlsx,.xls" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange} 
                  />
                  + Add More Files
                </label>
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', justifyContent: 'flex-end', gap: 12, 
            marginTop: 10, paddingTop: 20, borderTop: '1px solid var(--border-light)' 
          }}>
            <Link href="/advisory" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : <><Save size={16} /> Submit Request</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
