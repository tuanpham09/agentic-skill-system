import { z } from 'zod';
import type { DetectedLanguage } from '../types/index.js';

export const agenticConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  skills: z.record(z.string()).default({}),
  state: z.object({
    sessionFile: z.string().default('SESSION_STATE.md'),
    notesFile: z.string().default('NOTES.md'),
    contextFile: z.string().default('CONTEXT.md'),
    rulesFile: z.string().default('CLAUDE.md'),
  }).default({}),
  ide: z.enum(['opencode', 'copilot', 'claude', 'codex', 'cursor', 'windsurf', 'auto']).default('auto'),
  registry: z.string().url().default('https://registry.agentic-skill.dev'),
  project: z.object({
    name: z.string(),
    type: z.enum(['new', 'existing']),
    language: z.enum([
  'typescript', 'javascript', 'python', 'go', 'rust',
  'java', 'php', 'ruby', 'csharp', 'swift', 'kotlin', 'dart', 'unknown'
] as const),
    framework: z.string().optional(),
    description: z.string().optional(),
    docsPath: z.string().default('.agentic/docs'),
    openspecPath: z.string().default('.agentic/openspec'),
    boardPath: z.string().default('.agentic/board.json'),
    phasesPath: z.string().default('.agentic/phases.json'),
    initializedAt: z.string(),
    ideGuide: z.string().optional(),
  }).optional(),
});

export type AgenticConfig = z.infer<typeof agenticConfigSchema>;
