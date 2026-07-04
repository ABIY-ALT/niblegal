import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads', 'knowledge');
export const MAX_UPLOAD_SIZE_BYTES = 30 * 1024 * 1024; // 30MB

export interface SavedFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

export class UploadError extends Error {}

export async function saveKnowledgeFile(documentId: string, file: File): Promise<SavedFile> {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new UploadError(`"${file.name}" exceeds the 30MB attachment size limit`);
  }

  const dir = path.join(UPLOAD_ROOT, documentId);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name);
  const safeName = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), buffer);

  return {
    fileName: file.name,
    fileUrl: `/uploads/knowledge/${documentId}/${safeName}`,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
  };
}
