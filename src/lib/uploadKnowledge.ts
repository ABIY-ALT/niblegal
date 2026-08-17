/**
 * Knowledge-module attachment storage.
 *
 * This used to be a second, independent implementation that wrote into
 * `public/uploads/knowledge/...` — i.e. straight into Next's statically served
 * directory, readable without a session. It now delegates to the single private
 * store in `@/lib/upload`; only the size limit differs.
 */
import { saveFile, UploadError, type SavedFile } from '@/lib/upload';

export const MAX_UPLOAD_SIZE_BYTES = 30 * 1024 * 1024; // 30MB

export { UploadError };
export type { SavedFile };

export function saveKnowledgeFile(documentId: string, file: File): Promise<SavedFile> {
  return saveFile('knowledge', documentId, file, MAX_UPLOAD_SIZE_BYTES);
}
