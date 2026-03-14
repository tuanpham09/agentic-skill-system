import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { ConfigLoader } from '@agentic-skill/core';
import type { AppContext } from '@agentic-skill/core';
import type { AgenticConfig } from '@agentic-skill/core';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getProjectRoot(): string {
  return process.cwd();
}

export function getBundledSkillsDir(): string {
  // Traverse up from dist/utils/ to find the skills/ dir
  // In dev: packages/cli/src/utils → packages/cli/../../../skills
  // In prod (npm): dist/utils → ../../skills
  const candidates = [
    join(__dirname, '..', '..', '..', '..', 'skills'),  // dev: from src/utils
    join(__dirname, '..', '..', 'skills'),                // prod: from dist/utils
    join(__dirname, '..', 'skills'),                      // prod alt
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return join(__dirname, '..', '..', 'skills');
}

export function getCliVersion(): string {
  const candidates = [
    join(__dirname, '..', '..', 'package.json'),
    join(__dirname, '..', 'package.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const pkg = JSON.parse(readFileSync(p, 'utf-8')) as { version: string };
        return pkg.version;
      } catch { /* fall through */ }
    }
  }
  return '1.0.0';
}


export function buildContext(): AppContext {
  const projectRoot = getProjectRoot();
  const loader = new ConfigLoader();

  let config!: AgenticConfig;
  try {
    config = loader.load(projectRoot);
  } catch (err) {
    config = {
      version: '1.0.0',
      skills: {},
      state: {
        sessionFile: 'SESSION_STATE.md',
        notesFile: 'NOTES.md',
        contextFile: 'CONTEXT.md',
        rulesFile: 'CLAUDE.md',
      },
      ide: 'auto' as const,
      registry: 'https://registry.agentic-skill.dev',
    };
  }

  return {
    config,
    projectRoot,
    cliVersion: getCliVersion(),
  };
}
