'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import type { KnowledgeCategoryOption } from '@/types/knowledge';

interface NodeProps {
  node: KnowledgeCategoryOption;
  selectedId?: string;
  onSelect: (category: KnowledgeCategoryOption) => void;
  depth: number;
}

function TreeNode({ node, selectedId, onSelect, depth }: NodeProps) {
  const [open, setOpen] = useState(true);
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px`, background: selectedId === node.id ? 'var(--bg-card-hover)' : undefined }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className="shrink-0"
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {open ? <FolderOpen size={15} className="text-accent shrink-0" /> : <Folder size={15} className="text-accent shrink-0" />}
        <span className="truncate">{node.name}</span>
        {typeof node.documentCount === 'number' && <span className="text-xs text-muted ml-auto">{node.documentCount}</span>}
      </div>
      {hasChildren && open && (
        <div>
          {node.children!.map((c) => (
            <TreeNode key={c.id} node={c} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  categories,
  selectedId,
  onSelect,
}: {
  categories: KnowledgeCategoryOption[];
  selectedId?: string;
  onSelect: (category: KnowledgeCategoryOption) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {categories.map((c) => (
        <TreeNode key={c.id} node={c} selectedId={selectedId} onSelect={onSelect} depth={0} />
      ))}
    </div>
  );
}
