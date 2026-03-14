import chalk from 'chalk';

export const logger = {
  info:    (msg: string): void => { process.stdout.write(chalk.blue('ℹ') + ' ' + msg + '\n'); },
  success: (msg: string): void => { process.stdout.write(chalk.green('✓') + ' ' + msg + '\n'); },
  warn:    (msg: string): void => { process.stdout.write(chalk.yellow('⚠') + ' ' + msg + '\n'); },
  error:   (msg: string): void => { process.stderr.write(chalk.red('✗') + ' ' + msg + '\n'); },
  hint:    (msg: string): void => { process.stdout.write(chalk.gray('→') + ' ' + msg + '\n'); },
  plain:   (msg: string): void => { process.stdout.write(msg + '\n'); },
  newline: ():            void => { process.stdout.write('\n'); },

  /** Print a divider line */
  divider: (): void => {
    process.stdout.write(chalk.gray('─'.repeat(60)) + '\n');
  },

  /** Print a section header */
  section: (title: string): void => {
    process.stdout.write('\n' + chalk.bold(title) + '\n');
    process.stdout.write(chalk.gray('─'.repeat(Math.min(title.length + 2, 60))) + '\n');
  },

  /** Print a table row with fixed-width columns */
  row: (cols: string[], widths: number[]): void => {
    const line = cols
      .map((col, i) => col.padEnd(widths[i] ?? 16))
      .join('  ');
    process.stdout.write(line + '\n');
  },
};
