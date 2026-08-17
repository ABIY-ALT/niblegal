'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pin, Eye, Home, ChevronRight, Inbox, Bookmark, Plus } from 'lucide-react';
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

function PanelEmpty({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 9, padding: '26px 14px', textAlign: 'center', color: 'var(--text-muted)',
    }}>
      <div style={{
        width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 13, background: 'var(--bg-input)', border: '1px solid var(--border)',
      }}>
        <Inbox size={19} />
      </div>
      <span style={{ fontSize: 12.5 }}>{message}</span>
    </div>
  );
}

function DocRow({ id, documentNumber, title, status }: { id: string; documentNumber: string; title: string; status: string }) {
  return (
    <Link href={`/knowledge/${id}`} className="cm-feed-item" style={{ textDecoration: 'none', alignItems: 'center' }}>
      <div className="cm-feed-body">
        <div className="cm-feed-action" style={{ fontSize: 12.5 }}>{title}</div>
        <div className="cm-feed-meta">{documentNumber}</div>
      </div>
      <StatusBadge status={status as never} />
    </Link>
  );
}

export default function FavoritesPage() {
  const { data: currentUser } = useCurrentUser();

  const { data: pinned } = useQuery({
    queryKey: ['knowledge-pinned', currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/documents?bookmarkedBy=${currentUser?.id}&limit=50`);
      const json = await res.json();
      return json.data as (KnowledgeDocumentListItem & { bookmarks?: { userId: string; isPinned: boolean }[] })[];
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
    <div className="enterprise-page">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <nav className="enterprise-kicker" aria-label="Breadcrumb">
              <Link href="/dashboard" className="enterprise-id" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Home size={11} /> Home
              </Link>
              <ChevronRight size={12} style={{ color: 'rgba(247,245,242,0.45)' }} />
              <Link href="/knowledge" className="enterprise-id" style={{ textDecoration: 'none' }}>Knowledge</Link>
            </nav>
            <h1 className="enterprise-title">Favorites</h1>
            <p className="enterprise-subtitle">
              Your bookmarked, pinned and recently viewed documents, kept close to hand.
            </p>
          </div>
          <Link href="/knowledge/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> Upload Document
          </Link>
        </div>
      </div>

      {/* ── Pinned + recently viewed ─────────────────────────────────────── */}
      <div className="enterprise-kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="enterprise-side-card">
          <div className="enterprise-side-title"><Pin /> Pinned Documents</div>
          {!pinned || pinned.length === 0 ? (
            <PanelEmpty message="No pinned documents yet — pin a bookmark from its detail page." />
          ) : (
            <div className="cm-feed">
              {pinned.slice(0, 8).map((d) => (
                <DocRow key={d.id} id={d.id} documentNumber={d.documentNumber} title={d.title} status={d.status} />
              ))}
            </div>
          )}
        </div>

        <div className="enterprise-side-card">
          <div className="enterprise-side-title"><Eye /> Recently Viewed</div>
          {!recentlyViewed || recentlyViewed.length === 0 ? (
            <PanelEmpty message="You haven't viewed any documents recently." />
          ) : (
            <div className="cm-feed">
              {recentlyViewed.slice(0, 8).map((d) => (
                <DocRow key={d.id} id={d.id} documentNumber={d.documentNumber} title={d.title} status={d.status} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── All bookmarked ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        <Bookmark size={13} /> All bookmarked documents
      </div>

      <DocumentTable
        scope="favorites"
        title=""
        embedded
        showFilters
        emptyMessage="You haven't bookmarked any documents yet."
      />
    </div>
  );
}
