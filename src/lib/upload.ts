import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_BASE = path.join(process.cwd(), 'public', 'uploads');
export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export interface SavedFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

export class UploadError extends Error {}

/** Persist a file under public/uploads/<module>/<ownerId>/ and return its metadata. */
async function saveFile(module: string, ownerId: string, file: File): Promise<SavedFile> {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new UploadError(`"${file.name}" exceeds the 20MB attachment size limit`);
  }

  const dir = path.join(UPLOAD_BASE, module, ownerId);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name);
  const safeName = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), buffer);

  return {
    fileName: file.name,
    fileUrl: `/uploads/${module}/${ownerId}/${safeName}`,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
  };
}

export function saveUploadedFile(requestId: string, file: File): Promise<SavedFile> {
  return saveFile('advisory', requestId, file);
}

export function saveContractFile(contractId: string, file: File): Promise<SavedFile> {
  return saveFile('contracts', contractId, file);
}
