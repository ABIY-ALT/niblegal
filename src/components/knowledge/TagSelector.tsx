'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import type { KnowledgeTagOption } from '@/types/knowledge';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagSelector({ value, onChange }: Props) {
  const [input, setInput] = useState('');

  const { data: suggestions } = useQuery({
    queryKey: ['knowledge-tags', input],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/tags?q=${encodeURIComponent(input)}`);
      const json = await res.json();
      return json.data as KnowledgeTagOption[];
    },
    enabled: input.length > 0,
  });

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
  };

  return (
    <div>
      {value.length > 0 && (
        <div className="tags-list mb-2">
          {value.map((t) => (
            <span key={t} className="tag flex items-center gap-1">
              {t}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== t))}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="form-control"
        placeholder="Type a tag and press Enter..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
          }
        }}
      />
      {suggestions && suggestions.length > 0 && input && (
        <div className="flex gap-2 flex-wrap mt-2">
          {suggestions
            .filter((s) => !value.includes(s.name))
            .map((s) => (
              <button key={s.id} type="button" className="tag" onClick={() => addTag(s.name)}>
                {s.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
