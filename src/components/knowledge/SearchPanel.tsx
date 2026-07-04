'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';

export function SearchPanel({ onSearch, initialValue }: { onSearch?: (q: string) => void; initialValue?: string }) {
  const [q, setQ] = useState(initialValue ?? '');
  const [focused, setFocused] = useState(false);

  const { data: suggestions } = useQuery({
    queryKey: ['knowledge-search-suggest', q],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/search/suggest?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      return json.data as { id: string; title: string; documentNumber: string }[];
    },
    enabled: q.length > 1,
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="form-control pl-10"
          placeholder="Search titles, keywords, tags, laws..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch?.(q);
          }}
        />
      </div>
      {focused && suggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 card p-2 z-10">
          {suggestions.map((s) => (
            <Link key={s.id} href={`/knowledge/${s.id}`} className="block text-sm p-2 rounded-md hover-card">
              <span className="font-mono text-xs text-muted mr-2">{s.documentNumber}</span>
              {s.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
