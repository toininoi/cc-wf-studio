/**
 * `ccwf run <file>` — plan + write a workflow's `.claude/*` files into cwd.
 *
 * Phase 4a: file-write only. The command produces:
 *   - .claude/agents/<sub-agent>.md for inline SubAgent nodes
 *   - .claude/agents/<workflow>_<flow>.md for SubAgentFlow definitions
 *   - .claude/commands/<workflow>.md for the SlashCommand entry
 * and then prints a follow-up instruction on stdout. Launching `claude` is
 * deferred to Phase 4b (`--launch` flag).
 *
 * `--overwrite` is required when any of the target files already exist; this
 * guards against accidentally clobbering hand-edited agents.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { type PlannedExportFile, nodeNameToFileName, planWorkflowExportFiles } from '@cc-wf-studio/core';
import { Command } from 'commander';
import { WorkflowLoadError, loadWorkflowFromFile } from '../utils/load-workflow.js';

interface RunOptions {
  overwrite: boolean;
  /** Project root to write into. Defaults to `process.cwd()`. */
  cwd?: string;
}

function resolvePlanned(rootDir: string, file: PlannedExportFile): string {
  return path.join(rootDir, ...file.relativePath.split('/'));
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Materialise a workflow as .claude/agents and .claude/commands files in cwd.')
    .argument('<file>', 'Path to a workflow JSON file.')
    .option('--overwrite', 'Overwrite existing files instead of erroring.', false)
    .option(
      '--cwd <dir>',
      'Project root to write into. Defaults to process.cwd(). Useful for tests.'
    )
    .action(async (file: string, options: RunOptions) => {
      try {
        const { workflow } = await loadWorkflowFromFile(file);
        const rootDir = path.resolve(options.cwd ?? process.cwd());
        const plan = planWorkflowExportFiles(workflow);

        if (!options.overwrite) {
          const conflicts: string[] = [];
          for (const planned of plan) {
            const absPath = resolvePlanned(rootDir, planned);
            if (await pathExists(absPath)) {
              conflicts.push(absPath);
            }
          }
          if (conflicts.length > 0) {
            process.stderr.write(
              `error: ${conflicts.length} file(s) already exist. Pass --overwrite to replace them:\n`
            );
            for (const absPath of conflicts) {
              process.stderr.write(`  - ${absPath}\n`);
            }
            process.exit(1);
          }
        }

        const writtenPaths: string[] = [];
        const ensuredDirs = new Set<string>();
        for (const planned of plan) {
          const absPath = resolvePlanned(rootDir, planned);
          const dir = path.dirname(absPath);
          if (!ensuredDirs.has(dir)) {
            await fs.mkdir(dir, { recursive: true });
            ensuredDirs.add(dir);
          }
          await fs.writeFile(absPath, planned.contents, 'utf-8');
          writtenPaths.push(absPath);
        }

        const slashName = nodeNameToFileName(workflow.name);
        process.stdout.write(`✓ Wrote ${writtenPaths.length} file(s):\n`);
        for (const writtenPath of writtenPaths) {
          process.stdout.write(`  - ${path.relative(rootDir, writtenPath)}\n`);
        }
        process.stdout.write(
          `\nNext: launch Claude Code in ${rootDir} and run \`/${slashName}\`.\n`
        );
      } catch (error) {
        if (error instanceof WorkflowLoadError) {
          process.stderr.write(`error: ${error.message}\n`);
          process.exit(error.exitCode);
        }
        throw error;
      }
    });
}
