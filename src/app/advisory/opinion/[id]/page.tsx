'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Send,
  Clock,
  FileText,
  History,
  MessageSquare,
  Download,
  Upload,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X,
  CheckCircle,
  Plus,
  Book,
  Gavel,
  BookOpen,
  Paperclip,
} from 'lucide-react';

import {
  advisoryRequests,
  currentUser,
  addAdvisoryComment,
  updateAdvisoryRequest,
  advanceAdvisoryStatus,
  generateComment,
  generateAuditEntry,
} from '@/data/store';
import {
  ADVISORY_CATEGORY_LABELS,
  ADVISORY_STATUS_LABELS,
  ADVISORY_STATUS_COLORS,
  formatDate,
  formatDateTime,
  timeAgo,
} from '@/utils/formatters';
import type {
  AdvisoryRequest,
  AdvisoryCategory,
  Comment,
} from '@/types';

const LEGAL_TEMPLATES = [
  {
    id: 'contract-review',
    name: 'Contract Review Opinion',
    category: 'contract_review',
    description: 'Standard opinion for contract reviews',
    preview: '<h2>Legal Opinion – Contract Review</h2><p>Re: <strong>[Contract Name]</strong></p><p>To: <strong>[Requesting Department]</strong></p><p>From: Legal Department</p><p>Date: <strong>[Date]</strong></p>',
  },
  {
    id: 'regulatory-compliance',
    name: 'Regulatory Compliance Advisory',
    category: 'regulatory_compliance',
    description: 'Advisory for regulatory compliance matters',
    preview: '<h2>Legal Opinion – Regulatory Compliance</h2><p>Subject: <strong>[Regulation/Direction]</strong></p><p>Date: <strong>[Date]</strong></p>',
  },
  {
    id: 'employment-law',
    name: 'Employment Law Guidance',
    category: 'employment_law',
    description: 'Guidance on employment law matters',
    preview: '<h2>Legal Opinion – Employment Law</h2><p>Subject: <strong>[Employment Matter]</strong></p><p>Date: <strong>[Date]</strong></p>',
  },
  {
    id: 'banking-regulation',
    name: 'Banking Regulation Interpretation',
    category: 'banking_regulation',
    description: 'Interpretation of NBE directives and banking regulations',
    preview: '<h2>Legal Opinion – Banking Regulation</h2><p>Subject: <strong>[NBE Directive/Regulation]</strong></p><p>Date: <strong>[Date]</strong></p>',
  },
];

const LEGAL_REFERENCES = [
  { id: 'labour-proclamation', name: 'Labour Proclamation No. 1156/2019', source: 'Ethiopian Federal Government', year: '2019' },
  { id: 'banking-act', name: 'Banking Business Proclamation No. 592/2008', source: 'National Bank of Ethiopia', year: '2008' },
  { id: 'contract-law', name: 'Civil Code of Ethiopia – Law of Contracts', source: 'Ethiopian Civil Code', year: '1960' },
  { id: 'aml-directive', name: 'Anti-Money Laundering Directive', source: 'National Bank of Ethiopia', year: '2020' },
  { id: 'forex-directive', name: 'Foreign Exchange Directives', source: 'National Bank of Ethiopia', year: '2024' },
];

