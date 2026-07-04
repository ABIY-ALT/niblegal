'use client';

import { useEffect, useState } from 'react';
import { FileWarning, Download } from 'lucide-react';

type Kind = 'pdf' | 'image' | 'docx' | 'other';

function detectKind(fileType: string, fileName: string): Kind {
  const lower = fileName.toLowerCase();
  if (fileType.includes('pdf') || lower.endsWith('.pdf')) return 'pdf';
  if (fileType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(lower)) return 'image';
  if (fileType.includes('word') || lower.endsWith('.docx')) return 'docx';
  return 'other';
}

export function DocumentViewer({ fileUrl, fileName, fileType }: { fileUrl: string; fileName: string; fileType: string }) {
  const kind = detectKind(fileType, fileName);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxError, setDocxError] = useState(false);

  useEffect(() => {
    if (kind !== 'docx') return;
    let cancelled = false;
    setDocxHtml(null);
    setDocxError(false);
    (async () => {
      try {
        const mammoth = await import('mammoth/mammoth.browser.js');
        const res = await fetch(fileUrl);
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setDocxHtml(result.value);
      } catch {
        if (!cancelled) setDocxError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, fileUrl]);

  if (kind === 'pdf') {
    return (
      <iframe
        src={fileUrl}
        title={fileName}
        className="w-full rounded-md border border-border"
        style={{ height: '75vh' }}
      />
    );
  }

  if (kind === 'image') {
    return (
      <div className="flex justify-center rounded-md p-4" style={{ background: 'var(--bg-input)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fileUrl} alt={fileName} className="max-w-full rounded-md" />
      </div>
    );
  }

  if (kind === 'docx') {
    if (docxError) {
      return <DownloadOnlyState fileUrl={fileUrl} fileName={fileName} message="Preview unavailable for this document — download to view." />;
    }
    if (!docxHtml) {
      return (
        <div className="text-center py-20">
          <div className="spinner-sm border-accent" />
        </div>
      );
    }
    return (
      <div className="tiptap-content rounded-md p-6 max-h-[75vh] overflow-y-auto" style={{ background: 'var(--bg-input)' }}>
        <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: docxHtml }} />
      </div>
    );
  }

  return <DownloadOnlyState fileUrl={fileUrl} fileName={fileName} message="Preview not available for this file type — download to view." />;
}

function DownloadOnlyState({ fileUrl, fileName, message }: { fileUrl: string; fileName: string; message: string }) {
  return (
    <div className="empty-state">
      <FileWarning />
      <p>{message}</p>
      <a href={fileUrl} download={fileName} className="btn btn-primary mt-3">
        <Download size={16} /> Download {fileName}
      </a>
    </div>
  );
}
