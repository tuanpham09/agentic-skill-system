import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { DetectedLanguage, LanguageProfile, ProjectScanResult, TechStackItem } from '../types/index.js';

// ─── Language profiles ────────────────────────────────────────────────────────

const PROFILES: Record<DetectedLanguage, LanguageProfile> = {
  typescript: {
    language: 'typescript', packageManager: 'pnpm', framework: undefined,
    testCommand: 'pnpm test', buildCommand: 'pnpm build', lintCommand: 'pnpm lint',
    runCommand: 'pnpm dev', installCommand: 'pnpm install',
    testFilePattern: '**/*.test.ts', configFiles: ['tsconfig.json', 'package.json'],
  },
  javascript: {
    language: 'javascript', packageManager: 'npm', framework: undefined,
    testCommand: 'npm test', buildCommand: 'npm run build', lintCommand: 'npm run lint',
    runCommand: 'npm start', installCommand: 'npm install',
    testFilePattern: '**/*.test.js', configFiles: ['package.json'],
  },
  python: {
    language: 'python', packageManager: 'pip', framework: undefined,
    testCommand: 'pytest', buildCommand: 'python -m build', lintCommand: 'ruff check .',
    runCommand: 'python main.py', installCommand: 'pip install -r requirements.txt',
    testFilePattern: 'test_*.py', configFiles: ['requirements.txt', 'pyproject.toml', 'setup.py'],
  },
  go: {
    language: 'go', packageManager: 'go mod', framework: undefined,
    testCommand: 'go test ./...', buildCommand: 'go build ./...', lintCommand: 'golangci-lint run',
    runCommand: 'go run .', installCommand: 'go mod tidy',
    testFilePattern: '*_test.go', configFiles: ['go.mod', 'go.sum'],
  },
  rust: {
    language: 'rust', packageManager: 'cargo', framework: undefined,
    testCommand: 'cargo test', buildCommand: 'cargo build', lintCommand: 'cargo clippy',
    runCommand: 'cargo run', installCommand: 'cargo build',
    testFilePattern: '**/tests/*.rs', configFiles: ['Cargo.toml', 'Cargo.lock'],
  },
  java: {
    language: 'java', packageManager: 'maven', framework: undefined,
    testCommand: 'mvn test', buildCommand: 'mvn package', lintCommand: 'mvn checkstyle:check',
    runCommand: 'mvn spring-boot:run', installCommand: 'mvn install',
    testFilePattern: '**/*Test.java', configFiles: ['pom.xml', 'build.gradle'],
  },
  php: {
    language: 'php', packageManager: 'composer', framework: undefined,
    testCommand: './vendor/bin/phpunit', buildCommand: 'composer install --no-dev',
    lintCommand: './vendor/bin/phpcs', runCommand: 'php artisan serve',
    installCommand: 'composer install', testFilePattern: '**/*Test.php',
    configFiles: ['composer.json', 'composer.lock'],
  },
  ruby: {
    language: 'ruby', packageManager: 'bundler', framework: undefined,
    testCommand: 'bundle exec rspec', buildCommand: 'bundle exec rake assets:precompile',
    lintCommand: 'bundle exec rubocop', runCommand: 'bundle exec rails server',
    installCommand: 'bundle install', testFilePattern: '**/*_spec.rb',
    configFiles: ['Gemfile', 'Gemfile.lock'],
  },
  csharp: {
    language: 'csharp', packageManager: 'dotnet', framework: undefined,
    testCommand: 'dotnet test', buildCommand: 'dotnet build', lintCommand: 'dotnet format --verify-no-changes',
    runCommand: 'dotnet run', installCommand: 'dotnet restore',
    testFilePattern: '**/*Tests.cs', configFiles: ['*.csproj', '*.sln'],
  },
  swift: {
    language: 'swift', packageManager: 'swift package', framework: undefined,
    testCommand: 'swift test', buildCommand: 'swift build', lintCommand: 'swiftlint',
    runCommand: 'swift run', installCommand: 'swift package resolve',
    testFilePattern: '**/*Tests.swift', configFiles: ['Package.swift'],
  },
  kotlin: {
    language: 'kotlin', packageManager: 'gradle', framework: undefined,
    testCommand: './gradlew test', buildCommand: './gradlew build', lintCommand: './gradlew ktlintCheck',
    runCommand: './gradlew run', installCommand: './gradlew dependencies',
    testFilePattern: '**/*Test.kt', configFiles: ['build.gradle.kts', 'settings.gradle.kts'],
  },
  dart: {
    language: 'dart', packageManager: 'pub', framework: 'flutter',
    testCommand: 'flutter test', buildCommand: 'flutter build', lintCommand: 'dart analyze',
    runCommand: 'flutter run', installCommand: 'flutter pub get',
    testFilePattern: '**/*_test.dart', configFiles: ['pubspec.yaml'],
  },
  unknown: {
    language: 'unknown', packageManager: 'unknown', framework: undefined,
    testCommand: 'make test', buildCommand: 'make build', lintCommand: 'make lint',
    runCommand: 'make run', installCommand: 'make install',
    testFilePattern: '**/*.test.*', configFiles: ['Makefile'],
  },
};

