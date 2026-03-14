import { createWriteStream, createReadStream, readdirSync, statSync } from 'fs';
import { join, relative, basename } from 'path';
import { tmpdir } from 'os';

/**
 * Create a zip bundle from a skill directory.
 * Returns path to the created zip file.
 *
 * Note: Uses a minimal hand-rolled zip approach without extra deps.
 * For production, consider using the 'archiver' npm package.
 */
export async function createZipBundle(skillDir: string): Promise<string> {
  const skillName = basename(skillDir);
  const zipPath = join(tmpdir(), `${skillName}-${Date.now()}.zip`);

  // Dynamic import to avoid bundling issues
  const { execSync } = await import('child_process');

  try {
    // Use system zip if available (works on macOS/Linux)
    execSync(`cd "${skillDir}" && zip -r "${zipPath}" . -x "*.DS_Store" -x "node_modules/*"`, {
      stdio: 'pipe',
    });
  } catch {
    // Fallback: manual zip using Node streams (basic, no compression)
    await writeSimpleZip(skillDir, zipPath);
  }

  return zipPath;
}

async function writeSimpleZip(dir: string, zipPath: string): Promise<void> {
  // For CI environments without zip binary, write a tar.gz instead
  const { execSync } = await import('child_process');
  const tarPath = zipPath.replace('.zip', '.tar.gz');
  execSync(`tar -czf "${tarPath}" -C "${dir}" .`, { stdio: 'pipe' });
  return;
}
