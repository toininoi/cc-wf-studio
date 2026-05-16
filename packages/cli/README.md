# @cc-wf-studio/cli

Command-line tool (`ccwf`) for [cc-wf-studio](https://github.com/breaking-brake/cc-wf-studio) workflows. Renders, validates, materialises, and serves a workflow JSON from a terminal — no VSCode required.

## Install

```sh
# Run without installing
npx @cc-wf-studio/cli --help

# Or install locally
pnpm add -D @cc-wf-studio/cli
```

## Subcommands

| Command | Description |
|---|---|
| `ccwf render <file>` | Print a Mermaid + execution-instructions Markdown bundle to stdout. |
| `ccwf validate <file>` | Schema-check the workflow JSON. Exit 0/1. `--json` for machine-readable output. |
| `ccwf mcp --file <file>` | Run the cc-wf-studio stdio MCP server in-process against `<file>`. |
| `ccwf run <file>` | Materialise the workflow into `<cwd>/.claude/agents/*.md` and `<cwd>/.claude/commands/<workflow>.md`. |

### `ccwf render`

```sh
ccwf render ./.vscode/workflows/my-workflow.json            # Markdown (default)
ccwf render ./.vscode/workflows/my-workflow.json -f mermaid # ```mermaid block only
```

### `ccwf validate`

```sh
ccwf validate ./.vscode/workflows/my-workflow.json          # exit 0/1
ccwf validate ./.vscode/workflows/my-workflow.json --json   # prints { valid, errors[] }
```

### `ccwf mcp`

```sh
ccwf mcp --file ./.vscode/workflows/my-workflow.json
```

Speaks stdio MCP. Point an MCP client (Claude Code, MCP Inspector, …) at it. Equivalent to the standalone `ccwf-mcp` bin shipped by `@cc-wf-studio/mcp` — same factory, same tools.

Example `.mcp.json`:

```json
{
  "servers": {
    "cc-wf-studio": {
      "type": "stdio",
      "command": "npx",
      "args": ["@cc-wf-studio/cli", "mcp", "--file", ".vscode/workflows/my-workflow.json"]
    }
  }
}
```

### `ccwf run`

```sh
ccwf run ./.vscode/workflows/my-workflow.json               # write into cwd
ccwf run ./.vscode/workflows/my-workflow.json --overwrite   # replace existing files
ccwf run ./my-workflow.json --cwd /tmp/my-project           # write into a different root
```

Refuses to clobber existing `.claude/*` files unless `--overwrite` is passed. After writing, prints the slash-command name to invoke from within Claude Code (`/<workflow-name>`).

`--launch` (auto-spawn `claude`) is planned for Phase 4b. For now, run `ccwf run`, then launch Claude Code yourself.

## Fixtures

`fixtures/sample-workflow.json` is a minimal, schema-valid workflow that backs the smoke tests in this package's README examples.

## Development

Inside the monorepo, three invocation paths are available:

```sh
# 1. tsx — runs straight from src, no rebuild required (fastest iteration)
pnpm ccwf:dev render packages/cli/fixtures/sample-workflow.json

# 2. built dist — exercises the actual published code path
pnpm -F @cc-wf-studio/cli build
pnpm ccwf render packages/cli/fixtures/sample-workflow.json

# 3. via the hoisted bin — same as path 2, but uses the linked bin under node_modules/.bin
pnpm exec ccwf render packages/cli/fixtures/sample-workflow.json
```

Use `ccwf:dev` while iterating on a subcommand; use `ccwf` (built) before pushing to confirm the bin shipped under `dist/` still works.

## License

AGPL-3.0-or-later. See [LICENSE](https://github.com/breaking-brake/cc-wf-studio/blob/main/LICENSE).
