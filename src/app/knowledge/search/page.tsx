'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Bookmark, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/knowledge/StatusBadge';
import type { KnowledgeCategoryOption, KnowledgeDocumentListItem } from '@/types/knowledge';

interface SavedSearch {
  name: string;
  q: string;
  categoryId: string;
  tag: string;
  departmentId: string;
  dateFrom: string;
  dateTo: string;
}

const STORAGE_KEY = 'nib-knowledge-saved-searches';

export default function KnowledgeSearchPage() {
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tag, setTag] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeQuery, setActiveQuery] = useState<Record<string, string> | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedSearches(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const { data: flatCategories } = useQuery({
    queryKey: ['knowledge-categories-flat'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/categories');
      const json = await res.json();
      return json.flat as KnowledgeCategoryOption[];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['knowledge-departments'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/departments');
      return (await res.json()).data as { id: string; name: string }[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-search', activeQuery],
    queryFn: async () => {
      const params = new URLSearchParams(activeQuery ?? {});
      const res = await fetch(`/api/knowledge/search?${params}`);
      const json = await res.json();
      return json.data as KnowledgeDocumentListItem[];
    },
    enabled: !!activeQuery,
  });

  const currentCriteria = useMemo(
    () => ({ q, categoryId, tag, departmentId, dateFrom, dateTo }),
    [q, categoryId, tag, departmentId, dateFrom, dateTo],
  );

  const runSearch = () => {
    const params: Record<string, string> = {};
    Object.entries(currentCriteria).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    setActiveQuery(params);
  };

  const applySaved = (s: SavedSearch) => {
    setQ(s.q);
    setCategoryId(s.categoryId);
    setTag(s.tag);
    setDepartmentId(s.departmentId);
    setDateFrom(s.dateFrom);
    setDateTo(s.dateTo);
    setActiveQuery({ q: s.q, categoryId: s.categoryId, tag: s.tag, departmentId: s.departmentId, dateFrom: s.dateFrom, dateTo: s.dateTo });
  };

  const saveCurrentSearch = () => {
    const name = prompt('Name this search:');
    if (!name) return;
    const next = [...savedSearches, { name, ...currentCriteria }];
    setSavedSearches(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const deleteSaved = (name: string) => {
    const next = savedSearches.filter((s) => s.name !== name);
    setSavedSearches(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Knowledge Search</h1>
        <p className="text-muted text-sm">Search by title, keyword, tag, category, law, contract number, legal request number, department, author, or date.</p>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="form-control pl-10"
              placeholder="Search titles, keywords, laws, contract/request numbers..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => setShowAdvanced(!showAdvanced)}>
            <Filter size={16} /> Advanced
          </button>
          <button className="btn btn-primary" onClick={runSearch}>Search</button>
        </div>

        {showAdvanced && (
          <div className="form-row cols-3 border-t border-border pt-4">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Any</option>
                {flatCategories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tag</label>
              <input className="form-control" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. confidentiality" />
            </div>
            <div className="form-group">
              <label className="form-label">Related Department</label>
              <select className="form-control" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">Any</option>
                {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date From</label>
              <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date To</label>
              <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="form-group flex items-end">
              <button className="btn btn-ghost btn-sm" onClick={saveCurrentSearch}>
                <Bookmark size={14} /> Save this search
              </button>
            </div>
          </div>
        )}

        {savedSearches.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-border">
            {savedSearches.map((s) => (
              <span key={s.name} className="tag flex items-center gap-2">
                <button type="button" onClick={() => applySaved(s)}>{s.name}</button>
                <button type="button" onClick={() => deleteSaved(s.name)}><Trash2 size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {activeQuery && (
        <div className="card">
          {isLoading ? (
            <div className="text-center py-10"><div className="spinner-sm border-accent" /></div>
          ) : !data || data.length === 0 ? (
            <div className="empty-state"><p>No documents match your search.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Document ID</th><th>Title</th><th>Category</th><th>Owner</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.map((d) => (
                    <tr key={d.id}>
                      <td><Link href={`/knowledge/${d.id}`} className="text-accent font-mono text-sm hover:underline">{d.documentNumber}</Link></td>
                      <td>{d.title}</td>
                      <td>{d.category.name}</td>
                      <td>{d.author.firstName} {d.author.lastName}</td>
                      <td><StatusBadge status={d.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