// ─── Detection logic ──────────────────────────────────────────────────────────

const DETECTION_SIGNALS: Array<{ files: string[]; language: DetectedLanguage }> = [
  { files: ['tsconfig.json'],                         language: 'typescript' },
  { files: ['package.json'],                          language: 'javascript' },
  { files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'], language: 'python' },
  { files: ['go.mod'],                                language: 'go' },
  { files: ['Cargo.toml'],                            language: 'rust' },
  { files: ['pom.xml', 'build.gradle'],               language: 'java' },
  { files: ['composer.json'],                         language: 'php' },
  { files: ['Gemfile'],                               language: 'ruby' },
  { files: ['*.csproj', '*.sln'],                     language: 'csharp' },
  { files: ['Package.swift'],                         language: 'swift' },
  { files: ['build.gradle.kts', 'settings.gradle.kts'], language: 'kotlin' },
  { files: ['pubspec.yaml'],                          language: 'dart' },
];

const FRAMEWORK_SIGNALS: Record<string, { deps: string[]; framework: string }[]> = {
  typescript: [
    { deps: ['next'], framework: 'nextjs' },
    { deps: ['nuxt'], framework: 'nuxtjs' },
    { deps: ['@nestjs/core'], framework: 'nestjs' },
    { deps: ['express'], framework: 'express' },
    { deps: ['fastify'], framework: 'fastify' },
    { deps: ['react'], framework: 'react' },
    { deps: ['vue'], framework: 'vue' },
    { deps: ['svelte'], framework: 'svelte' },
    { deps: ['electron'], framework: 'electron' },
  ],
  javascript: [
    { deps: ['next'], framework: 'nextjs' },
    { deps: ['express'], framework: 'express' },
    { deps: ['react'], framework: 'react' },
    { deps: ['vue'], framework: 'vue' },
  ],
  python: [
    { deps: ['fastapi'], framework: 'fastapi' },
    { deps: ['django'], framework: 'django' },
    { deps: ['flask'], framework: 'flask' },
    { deps: ['tornado'], framework: 'tornado' },
  ],
  php: [
    { deps: ['laravel/framework'], framework: 'laravel' },
    { deps: ['symfony/symfony'], framework: 'symfony' },
  ],
  ruby: [
    { deps: ['rails'], framework: 'rails' },
    { deps: ['sinatra'], framework: 'sinatra' },
  ],
  java: [
    { deps: ['spring-boot'], framework: 'springboot' },
    { deps: ['quarkus'], framework: 'quarkus' },
  ],
  dart: [
    { deps: ['flutter'], framework: 'flutter' },
  ],
};

const PACKAGE_MANAGER_SIGNALS: Record<string, string> = {
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lockb': 'bun',
  'package-lock.json': 'npm',
};

export class LanguageAdapter {
  detect(projectRoot: string): DetectedLanguage {
    const files = this.listTopLevel(projectRoot);

    for (const signal of DETECTION_SIGNALS) {
      const match = signal.files.some((f) => {
        if (f.includes('*')) {
          const ext = f.replace('*', '');
          return files.some((file) => file.endsWith(ext));
        }
        return files.includes(f);
      });
      if (match) return signal.language;
    }

    return 'unknown';
  }

  getProfile(projectRoot: string): LanguageProfile {
    const language = this.detect(projectRoot);
    const base = { ...PROFILES[language] };

    // Detect package manager
    const files = this.listTopLevel(projectRoot);
    for (const [lockfile, pm] of Object.entries(PACKAGE_MANAGER_SIGNALS)) {
      if (files.includes(lockfile)) {
        base.packageManager = pm;
        if (language === 'typescript' || language === 'javascript') {
          base.testCommand = `${pm} test`;
          base.buildCommand = `${pm} build`;
          base.installCommand = pm === 'npm' ? 'npm install' : `${pm} install`;
        }
        break;
      }
    }

    // Detect Gradle vs Maven for Java
    if (language === 'java') {
      if (files.includes('build.gradle') || files.includes('build.gradle.kts')) {
        base.packageManager = 'gradle';
        base.testCommand = './gradlew test';
        base.buildCommand = './gradlew build';
        base.installCommand = './gradlew dependencies';
      }
    }

    // Detect framework
    const framework = this.detectFramework(projectRoot, language);
    if (framework) {
      base.framework = framework;
      // Adjust run command for known frameworks
      if (framework === 'nextjs') base.runCommand = `${base.packageManager} dev` === 'pnpm dev' ? 'pnpm dev' : 'npm run dev';
      if (framework === 'laravel') base.runCommand = 'php artisan serve';
      if (framework === 'rails') base.runCommand = 'rails server';
      if (framework === 'springboot') base.runCommand = './gradlew bootRun';
    }

    return base;
  }

  scan(projectRoot: string): ProjectScanResult {
    const profile = this.getProfile(projectRoot);
    const files = this.listTopLevel(projectRoot);

    const techStack = this.detectTechStack(projectRoot, profile.language);
    const existingFeatures = this.detectFeatures(projectRoot, profile.language);

    return {
      language: profile.language,
      framework: profile.framework,
      profile,
      existingFeatures,
      techStack,
      packageName: this.detectPackageName(projectRoot),
      description: this.detectDescription(projectRoot),
      hasTests: this.hasTests(projectRoot, profile),
      hasDocker: files.includes('Dockerfile') || files.includes('docker-compose.yml'),
      hasCi: this.hasCi(projectRoot),
      estimatedSize: this.estimateSize(projectRoot),
    };
  }

  formatSkillVar(template: string, profile: LanguageProfile): string {
    return template
      .replace(/\{\{test_command\}\}/g, profile.testCommand)
      .replace(/\{\{build_command\}\}/g, profile.buildCommand)
      .replace(/\{\{lint_command\}\}/g, profile.lintCommand)
      .replace(/\{\{run_command\}\}/g, profile.runCommand)
      .replace(/\{\{install_command\}\}/g, profile.installCommand)
      .replace(/\{\{package_manager\}\}/g, profile.packageManager)
      .replace(/\{\{test_file_pattern\}\}/g, profile.testFilePattern)
      .replace(/\{\{language\}\}/g, profile.language)
      .replace(/\{\{framework\}\}/g, profile.framework ?? profile.language);
  }

  private detectFramework(projectRoot: string, language: DetectedLanguage): string | undefined {
    const signals = FRAMEWORK_SIGNALS[language];
    if (!signals) return undefined;

    // Check package.json dependencies
    const pkgPath = join(projectRoot, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        for (const signal of signals) {
          if (signal.deps.some((dep) => dep in allDeps)) {
            return signal.framework;
          }
        }
      } catch { /* ignore */ }
    }

    // Check Python requirements
    if (language === 'python') {
      const reqPath = join(projectRoot, 'requirements.txt');
      if (existsSync(reqPath)) {
        const reqs = readFileSync(reqPath, 'utf-8').toLowerCase();
        for (const signal of signals) {
          if (signal.deps.some((dep) => reqs.includes(dep))) {
            return signal.framework;
          }
        }
      }
    }

    return undefined;
  }

  private detectTechStack(projectRoot: string, language: DetectedLanguage): Array<{ name: string; version?: string; category: 'language' | 'framework' | 'database' | 'cache' | 'queue' | 'auth' | 'testing' | 'build' | 'other' }> {
    const stack: ReturnType<LanguageAdapter['detectTechStack']> = [];

    stack.push({ name: language, category: 'language' });

    const pkgPath = join(projectRoot, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        const KNOWN: Record<string, { category: typeof stack[0]['category'] }> = {
          'react': { category: 'framework' }, 'vue': { category: 'framework' },
          'next': { category: 'framework' }, 'express': { category: 'framework' },
          '@nestjs/core': { category: 'framework' }, 'fastify': { category: 'framework' },
          'pg': { category: 'database' }, 'mysql2': { category: 'database' },
          'mongoose': { category: 'database' }, 'prisma': { category: 'database' },
          'drizzle-orm': { category: 'database' }, 'redis': { category: 'cache' },
          'ioredis': { category: 'cache' }, 'bullmq': { category: 'queue' },
          'vitest': { category: 'testing' }, 'jest': { category: 'testing' },
          'pytest': { category: 'testing' }, 'jsonwebtoken': { category: 'auth' },
          'passport': { category: 'auth' }, 'better-auth': { category: 'auth' },
        };

        for (const [name, meta] of Object.entries(KNOWN)) {
          if (name in deps) {
            const ver = deps[name];
stack.push({ name, category: meta.category, ...(ver !== undefined && { version: ver }) });
          }
        }
      } catch { /* ignore */ }
    }

    return stack;
  }

  private detectFeatures(projectRoot: string, language: DetectedLanguage): string[] {
    const features: string[] = [];

    // Source directories
    const srcDirs = ['src', 'app', 'lib', 'api', 'server', 'client', 'pages', 'routes', 'controllers', 'models', 'services'];
    for (const dir of srcDirs) {
      if (existsSync(join(projectRoot, dir))) {
        features.push(dir);
      }
    }

    // Common feature files (REST API, auth, etc.)
    const featureSignals: Array<{ path: string; feature: string }> = [
      { path: 'src/auth', feature: 'Authentication' },
      { path: 'src/users', feature: 'User management' },
      { path: 'src/api', feature: 'REST API' },
      { path: 'src/dashboard', feature: 'Dashboard' },
      { path: 'src/payment', feature: 'Payments' },
      { path: 'src/notifications', feature: 'Notifications' },
      { path: 'database', feature: 'Database layer' },
      { path: 'migrations', feature: 'Database migrations' },
    ];
    for (const signal of featureSignals) {
      if (existsSync(join(projectRoot, signal.path))) {
        features.push(signal.feature);
      }
    }

    return [...new Set(features)];
  }

  private detectPackageName(projectRoot: string): string | undefined {
    const pkgPath = join(projectRoot, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { name?: string };
        return pkg.name;
      } catch { /* ignore */ }
    }
    return undefined;
  }

  private detectDescription(projectRoot: string): string | undefined {
    const pkgPath = join(projectRoot, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { description?: string };
        return pkg.description;
      } catch { /* ignore */ }
    }
    return undefined;
  }

  private hasTests(projectRoot: string, profile: LanguageProfile): boolean {
    const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs'];
    return testDirs.some((d) => existsSync(join(projectRoot, d)));
  }

  private hasCi(projectRoot: string): boolean {
    return (
      existsSync(join(projectRoot, '.github', 'workflows')) ||
      existsSync(join(projectRoot, '.gitlab-ci.yml')) ||
      existsSync(join(projectRoot, '.circleci'))
    );
  }

  private estimateSize(projectRoot: string): 'small' | 'medium' | 'large' {
    try {
      const srcDirs = ['src', 'app', 'lib'];
      let count = 0;
      for (const dir of srcDirs) {
        const full = join(projectRoot, dir);
        if (existsSync(full)) {
          count += this.countFiles(full);
        }
      }
      if (count < 20) return 'small';
      if (count < 100) return 'medium';
      return 'large';
    } catch {
      return 'small';
    }
  }

  private countFiles(dir: string): number {
    try {
      return readdirSync(dir, { recursive: true } as { recursive: boolean }).length;
    } catch {
      return 0;
    }
  }

  private listTopLevel(projectRoot: string): string[] {
    try {
      return readdirSync(projectRoot);
    } catch {
      return [];
    }
  }
}
