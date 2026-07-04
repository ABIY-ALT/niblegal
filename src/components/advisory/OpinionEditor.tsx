'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote,
  Table as TableIcon, Undo, Redo, Save, FileText, BookOpen,
} from 'lucide-react';

const CLAUSE_LIBRARY = [
  { title: 'Standard Disclaimer', content: '<p>This opinion is rendered based on the information provided and is subject to Ethiopian law and NBE directives in force as of the date hereof.</p>' },
  { title: 'Confidentiality Clause', content: '<p>This legal opinion is confidential and intended solely for the use of the requesting department.</p>' },
  { title: 'Governing Law', content: '<p>This matter shall be governed by the laws of the Federal Democratic Republic of Ethiopia.</p>' },
  { title: 'No Waiver', content: '<p>No failure to exercise, and no delay in exercising, any right under this opinion shall operate as a waiver thereof.</p>' },
];

const TEMPLATES = [
  { title: 'Contract Review Opinion', content: '<h2>Legal Opinion</h2><p><strong>Subject:</strong> </p><h3>1. Background</h3><p></p><h3>2. Legal Analysis</h3><p></p><h3>3. Recommendation</h3><p></p>' },
  { title: 'Compliance Advisory', content: '<h2>Compliance Advisory</h2><h3>1. Regulatory Basis</h3><p></p><h3>2. Assessment</h3><p></p><h3>3. Conclusion</h3><p></p>' },
  { title: 'Litigation Advisory', content: '<h2>Litigation Advisory</h2><h3>1. Matter Summary</h3><p></p><h3>2. Risk Assessment</h3><p></p><h3>3. Recommended Course of Action</h3><p></p>' },
];

interface Props {
  initialContent: string;
  onSave: (html: string, changeNote?: string) => Promise<void> | void;
  readOnly?: boolean;
  autosaveMs?: number;
}

export function OpinionEditor({ initialContent, onSave, readOnly, autosaveMs = 30000 }: Props) {
  const [showPanel, setShowPanel] = useState<'templates' | 'clauses' | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start drafting the legal opinion...' }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent || '<p></p>',
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: () => {
      dirtyRef.current = true;
    },
  });

  const handleSave = async (changeNote?: string) => {
    if (!editor) return;
    setSaving(true);
    try {
      await onSave(editor.getHTML(), changeNote);
      dirtyRef.current = false;
      setLastSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (readOnly || !editor) return;
    const interval = setInterval(() => {
      if (dirtyRef.current) void handleSave();
    }, autosaveMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, autosaveMs, readOnly]);

  if (!editor) return null;

  return (
    <div className="card">
      {!readOnly && (
        <div className="flex items-center gap-1 flex-wrap border-b border-border pb-3 mb-3">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold /></button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic /></button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon /></button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List /></button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered /></button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote /></button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table"><TableIcon /></button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo /></button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo /></button>
          <div className="flex-1" />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPanel(showPanel === 'templates' ? null : 'templates')}>
            <FileText size={14} /> Templates
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPanel(showPanel === 'clauses' ? null : 'clauses')}>
            <BookOpen size={14} /> Clause Library
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={() => handleSave()}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1 min-w-0 tiptap-content">
          <EditorContent editor={editor} />
        </div>
        {showPanel && !readOnly && (
          <div className="w-64 shrink-0 border-l border-border pl-4">
            <div className="text-xs font-semibold text-muted uppercase mb-2">
              {showPanel === 'templates' ? 'Legal Templates' : 'Clause Library'}
            </div>
            <div className="flex flex-col gap-2">
              {(showPanel === 'templates' ? TEMPLATES : CLAUSE_LIBRARY).map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="btn btn-ghost btn-sm text-left justify-start"
                  onClick={() => editor.chain().focus().insertContent(item.content).run()}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex justify-between text-xs text-muted mt-3 pt-3 border-t border-border">
          <span>{editor.storage.characterCount?.characters() ?? 0} characters</span>
          <span>{lastSavedAt ? `Last saved ${lastSavedAt.toLocaleTimeString()}` : 'Not saved yet'}</span>
        </div>
      )}
    </div>
  );
}
