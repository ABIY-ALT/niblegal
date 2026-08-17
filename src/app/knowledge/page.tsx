'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Plus, LayoutGrid, List as ListIcon, Search as SearchIcon,
  BookOpen, Folder, ChevronRight, Home, Inbox, FileText, LayoutDashboard,
} from 'lucide-react';
import { FolderTree } from '@/components/knowledge/FolderTree';
import { DocumentCard } from '@/components/knowledge/DocumentCard';
import { DocumentTable } from '@/components/knowledge/DocumentTable';
import type { KnowledgeCategoryOption, KnowledgeDocumentListItem } from '@/types/knowledge';

const TAB_TO_CATEGORY_CODE: Record<string, string> = {
  contracts: 'CONTRACT_TEMPLATES',
  opinions: 'LEGAL_OPINION_TEMPLATES',
  policies: 'POLICIES',
  nbe: 'NBE_DIRECTIVES',
  laws: 'LAWS_REGULATIONS',
  research: 'LEGAL_RESEARCH',
  articles: 'ARTICLES',
  faq: 'FAQ',
};

export default function RepositoryHomePage() {
  return (
    <Suspense fallback={null}>
      <RepositoryHome />
    </Suspense>
  );
}

function RepositoryHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<KnowledgeCategoryOption | null>(null);
  const [view, setView] = useState<'folder' | 'list'>('folder');
  const [search, setSearch] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/categories');
      const json = await res.json();
      return json.data as KnowledgeCategoryOption[];
    },
  });

  const { data: flatCategories } = useQuery({
    queryKey: ['knowledge-categories-flat'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/categories');
      const json = await res.json();
      return json.flat as KnowledgeCategoryOption[];
    },
  });

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (!tab || !flatCategories) return;
    const code = TAB_TO_CATEGORY_CODE[tab];
    if (!code) return;
    const match = flatCategories.find((c) => c.code === code);
    if (match) setSelected(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, flatCategories]);

  const { data: docsInCategory, isLoading: docsLoading } = useQuery({
    queryKey: ['knowledge-documents-browse', selected?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '24' });
      if (selected) params.set('categoryId', selected.id);
      const res = await fetch(`/api/knowledge/documents?${params}`);
      const json = await res.json();
      return json.data as KnowledgeDocumentListItem[];
    },
    enabled: view === 'folder' && !!selected,
  });

  const rootCategories = useMemo(() => categories ?? [], [categories]);
  const totalDocuments = useMemo(
    () => rootCategories.reduce((sum, c) => sum + (c.documentCount ?? 0), 0),
    [rootCategories],
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/knowledge/search?q=${encodeURIComponent(q)}` : '/knowledge/search');
  };

  return (
    <div className="enterprise-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <div className="enterprise-kicker">
              <span className="enterprise-id">KNOWLEDGE</span>
              <span className="badge status-active">Repository</span>
            </div>
            <h1 className="enterprise-title">Legal Knowledge Repository</h1>
            <p className="enterprise-subtitle">
              Contract templates, standard clauses, legal opinions, policies, NBE
              directives and research — organised, versioned and searchable.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260 }}>
            <form onSubmit={submitSearch} className="cm-search">
              <SearchIcon />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search the repository…"
                aria-label="Search the knowledge repository"
              />
            </form>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/knowledge/dashboard" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <LayoutDashboard size={14} /> Dashboard
              </Link>
              <Link href="/knowledge/new" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Plus size={14} /> Upload
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Browser ──────────────────────────────────────────────────────── */}
      <div className="enterprise-layout" style={{ gridTemplateColumns: '270px minmax(0, 1fr)' }}>

        {/* Category tree */}
        <div className="enterprise-side">
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Folder /> Categories</div>
            <button
              type="button"
              className={`kn-tree-root${!selected ? ' active' : ''}`}
              onClick={() => setSelected(null)}
            >
              <BookOpen size={14} />
              All categories
              <span className="cm-count" style={{ marginLeft: 'auto' }}>{totalDocuments}</span>
            </button>
            <FolderTree categories={rootCategories} selectedId={selected?.id} onSelect={setSelected} />
          </div>
        </div>

        {/* Content */}
        <div className="enterprise-main">
          <div className="enterprise-panel">
            <div className="cm-toolbar">
              <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, minWidth: 0 }} aria-label="Breadcrumb">
                <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Home size={13} /> Home
                </Link>
                <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    font: 'inherit', color: selected ? 'var(--text-muted)' : 'var(--text-primary)',
                    fontWeight: selected ? 400 : 700,
                  }}
                >
                  Repository
                </button>
                {selected && (
                  <>
                    <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selected.name}</span>
                  </>
                )}
              </nav>

              <div className="cm-segment" role="group" aria-label="View mode">
                <button
                  className={view === 'folder' ? 'active' : ''}
                  onClick={() => setView('folder')}
                  aria-pressed={view === 'folder'}
                  aria-label="Card view"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  className={view === 'list' ? 'active' : ''}
                  onClick={() => setView('list')}
                  aria-pressed={view === 'list'}
                  aria-label="Table view"
                >
                  <ListIcon size={15} />
                </button>
              </div>
            </div>

            {view === 'folder' && (
              <div className="enterprise-panel-body">
                {!selected ? (
                  rootCategories.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 16px' }}>
                      <Inbox size={28} style={{ color: 'var(--text-muted)' }} />
                      <p style={{ fontSize: 13 }}>No categories configured yet.</p>
                    </div>
                  ) : (
                    <div className="kn-category-grid">
                      {rootCategories.map((c) => (
                        <button key={c.id} type="button" className="kn-category-card" onClick={() => setSelected(c)}>
                          <span className="kn-category-icon"><Folder size={19} /></span>
                          <span className="kn-category-name">{c.name}</span>
                          <span className="kn-category-count">{c.documentCount ?? 0} items</span>
                        </button>
                      ))}
                    </div>
                  )
                ) : docsLoading ? (
                  <div className="kn-doc-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="skeleton" style={{ height: 138, borderRadius: 'var(--radius-md)' }} />
                    ))}
                  </div>
                ) : !docsInCategory || docsInCategory.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 16px', textAlign: 'center' }}>
                    <div style={{
                      width: 56, height: 56, margin: '0 auto 12px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', borderRadius: 16,
                      background: 'var(--bg-input)', border: '1px solid var(--border)',
                    }}>
                      <FileText size={24} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>
                      Nothing in {selected.name} yet
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                      Upload the first document to this category.
                    </p>
                    <Link href="/knowledge/new" className="btn btn-primary btn-sm">
                      <Plus size={14} /> Upload Document
                    </Link>
                  </div>
                ) : (
                  <div className="kn-doc-grid">
                    {docsInCategory.map((d) => <DocumentCard key={d.id} doc={d} />)}
                  </div>
                )}
              </div>
            )}
          </div>

          {view === 'list' && (
            <DocumentTable
              scope="all"
              title=""
              embedded
              categoryId={selected?.id}
              showFilters
              emptyMessage={
                selected
                  ? `No documents in ${selected.name} yet.`
                  : 'No documents in the repository yet.'
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
