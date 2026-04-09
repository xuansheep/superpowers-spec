# My Superpowers

[English](./README.md) | [中文](./README_ZH.md)

`my-superpowers` is a fork of [obra/superpowers](https://github.com/obra/superpowers), maintained for the workflows, constraints, and tooling expectations used in this repository.

Original upstream README:
https://github.com/obra/superpowers/blob/main/README.md

## What This Fork Is

This fork keeps the core Superpowers idea: a coding agent should use composable skills and workflow guardrails to clarify intent, design first, write a concrete plan, implement in a structured way, and verify the result before claiming success.

## Major Differences From Upstream

1. **Repository source changed**
   Installation instructions in this README point to `xuansheep/my-superpowers` instead of sending users to the upstream repository.

2. **Added spec bootstrap capabilities**
   This fork adds `setup`, `reading-spec`, and supporting scripts/tests for initializing and consuming repository-level spec structures.

3. **Localized execution and review workflow changes**
   Skills such as `executing-plans`, `requesting-code-review`, and `subagent-driven-development` have been adjusted in this fork to fit the current workflow.

4. **Fork-maintained documentation and install entrypoints**
   This README documents how to use this fork directly, rather than treating upstream distribution channels as the default path.

## Installation

All installation examples below use the current repository address.

### Codex

Tell Codex:

```text
Fetch and follow instructions from https://github.com/xuansheep/my-superpowers/blob/main/.codex/INSTALL.md
```

Manual install:

```bash
git clone https://github.com/xuansheep/my-superpowers.git ~/.codex/superpowers
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
  "plugin": ["superpowers@git+https://github.com/xuansheep/my-superpowers.git"]
}
```

To pin to a specific Git ref or tag, use for example:

```json
{
  "plugin": ["superpowers@git+https://github.com/xuansheep/my-superpowers.git#main"]
}
```

### Gemini CLI

```bash
gemini extensions install https://github.com/xuansheep/my-superpowers
```

Update:

```bash
gemini extensions update superpowers
```

### Generic source install

If your agent platform supports loading skills from a local directory, clone this repository and expose its `skills/` directory to that platform.

```bash
git clone https://github.com/xuansheep/my-superpowers.git
```

## Verify Installation

Start a new session and ask the agent to perform something that should trigger a workflow, such as planning a feature, debugging an issue systematically, or reading specs before implementation.

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
- Spec & setup: `setup`, `reading-spec`
- Meta: `writing-skills`, `using-superpowers`

## Philosophy

- Test-driven development
- Systematic workflows over ad-hoc moves
- Complexity reduction
- Evidence before claims

## Contributing

Extend this fork by updating skills, scripts, or workflow docs in this repository and testing them appropriately before opening a PR.

## Updating

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

- Issues: https://github.com/xuansheep/my-superpowers/issues
- Repository: https://github.com/xuansheep/my-superpowers