export default function LegalOpinionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const editorRef = useRef<HTMLDivElement>(null);

  const initialRequest = advisoryRequests.find((r) => r.id === requestId);

  if (!initialRequest) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <h2>Legal request not found</h2>
        <Link href="/advisory" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Legal Requests
        </Link>
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [selectedTab, setSelectedTab] = useState<'editor' | 'references' | 'attachments' | 'comments' | 'history'>('editor');

  const [formData, setFormData] = useState({
    title: initialRequest.title,
    category: initialRequest.category as AdvisoryCategory,
    legalOpinion: initialRequest.legalOpinion || '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [comments, setComments] = useState<Comment[]>(initialRequest.comments || []);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!autoSaveEnabled) return;
    const timer = setTimeout(() => {
      handleSaveDraft(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [formData.legalOpinion, formData.title, formData.category, autoSaveEnabled]);

  const handleApplyTemplate = (templateId: string) => {
    const template = LEGAL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData(prev => ({
        ...prev,
        legalOpinion: template.preview,
        category: template.category,
      }));
    }
  };

  const handleAddReference = (refId: string) => {
    setSelectedReferences(prev =>
      prev.includes(refId) ? prev.filter(id => id !== refId) : [...prev, refId]
    );
  };

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

  const handleSaveDraft = async (isAuto = false) => {
    setIsSaving(true);
    updateAdvisoryRequest(requestId, {
      title: formData.title,
      category: formData.category,
      legalOpinion: formData.legalOpinion,
    });
    await new Promise(r => setTimeout(r, 500));
    setLastSaved(new Date());
    if (!isAuto) {
      alert('Draft saved successfully!');
    }
    setIsSaving(false);
  };

  const handleSubmitForReview = async () => {
    setLoading(true);
    updateAdvisoryRequest(requestId, {
      title: formData.title,
      category: formData.category,
      legalOpinion: formData.legalOpinion,
    });
    advanceAdvisoryStatus(requestId, 'pending_approval', currentUser);
    await new Promise(r => setTimeout(r, 800));
    alert('Legal opinion submitted for review!');
    setLoading(false);
    router.push('/advisory');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = generateComment(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      newComment
    );
    addAdvisoryComment(requestId, comment);
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const formatCommand = (command: string) => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, null);
      editorRef.current?.focus();
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/advisory" className="btn btn-ghost btn-sm" style={{ paddingLeft: '0', marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back to Legal Requests
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
              Legal Opinion Editor
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span style={{ fontFamily: 'monospace' }}>{initialRequest.id}</span>
              <span className={`badge ${(ADVISORY_STATUS_COLORS as any)[initialRequest.status]}`}>
                {ADVISORY_STATUS_LABELS[initialRequest.status]}
              </span>
              {lastSaved && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                  <CheckCircle size={14} /> Saved {timeAgo(lastSaved.toISOString())}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Auto-save
            </label>
            <button
              className="btn btn-secondary"
              onClick={() => handleSaveDraft()}
              disabled={isSaving}
            >
              <Save size={16} style={{ marginRight: '6px' }} />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmitForReview}
              disabled={loading}
            >
              <Send size={16} style={{ marginRight: '6px' }} />
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
        <div style={{ flex: 1, minWidth: '0' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Request Title</div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>{initialRequest.title}</div>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Requesting Dept</div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>{initialRequest.requestingDepartment}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Requested By</div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>{initialRequest.requestedBy}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>SLA Deadline</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--danger)' }}>{formatDate(initialRequest.slaDeadline)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs" style={{ borderBottom: '1px solid var(--border-light)', marginBottom: '0' }}>
          <button
            className={`tab-btn ${selectedTab === 'editor' ? 'active' : ''}`}
            onClick={() => setSelectedTab('editor')}
          >
            <FileText size={16} style={{ marginRight: '6px' }} /> Editor
          </button>
          <button
            className={`tab-btn ${selectedTab === 'references' ? 'active' : ''}`}
            onClick={() => setSelectedTab('references')}
          >
            <BookOpen size={16} style={{ marginRight: '6px' }} /> Legal References
          </button>
          <button
            className={`tab-btn ${selectedTab === 'attachments' ? 'active' : ''}`}
            onClick={() => setSelectedTab('attachments')}
          >
            <Paperclip size={16} style={{ marginRight: '6px' }} /> Attachments
          </button>
          <button
            className={`tab-btn ${selectedTab === 'comments' ? 'active' : ''}`}
            onClick={() => setSelectedTab('comments')}
          >
            <MessageSquare size={16} style={{ marginRight: '6px' }} /> Comments
          </button>
          <button
            className={`tab-btn ${selectedTab === 'history' ? 'active' : ''}`}
            onClick={() => setSelectedTab('history')}
          >
            <History size={16} style={{ marginRight: '6px' }} /> Audit History
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {selectedTab === 'editor' && (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>
                      <Book size={16} style={{ marginRight: '8px', color: 'var(--accent)' }} />
                      Opinion Details
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-control"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as AdvisoryCategory }))}
                      >
                        {Object.entries(ADVISORY_CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>
                      <FileText size={16} style={{ marginRight: '8px', color: 'var(--accent)' }} />
                      Templates
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {LEGAL_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template.id)}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: selectedTemplate === template.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: selectedTemplate === template.id ? 'var(--accent)5' : 'var(--bg-input)',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{template.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', border: '1px solid var(--border)', borderBottom: 'none', borderRadius: 'var(--radius) var(--radius) 0 0', background: 'var(--bg-input)' }}>
                  <button onClick={() => formatCommand('bold')} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                    <Bold size={16} />
                  </button>
                  <button onClick={() => formatCommand('italic')} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                    <Italic size={16} />
                  </button>
                  <button onClick={() => formatCommand('underline')} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                    <Underline size={16} />
                  </button>
                  <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }} />
                  <button onClick={() => formatCommand('insertUnorderedList')} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                    <List size={16} />
                  </button>
                  <button onClick={() => formatCommand('insertOrderedList')} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                    <ListOrdered size={16} />
                  </button>
                  <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }} />
                  <button onClick={() => formatCommand('justifyLeft')} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                    <AlignLeft size={16} />
                  </button>
                  <button onClick={() => formatCommand('justifyCenter')} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                    <AlignCenter size={16} />
                  </button>
                  <button onClick={() => formatCommand('justifyRight')} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
                    <AlignRight size={16} />
                  </button>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  style={{
                    minHeight: '500px',
                    padding: '24px',
                    border: '1px solid var(--border)',
                    borderTop: 'none',
                    borderRadius: '0 0 var(--radius) var(--radius)',
                    background: 'white',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}
                  dangerouslySetInnerHTML={{ __html: formData.legalOpinion }}
                  onInput={(e) => setFormData(prev => ({ ...prev, legalOpinion: e.currentTarget.innerHTML }))}
                />
              </div>
            </div>
          )}

          {selectedTab === 'references' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
                  <Gavel size={16} style={{ marginRight: '8px', color: 'var(--accent)' }} />
                  Legal References
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Select references to include in your legal opinion
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {LEGAL_REFERENCES.map((ref) => (
                    <label
                      key={ref.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        border: selectedReferences.includes(ref.id) ? '2px solid var(--accent)' : '1px solid var(--border)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReferences.includes(ref.id)}
                        onChange={() => handleAddReference(ref.id)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{ref.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ref.source}, {ref.year}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary">
                  <Plus size={16} style={{ marginRight: '6px' }} /> Add Custom Reference
                </button>
                <button className="btn btn-primary">
                  <CheckCircle size={16} style={{ marginRight: '6px' }} /> Apply References
                </button>
              </div>
            </div>
          )}

          {selectedTab === 'attachments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Supporting Documents</label>
                {selectedFiles.length === 0 && initialRequest.attachments?.length === 0 ? (
                  <label
                    style={{
                      display: 'block',
                      border: '2px dashed var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '32px 20px',
                      textAlign: 'center',
                      background: 'var(--bg-input)',
                      cursor: 'pointer',
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
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}>
                      <Upload size={20} color="var(--text-muted)" />
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500' }}>Drag and drop files here, or click to browse</p>
                    <p style={{ margin: '0', fontSize: '12px', color: 'var(--text-muted)' }}>Supported formats: PDF, DOCX, XLSX, XLS (Max 10MB per file)</p>
                  </label>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {initialRequest.attachments?.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px', background: 'var(--bg-input)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <FileText size={20} color="var(--accent)" />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0', fontSize: '13px', fontWeight: '500' }}>{file}</p>
                        </div>
                        <button className="btn btn-ghost btn-sm">
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px', background: 'var(--bg-input)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <FileText size={20} color="var(--accent)" />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0', fontSize: '13px', fontWeight: '500' }}>{file.name}</p>
                          <p style={{ margin: '0', fontSize: '11px', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB (New)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="btn btn-ghost btn-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <label
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        color: 'var(--accent)', cursor: 'pointer', fontSize: '13px',
                        fontWeight: '500', marginTop: '8px'
                      }}
                    >
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <Plus size={14} /> Add More Files
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', flexShrink: '0'
                }}>
                  {currentUser.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div style={{ flex: '1' }}>
                  <textarea
                    className="form-control"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
              <div className="comment-list" style={{ paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-avatar">
                        {comment.userName.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div>
                        <div className="comment-author">{comment.userName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{comment.userRole}</div>
                      </div>
                      <div className="comment-time">{timeAgo(comment.createdAt)}</div>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                    <MessageSquare size={48} style={{ marginBottom: '12px', opacity: '0.3' }} />
                    <div>No comments yet</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'history' && (
            <div className="timeline">
              {initialRequest.auditTrail.map((entry) => (
                <div key={entry.id} className="timeline-item">
                  <div className="timeline-dot">
                    <History size={13} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-action">
                      {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)} — {entry.userName}
                    </div>
                    <div className="timeline-meta">{formatDateTime(entry.timestamp)}</div>
                    <div className="timeline-details">{entry.details}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
