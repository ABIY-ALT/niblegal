'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pin, Eye } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { StatusBadge } from '@/components/knowledge/StatusBadge';
import { DocumentTable } from '@/components/knowledge/DocumentTable';
import type { KnowledgeDocumentListItem } from '@/types/knowledge';

interface RecentlyViewedItem {
  id: string;
  documentNumber: string;
  title: string;
  status: string;
}

export default function FavoritesPage() {
  const { data: currentUser } = useCurrentUser();

  const { data: pinned } = useQuery({
    queryKey: ['knowledge-pinned', currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/documents?bookmarkedBy=${currentUser?.id}&limit=50`);
      const json = await res.json();
      return (json.data as (KnowledgeDocumentListItem & { bookmarks?: { userId: string; isPinned: boolean }[] })[]).filter(() => true);
    },
    enabled: !!currentUser?.id,
  });

  const { data: recentlyViewed } = useQuery({
    queryKey: ['knowledge-recently-viewed', currentUser?.id],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/documents/recently-viewed');
      const json = await res.json();
      return json.data as RecentlyViewedItem[];
    },
    enabled: !!currentUser?.id,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Favorites</h1>
        <p className="text-muted text-sm">Your bookmarked, pinned, and recently viewed documents.</p>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card">
          <div className="card-header"><span className="card-title"><Pin size={15} className="inline mr-2" />Pinned Documents</span></div>
          {!pinned || pinned.length === 0 ? (
            <div className="empty-state"><p>No pinned documents yet — pin a bookmark from its detail page.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {pinned.slice(0, 10).map((d) => (
                <Link key={d.id} href={`/knowledge/${d.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{d.documentNumber} — {d.title}</span>
                  <StatusBadge status={d.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title"><Eye size={15} className="inline mr-2" />Recently Viewed</span></div>
          {!recentlyViewed || recentlyViewed.length === 0 ? (
            <div className="empty-state"><p>You haven&apos;t viewed any documents recently.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentlyViewed.map((d) => (
                <Link key={d.id} href={`/knowledge/${d.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{d.documentNumber} — {d.title}</span>
                  <StatusBadge status={d.status as never} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <DocumentTable scope="favorites" title="All Bookmarks" emptyMessage="You haven't bookmarked any documents yet" />
    </div>
  );
}
