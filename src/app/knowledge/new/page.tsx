'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UploadCloud, Tag as TagIcon, X, FileText } from 'lucide-react';
import { KNOWLEDGE_TYPE_LABELS } from '@/utils/formatters';
import { generateKnowledgeId, addKnowledgeItem, currentUser } from '@/data/store';
import type { KnowledgeItemCategory } from '@/types';

const CATEGORIES: KnowledgeItemCategory[] = [
  'Contract Templates',
  'Legal Opinions',
  'Policies',
  'NBE Directives',
  'Research',
  'Articles'
];

export default function NewKnowledgeItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    type: 'template' as any,
    category: 'Contract Templates' as KnowledgeItemCategory,
    description: '',
    tags: [] as string[]
  });

  const handleAddTag = (e: React.KeyboardEvent | React.FocusEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'blur') {
      if ('key' in e) e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val && !form.tags.includes(val)) {
        setForm(p => ({ ...p, tags: [...p.tags, val] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setForm(p => ({ ...p, tags: p.tags.filter(tag => tag !== t) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    setLoading(true);
    
    // Simulate upload delay
    await new Promise(r => setTimeout(r, 800));

    const newItem = {
      id: generateKnowledgeId(),
      title: form.title,
      type: form.type,
      category: form.category,
      description: form.description,
      tags: form.tags.length ? form.tags : ['general'],
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
      fileName: selectedFile.name,
      fileSize: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
      downloads: 0
    };

    addKnowledgeItem(newItem);
    router.push('/knowledge');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/knowledge" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back to Repository
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Upload Knowledge Item</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>Add templates, articles, or legal updates to the central repository.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div className="form-group">
            <label className="form-label">Document Title</label>
            <input 
              required
              type="text" 
              className="form-control" 
              placeholder="e.g. Standard NDA Template 2026"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Item Type</label>
              <select className="form-control" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}>
                {Object.entries(KNOWLEDGE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v as string}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as KnowledgeItemCategory }))}>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Short Description</label>
            <textarea 
              required
              className="form-control" 
              rows={3}
              placeholder="Provide a brief summary of what this document is for..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              {form.tags.map(tag => (
                <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--accent)', color: '#fff', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500 }}>
                  <TagIcon size={12} /> {tag}
                  <X size={14} style={{ cursor: 'pointer', marginLeft: 2 }} onClick={() => removeTag(tag)} />
                </div>
              ))}
              <input 
                type="text" 
                style={{ flex: 1, minWidth: 120, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14 }}
                placeholder={form.tags.length === 0 ? "Type a tag and press Enter..." : "Add more tags..."}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                onBlur={handleAddTag}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">File Attachment</label>
            {!selectedFile ? (
              <label style={{ display: 'block', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '32px 20px', textAlign: 'center', background: 'var(--bg-input)', transition: 'border-color 0.2s', cursor: 'pointer' }} className="hover-card">
                <input type="file" accept=".pdf,.docx,.doc" style={{ display: 'none' }} onChange={handleFileChange} />
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <UploadCloud size={24} color="var(--accent)" />
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 500 }}>Click to upload document</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Required formats: PDF, DOCX (Max 25MB)</p>
              </label>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <FileText size={20} color="var(--accent)" />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{selectedFile.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
            <Link href="/knowledge" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Publish to Repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
