import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

export interface NoteEntry {
  timestamp: string;
  content: string;
}

const NOTE_SEPARATOR = '\n---\n\n';
const NOTE_PATTERN = /## \[(\d{4}-\d{2}-\d{2}[T ][^\]]+)\]\s+([\s\S]+?)(?=\n---|\n## \[|$)/g;

export class NotesManager {
  private filePath: string;

  constructor(
    private projectRoot: string,
    filename = 'NOTES.md'
  ) {
    this.filePath = join(projectRoot, filename);
  }

  append(content: string): NoteEntry {
    const timestamp = this.formatTimestamp(new Date());
    const entry: NoteEntry = { timestamp, content: content.trim() };

    if (!existsSync(this.filePath)) {
      this.createFile();
    }

    const entryText = `\n## [${timestamp}] ${content.trim()}\n`;
    appendFileSync(this.filePath, entryText, 'utf-8');
    return entry;
  }

  list(limit = 20): NoteEntry[] {
    if (!existsSync(this.filePath)) return [];
    const raw = readFileSync(this.filePath, 'utf-8');
    const entries: NoteEntry[] = [];

    let match: RegExpExecArray | null;
    // Reset lastIndex
    NOTE_PATTERN.lastIndex = 0;
    while ((match = NOTE_PATTERN.exec(raw)) !== null) {
      if (match[1] && match[2]) {
        entries.push({
          timestamp: match[1],
          content: match[2].trim(),
        });
      }
    }

    return entries.slice(-limit).reverse();
  }

  getRecentText(limit = 5): string {
    const notes = this.list(limit);
    if (notes.length === 0) return '_(no notes yet)_';
    return notes
      .map((n) => `**[${n.timestamp}]** ${n.content}`)
      .join('\n\n');
  }

  createDefault(): void {
    if (!existsSync(this.filePath)) {
      this.createFile();
    }
  }

  exists(): boolean {
    return existsSync(this.filePath);
  }

  private createFile(): void {
    const header = `# Architecture Notes

> Auto-managed by agentic-skill CLI. Append only — never delete entries.
`;
    writeFileSync(this.filePath, header, 'utf-8');
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString().replace('T', ' ').slice(0, 16);
  }
}
