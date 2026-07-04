'use client';

import { useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import type { KnowledgeCommentRecord } from '@/types/knowledge';

interface Props {
  comments: KnowledgeCommentRecord[];
  onAddComment: (text: string, isInternal: boolean) => Promise<void> | void;
  submitting?: boolean;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function CommentThread({ comments, onAddComment, submitting }: Props) {
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onAddComment(text.trim(), isInternal);
    setText('');
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          className="form-control"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
            Internal note
          </label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !text.trim()}>
            Post Comment
          </button>
        </div>
      </form>

      {comments.length === 0 ? (
        <div className="empty-state">
          <p>No comments yet.</p>
        </div>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <div className="comment-item" key={c.id}>
              <div className="comment-header">
                <div className="comment-avatar">{initials(`${c.author.firstName} ${c.author.lastName}`)}</div>
                <span className="comment-author">{c.author.firstName} {c.author.lastName}</span>
                {c.isInternal && <span className="tag">Internal</span>}
                <span className="comment-time">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
              </div>
              <div className="comment-text">{c.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
