'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, LayoutGrid, List as ListIcon, Search as SearchIcon } from 'lucide-react';
import { FolderTree } from '@/components/knowledge/FolderTree';
import { CategoryCard, DocumentCard } from '@/components/knowledge/DocumentCard';
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
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<KnowledgeCategoryOption | null>(null);
  const [view, setView] = useState<'folder' | 'list'>('folder');

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

  const { data: docsInCategory } = useQuery({
    queryKey: ['knowledge-documents-browse', selected?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '24' });
      if (selected) params.set('categoryId', selected.id);
      const res = await fetch(`/api/knowledge/documents?${params}`);
      const json = await res.json();
      return json.data as KnowledgeDocumentListItem[];
    },
    enabled: view === 'folder',
  });

  const rootCategories = useMemo(() => categories ?? [], [categories]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Legal Knowledge Repository</h1>
          <p className="text-muted text-sm">Browse contract templates, legal opinions, policies, regulations, and research.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/knowledge/search" className="btn btn-secondary"><SearchIcon size={16} /> Search Repository</Link>
          <Link href="/knowledge/new" className="btn btn-primary"><Plus size={16} /> Upload Document</Link>
        </div>
      </div>

      <div className="flex gap-5 items-start flex-wrap lg:flex-nowrap">
        <div className="card w-full lg:w-72 shrink-0">
          <div className="card-header"><span className="card-title">Categories</span></div>
          <button
            type="button"
            className={`w-full text-left text-sm py-1.5 px-2 rounded-md mb-1 ${!selected ? '' : ''}`}
            style={{ background: !selected ? 'var(--bg-card-hover)' : undefined }}
            onClick={() => setSelected(null)}
          >
            All Categories
          </button>
          <FolderTree categories={rootCategories} selectedId={selected?.id} onSelect={setSelected} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{selected ? selected.name : 'All Categories'}</h2>
            <div className="flex gap-1">
              <button className={`btn btn-sm ${view === 'folder' ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => setView('folder')}>
                <LayoutGrid size={14} />
              </button>
              <button className={`btn btn-sm ${view === 'list' ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => setView('list')}>
                <ListIcon size={14} />
              </button>
            </div>
          </div>

          {view === 'folder' ? (
            !selected ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {rootCategories.map((c) => (
                  <CategoryCard key={c.id} category={c} onClick={() => setSelected(c)} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {docsInCategory?.length === 0 ? (
                  <div className="empty-state col-span-full"><p>No documents in this category yet.</p></div>
                ) : (
                  docsInCategory?.map((d) => <DocumentCard key={d.id} doc={d} />)
                )}
              </div>
            )
          ) : (
            <DocumentTable
              scope="all"
              title=""
              categoryId={selected?.id}
              emptyMessage="No documents found in this category"
            />
          )}
        </div>
      </div>
    </div>
  );
}
