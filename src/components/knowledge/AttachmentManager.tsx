'use client';

import { useRef, useState, type DragEvent } from 'react';
import { Paperclip, Upload, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import type { KnowledgeAttachmentRecord } from '@/types/knowledge';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface LocalModeProps {
  mode: 'local';
  files: File[];
  onFilesChange: (files: File[]) => void;
}

interface RemoteModeProps {
  mode: 'remote';
  attachments: KnowledgeAttachmentRecord[];
  onUpload: (files: File[]) => Promise<void> | void;
  uploading?: boolean;
}

type Props = LocalModeProps | RemoteModeProps;

export function AttachmentManager(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (props.mode === 'local') {
      props.onFilesChange([...props.files, ...files]);
    } else {
      props.onUpload(files);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragOver ? 'var(--accent)' : 'var(--border)',
          background: dragOver ? 'var(--bg-card-hover)' : 'transparent',
        }}
      >
        <Upload size={28} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted">
          Drag & drop files here, or <span className="text-accent font-semibold">browse</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {props.mode === 'local' ? (
        props.files.length > 0 && (
          <ul className="flex flex-col gap-2">
            {props.files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
                <span className="flex items-center gap-2 truncate">
                  <Paperclip size={14} className="opacity-60 shrink-0" />
                  {f.name}
                  <span className="text-muted text-xs">({formatSize(f.size)})</span>
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm p-1"
                  onClick={() => props.onFilesChange(props.files.filter((_, idx) => idx !== i))}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : props.attachments.length === 0 ? (
        <div className="empty-state">
          <p>No attachments uploaded yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {props.attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
              <span className="flex items-center gap-2 truncate">
                <Paperclip size={14} className="opacity-60 shrink-0" />
                {a.fileName}
                <span className="text-muted text-xs">
                  ({formatSize(a.fileSize)}) · {a.uploadedBy.firstName} {a.uploadedBy.lastName} ·{' '}
                  {format(new Date(a.createdAt), 'MMM d, yyyy')}
                </span>
              </span>
              <a href={a.fileUrl} download className="btn btn-ghost btn-sm p-1">
                <Download size={14} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
