# My Superpowers 中文说明

[English](./README.md) | [中文](./README_ZH.md)

`superpowers-spec` 是基于 [obra/superpowers](https://github.com/obra/superpowers) 的一个 fork，用于维护和扩展适配当前仓库工作流、约束和工具使用预期的 Superpowers skills。

当前 fork 仓库地址：
https://github.com/xuansheep/superpowers-spec

为了兼容现有 agent 插件系统和 skill 调用方式，插件安装名和技能命名空间仍然保持为 `superpowers`。

原项目 README：
https://github.com/obra/superpowers/blob/main/README.md

## 这是什么

这个 fork 延续了 Superpowers 的核心思路：让 coding agent 通过一组可组合的 skills 和工作流约束，先澄清目标、先做设计、再写出明确计划、按结构化方式实现，并在宣称完成之前完成验证。

## 与上游的主要差异

1. **仓库来源已切换**
   在支持通过 Git 仓库安装的平台上，README 中的安装入口统一指向 `xuansheep/superpowers-spec`。

2. **插件命名空间保持兼容**
   当前仓库名是 `superpowers-spec`，但 Claude Code、Cursor、OpenCode、Gemini 以及技能调用相关的插件命名空间仍为 `superpowers`，以保持现有使用方式兼容。

3. **新增 spec bootstrap 能力**
   本 fork 增加了 `spec-init`（兼容旧别名 `setup`）、`spec-update`、`reading-spec` 以及配套脚本和测试，用于初始化和使用仓库级 spec 结构。

4. **执行与评审流程有本地化调整**
   `executing-plans`、`requesting-code-review`、`subagent-driven-development` 等技能在本仓库中做了调整，以适配当前维护方式和工作流要求。

5. **文档与安装入口按当前 fork 维护**
   这份 README 直接说明如何使用当前 fork，而不是只把上游发布渠道视为唯一入口。

## 安装方式

仓库路径是 `xuansheep/superpowers-spec`，但用户引用的插件名或技能命名空间仍是 `superpowers`。

### Claude Code

对于普通 Claude Code 用户，安装当前 fork 对应的 Superpowers marketplace 插件：

```text
/plugin marketplace add xuansheep/superpowers-spec
/plugin install superpowers@superpowers-spec
```

如果要对当前 fork 做本地开发或测试，可以让 Claude Code 直接使用这个仓库作为插件目录：

```bash
claude --plugin-dir /path/to/superpowers-spec
```

当 Claude Code 从当前仓库运行时，本地插件元数据位于 `.claude-plugin/`，对外暴露的插件名仍然是 `superpowers`。

### Cursor

从当前仓库安装这个 fork：

```text
/add-plugin https://github.com/xuansheep/superpowers-spec
```

Cursor 使用 `.cursor-plugin/plugin.json`；插件名仍然保持为 `superpowers`，但源码仓库是当前 fork。

### Codex

告诉 Codex：

```text
Fetch and follow instructions from https://github.com/xuansheep/superpowers-spec/blob/main/.codex/INSTALL.md
```

手动安装：

```bash
git clone https://github.com/xuansheep/superpowers-spec.git ~/.codex/superpowers
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
```

Windows（PowerShell）：

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
```

### OpenCode

在 `opencode.json` 的 `plugin` 数组中加入：

```json
{
  "plugin": ["superpowers@git+https://github.com/xuansheep/superpowers-spec.git"]
}
```

如果需要固定版本，可以指定 Git 引用或 tag，例如：

```json
{
  "plugin": ["superpowers@git+https://github.com/xuansheep/superpowers-spec.git#main"]
}
```

### Gemini CLI

```bash
gemini extensions install https://github.com/xuansheep/superpowers-spec
```

更新：

```bash
gemini extensions update superpowers
```

### 通用源码安装方式

如果你的 agent 平台支持从本地目录加载 skills，可以直接克隆仓库并将其中的 `skills/` 目录暴露给平台：

```bash
git clone https://github.com/xuansheep/superpowers-spec.git
```

除非平台要求不同的本地别名，否则插件或技能命名空间仍建议使用 `superpowers`。

## 验证安装

启动一个新会话，然后让 agent 处理一个应当触发 workflow 的任务，例如规划功能、系统化排查问题，或者在实现前先读取 spec。

如果安装正常，agent 应该会调用相关的 skill workflow，而不是直接跳进无结构的代码修改。

## 基本工作流

1. `brainstorming`
2. `using-git-worktrees`
3. `writing-plans`
4. `subagent-driven-development` 或 `executing-plans`
5. `test-driven-development`
6. `requesting-code-review`
7. `finishing-a-development-branch`

## 主要技能

- 测试：`test-driven-development`
- 调试：`systematic-debugging`、`verification-before-completion`
- 协作：`brainstorming`、`writing-plans`、`executing-plans`、`dispatching-parallel-agents`、`requesting-code-review`、`receiving-code-review`、`using-git-worktrees`、`finishing-a-development-branch`、`subagent-driven-development`
- Spec bootstrap：`spec-init`、`spec-update`、`setup`（旧别名）、`reading-spec`
- 元技能：`writing-skills`、`using-superpowers`

## Spec 更新工作流

- `spec-update` 现在会先检查 `.agents/spec` 是否存在。
- `spec-update` 会读取现有 spec 文件，收集相关时间窗内的已提交 git 变更，并生成一份更新计划供审核。
- `spec-update` 的 CLI 不直接应用更新；只有计划审核通过后，后续流程才允许执行保守更新。

## 理念

- Test-driven development
- Systematic workflows over ad-hoc moves
- Complexity reduction
- Evidence before claims

## 贡献

如果你要在这个 fork 上继续扩展技能、脚本或工作流文档，请在当前仓库中完成修改并做好相应测试后再提交 PR。

## 更新

### Claude Code 官方 marketplace 安装

```text
/plugin update superpowers@superpowers-spec
```

### Claude Code 本地插件目录

```bash
cd /path/to/superpowers-spec && git pull
```

### Cursor

拉取仓库最新改动后，在 Cursor 插件界面中刷新或重新安装插件。

### Codex 本地 clone

```bash
cd ~/.codex/superpowers && git pull
```

### OpenCode

重启 OpenCode 以拉取插件更新，或按平台机制刷新依赖。

### Gemini CLI

```bash
gemini extensions update superpowers
```

## 许可证

MIT License。详见 `LICENSE`。

## 支持

- Issues: https://github.com/xuansheep/superpowers-spec/issues
- Repository: https://github.com/xuansheep/superpowers-spec
