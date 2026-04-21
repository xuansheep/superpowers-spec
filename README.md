# My Superpowers

[English](./README.md) | [中文](./README_ZH.md)

`superpowers-spec` is a fork of [obra/superpowers](https://github.com/obra/superpowers), maintained for the workflows, constraints, and tooling expectations used in this repository.

The fork repository is:
https://github.com/xuansheep/superpowers-spec

The plugin install name and skill namespace remain `superpowers` for compatibility with existing agent plugin systems and skill invocation examples.

Original upstream README:
https://github.com/obra/superpowers/blob/main/README.md

## What This Fork Is

This fork keeps the core Superpowers idea: a coding agent should use composable skills and workflow guardrails to clarify intent, design first, write a concrete plan, implement in a structured way, and verify the result before claiming success.

## Major Differences From Upstream

1. **Repository source changed**
   Installation instructions in this README point to `xuansheep/superpowers-spec` where the platform supports installing from a Git repository.

2. **Plugin name remains compatible**
   The repository is named `superpowers-spec`, but the Claude Code, Cursor, OpenCode, Gemini, and skill-facing plugin namespace remains `superpowers`. Renaming the plugin namespace everywhere would break existing usage for no good reason. That kind of churn is how people create their own outage and then act surprised.

3. **Added spec bootstrap capabilities**
   This fork adds `spec-init` (with legacy alias `setup`), `spec-update`, `reading-spec`, and supporting scripts/tests for initializing and consuming repository-level spec structures.

4. **Localized execution and review workflow changes**
   Skills such as `executing-plans`, `requesting-code-review`, and `subagent-driven-development` have been adjusted in this fork to fit the current workflow.

5. **Fork-maintained documentation and install entrypoints**
   This README documents how to use this fork directly, rather than treating upstream distribution channels as the only path.

## Installation

The repository path is `xuansheep/superpowers-spec`. The plugin name or namespace users reference remains `superpowers`.

### Claude Code

For normal Claude Code users, install the official Superpowers marketplace plugin:

```text
/plugin marketplace add xuansheep/superpowers-spec
/plugin install superpowers@superpowers-spec
```

For local development or testing of this fork, run Claude Code with this repository as the plugin directory:

```bash
claude --plugin-dir /path/to/superpowers-spec
```

When running from this repository, the local Claude plugin metadata is under `.claude-plugin/` and still exposes the plugin as `superpowers`.

### Cursor

Install this fork from the current repository:

```text
/add-plugin https://github.com/xuansheep/superpowers-spec
```

Cursor uses `.cursor-plugin/plugin.json`; the plugin name is kept as `superpowers` while the source repository remains this fork.

### Codex

Tell Codex:

```text
Fetch and follow instructions from https://github.com/xuansheep/superpowers-spec/blob/main/.codex/INSTALL.md
```

Manual install:

```bash
git clone https://github.com/xuansheep/superpowers-spec.git ~/.codex/superpowers
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
```

Windows (PowerShell):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
```

### OpenCode

Add this to the `plugin` array in `opencode.json`:

```json
{
  "plugin": ["superpowers@git+https://github.com/xuansheep/superpowers-spec.git"]
}
```

To pin to a specific Git ref or tag, use for example:

```json
{
  "plugin": ["superpowers@git+https://github.com/xuansheep/superpowers-spec.git#main"]
}
```

### Gemini CLI

```bash
gemini extensions install https://github.com/xuansheep/superpowers-spec
```

Update:

```bash
gemini extensions update superpowers
```

### Generic source install

If your agent platform supports loading skills from a local directory, clone this repository and expose its `skills/` directory to that platform.

```bash
git clone https://github.com/xuansheep/superpowers-spec.git
```

Use `superpowers` as the plugin or skills namespace unless your platform requires a different local alias.

## Verify Installation

Start a new session and ask the agent to perform something that should trigger a workflow, such as planning a feature, debugging an issue systematically, or reading specs before implementation.

If installation is working, the agent should invoke the relevant skill workflow instead of jumping straight into unstructured code changes.

## Workflow Overview

1. `brainstorming`
2. `using-git-worktrees`
3. `writing-plans`
4. `subagent-driven-development` or `executing-plans`
5. `test-driven-development`
6. `requesting-code-review`
7. `finishing-a-development-branch`

## Key Skills

- Testing: `test-driven-development`
- Debugging: `systematic-debugging`, `verification-before-completion`
- Collaboration: `brainstorming`, `writing-plans`, `executing-plans`, `dispatching-parallel-agents`, `requesting-code-review`, `receiving-code-review`, `using-git-worktrees`, `finishing-a-development-branch`, `subagent-driven-development`
- Spec bootstrap: `spec-init`, `spec-update`, `setup` (legacy alias), `reading-spec`
- Meta: `writing-skills`, `using-superpowers`

## Spec Update Workflow

- `spec-update` now checks whether `.agents/spec` exists before doing anything else.
- `spec-update` reads existing spec files, gathers committed git changes from the relevant spec time window, and emits an update plan for review.
- `spec-update` does not directly apply updates from the CLI command; updates are applied only after the plan is reviewed and approved.

## Philosophy

- Test-driven development
- Systematic workflows over ad-hoc moves
- Complexity reduction
- Evidence before claims

## Contributing

Extend this fork by updating skills, scripts, or workflow docs in this repository and testing them appropriately before opening a PR.

## Updating

### Claude Code official marketplace install

```text
/plugin update superpowers@superpowers-spec
```

### Claude Code local plugin directory

```bash
cd /path/to/superpowers-spec && git pull
```

### Cursor

Refresh or reinstall the plugin from the Cursor plugin UI after pulling the latest repository changes.

### Codex local clone

```bash
cd ~/.codex/superpowers && git pull
```

### OpenCode

Restart OpenCode to refresh plugin updates, or follow your platform's dependency refresh workflow.

### Gemini CLI

```bash
gemini extensions update superpowers
```

## License

MIT License. See `LICENSE`.

## Support

- Issues: https://github.com/xuansheep/superpowers-spec/issues
- Repository: https://github.com/xuansheep/superpowers-spec
