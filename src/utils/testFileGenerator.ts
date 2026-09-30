import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Creates a file just over the given size (decimal MB, matching the backend's own MB math)
 * in the OS temp dir. Generated at runtime instead of committed to the repo to avoid
 * checking in multi-megabyte binaries.
 */
export function createOversizedFile(sizeInMb: number, fileName = 'oversized-document.png'): string {
  const filePath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(filePath, Buffer.alloc(sizeInMb * 1000 * 1000 + 1024));
  return filePath;
}

export function removeGeneratedFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
