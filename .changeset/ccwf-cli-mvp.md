---
"@cc-wf-studio/cli": minor
"@cc-wf-studio/core": minor
"cc-wf-studio": patch
---

Introduce `@cc-wf-studio/cli`: a command-line entry (`ccwf`) for cc-wf-studio workflows. The initial release ships four subcommands:

- `ccwf render <file>` — print a `mermaid` + execution-instructions Markdown bundle to stdout (`--format mermaid` for the raw fenced block).
- `ccwf validate <file>` — schema-check via `validateAIGeneratedWorkflow` (exit 0/1, `--json` for CI consumption).
- `ccwf mcp --file <file>` — run the cc-wf-studio stdio MCP server in-process (equivalent to the standalone `ccwf-mcp` bin).
- `ccwf run <file>` — materialise the workflow into `<cwd>/.claude/agents/*.md` and `<cwd>/.claude/commands/<workflow>.md` (`--overwrite` required to replace existing files; auto-launching `claude` is deferred to a later release).

`@cc-wf-studio/core` exposes a new `services/workflow-export` module with the pure `.claude` file generators (`generateSubAgentFile`, `generateSubAgentFlowAgentFile`, `generateSlashCommandFile`, `escapeYamlString`, `validateClaudeFileFormat`, `nodeNameToFileName`) and a new `planWorkflowExportFiles(workflow): PlannedExportFile[]` pure planner that the CLI and the VSCode extension both consume. The VSCode extension's `export-service` is refactored to delegate to the planner; tool outputs, file names, and frontmatter remain byte-for-byte equivalent.
