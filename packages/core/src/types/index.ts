// ─── Base types ───────────────────────────────────────────────────────────────
export type AgentType = 'claude' | 'opencode' | 'copilot' | 'codex' | 'cursor' | 'windsurf' | 'all';

export interface SkillMeta {
  name: string; version: string; description: string; author: string; license: string;
  keywords: string[]; agentTypes: AgentType[]; minCliVersion: string;
  dependencies: Record<string, string>; triggers?: string[];
}
export interface SkillSummary { name: string; version: string; description: string; scope: 'local' | 'global' | 'bundled'; path: string; }
export type ValidationResult = { valid: true } | { valid: false; errors: string[] };
export interface InstallOptions { local?: boolean; version?: string; dev?: boolean; }
export interface InstallResult { name: string; version: string; path: string; scope: 'local' | 'global'; }
export type SessionStatus = 'not-started' | 'in-progress' | 'blocked' | 'review' | 'done' | 'saved';
export interface SessionState { currentSprint: string; currentTask: string; status: SessionStatus; lastUpdated: string; blockers: string[]; nextSteps: string[]; }
export interface AgenticConfig {
  version: string; skills: Record<string, string>;
  state: { sessionFile: string; notesFile: string; contextFile: string; rulesFile: string; };
  ide: 'opencode' | 'copilot' | 'claude' | 'codex' | 'cursor' | 'windsurf' | 'auto';
  registry: string; project?: ProjectConfig;
}
export interface AgentContext { sessionState: string; notes: string; rules: string; skills: SkillSummary[]; projectSnapshot: string; projectName: string; }
export interface AppContext { config: AgenticConfig; projectRoot: string; cliVersion: string; }
export interface RegistrySearchResult { name: string; version: string; description: string; author: string; downloads: number; updatedAt: string; }
export interface RegistryResolveResult { name: string; version: string; meta: SkillMeta; downloadUrl: string; integrity: string; }
export type SpecStatus = 'proposal' | 'design' | 'active' | 'archived';
export interface SpecMeta { title: string; status: SpecStatus; proposedBy: string; createdAt: string; }

// ─── NEW: Project types ───────────────────────────────────────────────────────
export type ProjectType = 'new' | 'existing';
export type DetectedLanguage = 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'java' | 'php' | 'ruby' | 'csharp' | 'swift' | 'kotlin' | 'dart' | 'unknown';
export interface ProjectConfig { name: string; type: ProjectType; language: DetectedLanguage; framework?: string; description?: string; docsPath: string; openspecPath: string; boardPath: string; phasesPath: string; initializedAt: string; ideGuide?: string; }
export interface LanguageProfile { language: DetectedLanguage; framework?: string; packageManager: string; testCommand: string; buildCommand: string; lintCommand: string; runCommand: string; installCommand: string; testFilePattern: string; configFiles: string[]; }
export interface TechStackItem { name: string; version?: string; category: 'language' | 'framework' | 'database' | 'cache' | 'queue' | 'auth' | 'testing' | 'build' | 'other'; }
export interface ProjectScanResult { language: DetectedLanguage; framework?: string; profile: LanguageProfile; existingFeatures: string[]; techStack: TechStackItem[]; packageName?: string; description?: string; hasTests: boolean; hasDocker: boolean; hasCi: boolean; estimatedSize: 'small' | 'medium' | 'large'; }

// ─── NEW: Kanban types ────────────────────────────────────────────────────────
export type KanbanStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
export interface KanbanTask { id: string; title: string; description?: string; status: KanbanStatus; phase: string; priority: 'P0' | 'P1' | 'P2' | 'P3'; assignedTo?: string; tags: string[]; createdAt: string; updatedAt: string; completedAt?: string; feature?: string; }
export interface KanbanBoard { projectName: string; currentPhase: string; lastUpdated: string; tasks: KanbanTask[]; completedPhases: string[]; }

// ─── NEW: Phase types ─────────────────────────────────────────────────────────
export type PhaseStatus = 'planned' | 'active' | 'completed' | 'skipped';
export interface Phase { id: string; name: string; status: PhaseStatus; goal: string; startedAt?: string; completedAt?: string; tasks: string[]; acceptanceCriteria: string[]; completionNotes?: string; }
export interface PhasePlan { projectName: string; phases: Phase[]; currentPhaseId: string; lastUpdated: string; }
