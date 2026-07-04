import { diffWordsWithSpace } from 'diff';

export interface DiffSegment {
  value: string;
  type: 'unchanged' | 'added' | 'removed';
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function diffOpinionContent(oldContent: string, newContent: string): DiffSegment[] {
  const parts = diffWordsWithSpace(stripHtml(oldContent), stripHtml(newContent));
  return parts.map((p) => ({
    value: p.value,
    type: p.added ? 'added' : p.removed ? 'removed' : 'unchanged',
  }));
}
