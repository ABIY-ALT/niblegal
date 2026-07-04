'use client';

import { useState } from 'react';
import { Star, Pin } from 'lucide-react';

interface Props {
  documentId: string;
  isBookmarked: boolean;
  isPinned: boolean;
  onChange?: () => void;
}

export function BookmarkButton({ documentId, isBookmarked, isPinned, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  const toggleBookmark = async () => {
    setBusy(true);
    try {
      await fetch(`/api/knowledge/documents/${documentId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
      });
      onChange?.();
    } finally {
      setBusy(false);
    }
  };

  const togglePin = async () => {
    setBusy(true);
    try {
      await fetch(`/api/knowledge/documents/${documentId}/bookmark?pin=${isPinned ? '0' : '1'}`, { method: 'POST' });
      onChange?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-1">
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        disabled={busy}
        onClick={toggleBookmark}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
      >
        <Star size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
      </button>
      {isBookmarked && (
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          disabled={busy}
          onClick={togglePin}
          title={isPinned ? 'Unpin' : 'Pin to top'}
        >
          <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}
