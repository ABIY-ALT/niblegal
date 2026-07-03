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
  MoreHorizontal,
} from 'lucide-react';

import {
  contracts,
  currentUser,
  USERS,
  addContractComment,
  updateContract,
  advanceContractStatus,
  generateComment,
  generateAuditEntry,
} from '@/data/store';
import {
  CONTRACT_CATEGORY_LABELS,
  CONTRACT_STATUS_LABELS,
  formatDate,
  formatDateTime,
  timeAgo,
} from '@/utils/formatters';
import type {
  Contract,
  ContractCategory,
  ContractVersion,
  Comment,
} from '@/types';

const TEMPLATES = [
  {
    id: 'service-agreement',
    name: 'Service Agreement',
    category: 'service_agreement',
    description: 'Standard template for service agreements',
    preview: '<h2>Service Agreement</h2><p>This Agreement is made between <strong>[Party A]</strong> and <strong>[Party B]</strong>...</p>',
  },
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    category: 'nda',
    description: 'Bilateral NDA template',
    preview: '<h2>Non-Disclosure Agreement</h2><p>The parties agree to keep confidential information...</p>',
  },
  {
    id: 'lease',
    name: 'Lease Agreement',
    category: 'lease',
    description: 'Property/office lease template',
    preview: '<h2>Lease Agreement</h2><p>This Lease is made between <strong>[Landlord]</strong> and <strong>[Tenant]</strong>...</p>',
  },
];

export default function ContractDraftPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string | undefined;
  const editorRef = useRef<HTMLDivElement>(null);

  const isNewDraft = !draftId;
  const initialContract: Contract | undefined = isNewDraft
    ? undefined
    : contracts.find((c) => c.id === draftId);

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [selectedTab, setSelectedTab] = useState<'editor' | 'versions' | 'comments' | 'history'>('editor');

  const [formData, setFormData] = useState({
    title: initialContract?.title || '',
    category: (initialContract?.category || 'service_agreement') as ContractCategory,
    counterparty: initialContract?.counterparty || '',
    requestingDepartment: initialContract?.requestingDepartment || currentUser.department,
    description: initialContract?.description || '',
    startDate: initialContract?.startDate || '',
    expiryDate: initialContract?.expiryDate || '',
  });

  const [contractContent, setContractContent] = useState(
    initialContract?.description || ''
  );

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [versions, setVersions] = useState<ContractVersion[]>(
    initialContract?.versions || []
  );

  const [comments, setComments] = useState<Comment[]>(
    initialContract?.comments || []
  );

  const [newComment, setNewComment] = useState('');

  // Auto Save Logic
  useEffect(() => {
    if (!autoSaveEnabled) return;
    const timer = setTimeout(() => {
      handleSaveDraft(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [contractContent, formData, autoSaveEnabled]);

  const handleApplyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData(prev => ({
        ...prev,
        category: template.category,
      }));
      setContractContent(template.preview);
    }
  };

  const handleSaveDraft = async (isAuto = false) => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setLastSaved(new Date());
    if (!isAuto) {
      alert('Draft saved successfully!');
    }
    setIsSaving(false);
  };

  const handleSubmitForReview = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    alert('Contract submitted for review!');
    router.push('/contracts');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = generateComment(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      newComment
    );
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/contracts"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {formData.title || 'New Contract Draft'}
                </h1>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">
                    {draftId || 'Unsaved Draft'}
                  </span>
                  {lastSaved && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Saved {timeAgo(lastSaved.toISOString())}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                />
                Auto-save
              </label>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                onClick={() => handleSaveDraft()}
                disabled={isSaving}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-2"
                onClick={handleSubmitForReview}
                disabled={loading}
              >
                <Send className="w-4 h-4" />
                {loading ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8" aria-label="Tabs">
            {[
              { id: 'editor', label: 'Editor', icon: <FileText className="w-4 h-4" /> },
              { id: 'versions', label: 'Versions', icon: <History className="w-4 h-4" /> },
              { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {selectedTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Form Fields & Templates */}
            <div className="lg:col-span-1 space-y-6">
              {/* Form Fields */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Core Banking Software Maintenance Agreement"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    >
                      {Object.entries(CONTRACT_CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Counterparty</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      value={formData.counterparty}
                      onChange={(e) => setFormData(prev => ({ ...prev, counterparty: e.target.value }))}
                      placeholder="Vendor/Counterparty Name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Templates */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Templates</h2>
                <div className="space-y-3">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template.id)}
                      className={`w-full text-left p-4 border rounded-lg transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                        </div>
                        {selectedTemplate === template.id && (
                          <CheckCircle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Editor */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Editor Toolbar */}
                <div className="border-b border-gray-200 p-3 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => formatCommand('bold')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Bold className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => formatCommand('italic')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Italic className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => formatCommand('underline')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Underline className="w-4 h-4 text-gray-700" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                  <button
                    onClick={() => formatCommand('insertUnorderedList')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <List className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => formatCommand('insertOrderedList')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ListOrdered className="w-4 h-4 text-gray-700" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                  <button
                    onClick={() => formatCommand('justifyLeft')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <AlignLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => formatCommand('justifyCenter')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <AlignCenter className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => formatCommand('justifyRight')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <AlignRight className="w-4 h-4 text-gray-700" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                  <div className="ml-auto flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                      <Upload className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div
                  ref={editorRef}
                  className="p-8 min-h-[600px] focus:outline-none"
                  contentEditable
                  dangerouslySetInnerHTML={{ __html: contractContent }}
                  onInput={(e) => setContractContent(e.currentTarget.innerHTML)}
                />
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'versions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Version History</h2>
            <div className="space-y-6">
              {versions.map((version, index) => (
                <div key={version.version} className="flex gap-4 border-b border-gray-100 pb-6 last:pb-0 last:border-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                      v{version.version}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-900 font-medium">{version.notes}</h3>
                        <div className="text-sm text-gray-500 mt-1">
                          Uploaded by {version.uploadedBy} • {formatDateTime(version.uploadedAt)} • {version.fileSize}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-amber-600 hover:text-amber-800 text-sm font-medium">View</button>
                        <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Restore</button>
                        <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Download</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {versions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="mb-2">No versions saved yet</div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'comments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Comments</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {currentUser.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-6 space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold flex-shrink-0">
                      {comment.userName.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{comment.userName}</span>
                        <span className="text-xs text-gray-500">{comment.userRole}</span>
                        <span className="text-xs text-gray-400">• {timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-gray-700">{comment.text}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <div>No comments yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
