'use client';

import { useRef, useState, type DragEvent } from 'react';
import { Download, Eye, FileArchive, FileImage, FileText, History, Paperclip, UploadCloud, X } from 'lucide-react';
import { format } from 'date-fns';
import type { LegalAttachmentRecord } from '@/types/advisory';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(fileName: string, fileType?: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (fileType?.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext ?? '')) return <FileImage />;
  if (['zip', 'rar', '7z'].includes(ext ?? '')) return <FileArchive />;
  return <FileText />;
}

interface LocalModeProps {
  mode: 'local';
  files: File[];
  onFilesChange: (files: File[]) => void;
}

interface RemoteModeProps {
  mode: 'remote';
  attachments: LegalAttachmentRecord[];
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
        className={`upload-zone ${dragOver ? 'dragging' : ''}`}
      >
        <div className="upload-content">
          <div className="upload-illustration">
            <UploadCloud />
          </div>
          <div>
            <div className="upload-title">Drop supporting documents here</div>
            <p className="upload-copy">
              Drag files into this secure workspace or browse from your device.
            </p>
            <div className="upload-types" aria-label="Supported file types">
              {['PDF', 'DOCX', 'XLSX', 'PNG', 'JPG', 'ZIP'].map((type) => (
                <span key={type} className="upload-chip">{type}</span>
              ))}
            </div>
          </div>
        </div>
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
          <div className="attachment-grid">
            {props.files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="attachment-card">
                <div className="attachment-preview">{fileIcon(f.name, f.type)}</div>
                <div>
                  <div className="attachment-name" title={f.name}>{f.name}</div>
                  <div className="attachment-meta">Pending upload · {formatSize(f.size)}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => props.onFilesChange(props.files.filter((_, idx) => idx !== i))}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        )
      ) : props.attachments.length === 0 ? (
        <div className="empty-state">
          <Paperclip />
          <p>No attachments uploaded yet.</p>
        </div>
      ) : (
        <div className="attachment-grid">
          {props.attachments.map((a) => (
            <div key={a.id} className="attachment-card">
              <div className="attachment-preview">{fileIcon(a.fileName, a.fileType)}</div>
              <div>
                <div className="attachment-name" title={a.fileName}>{a.fileName}</div>
                <div className="attachment-meta">
                  {formatSize(a.fileSize)} · {a.uploadedBy.firstName} {a.uploadedBy.lastName}<br />
                  {format(new Date(a.createdAt), 'MMM d, yyyy')} · {a.category.replace(/_/g, ' ')}
                </div>
              </div>
              <div className="attachment-actions">
                <a href={a.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <Eye size={14} /> Preview
                </a>
                <a href={a.fileUrl} download className="btn btn-secondary btn-sm">
                  <Download size={14} /> Download
                </a>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" disabled title="Version history will appear when versions are available">
                <History size={14} /> Version history
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
