# My Superpowers 中文说明

[English](./README.md) | [中文](./README_ZH.md)

`my-superpowers` 是基于 [obra/superpowers](https://github.com/obra/superpowers) 的一个 fork，用于维护和扩展适配当前仓库使用场景的 Superpowers skills 工作流。

原项目 README：
https://github.com/obra/superpowers/blob/main/README.md

## 这是什么

这个项目延续了 Superpowers 的核心思路：通过一组可组合的 skills 和启动指令，让 coding agent 在开始写代码前先澄清目标、形成设计、拆解计划、执行实现，并在过程中持续做验证和审查。

和直接让 agent 裸奔相比，这套流程更强调：

- 先设计再实现，而不是上来就乱写
- 真正的 TDD 和验证闭环，而不是“我觉得差不多”
- 结构化执行和审查，而不是走一步看一步
- 让 skills 成为默认工作方式，而不是可有可无的建议

## 与原项目的主要差异

相对于原始仓库 `obra/superpowers`，这个 fork 当前主要有这些差异：

1. **仓库来源已切换**
   README 中的安装入口统一改为当前仓库地址 `xuansheep/my-superpowers`，避免继续把用户引向原仓库。

2. **新增 spec 初始化相关能力**
   本仓库增加了 `spec-init`（兼容旧别名 `setup`）、`spec-update`、`reading-spec` 等 skills，以及配套脚本和测试，用于初始化和读取仓库级 spec 结构，方便在项目内建立更明确的工程约束。

3. **执行与评审流程有本地化调整**
   `executing-plans`、`requesting-code-review`、`subagent-driven-development` 等流程技能和提示词在本仓库中做了调整，以适配当前维护方式和工作流要求。

4. **文档与安装说明按当前 fork 维护**
   README 和部分安装入口优先服务这个 fork 的使用方式，不再默认以原项目发布渠道作为唯一入口。

## 安装方式

下面的安装方式统一使用当前仓库地址：

### Codex

告诉 Codex：

```text
Fetch and follow instructions from https://github.com/xuansheep/my-superpowers/blob/main/.codex/INSTALL.md
```

手动安装：

```bash
git clone https://github.com/xuansheep/my-superpowers.git ~/.codex/superpowers
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
  "plugin": ["superpowers@git+https://github.com/xuansheep/my-superpowers.git"]
}
```

如果需要固定版本，可以使用 Git 引用或 tag，例如：

```json
{
  "plugin": ["superpowers@git+https://github.com/xuansheep/my-superpowers.git#main"]
}
```

### Gemini CLI

```bash
gemini extensions install https://github.com/xuansheep/my-superpowers
```

更新：

```bash
gemini extensions update superpowers
```

### 通用源码安装方式

如果你的 agent 平台支持从本地 skills 目录发现技能，可以直接克隆仓库并把 `skills/` 暴露给平台：

```bash
git clone https://github.com/xuansheep/my-superpowers.git
```

然后按你所使用平台的技能发现机制，将仓库中的 `skills/` 目录接入。

## 验证安装

启动一个新会话，然后让 agent 处理一个应该触发 workflow 的任务，例如：

- “帮我规划这个功能”
- “帮我系统化地排查这个问题”
- “读取 spec 后再继续实现”

如果安装正常，agent 应该会调用相应的 skill，而不是直接跳过流程开始硬写。

## 基本工作流

1. **brainstorming**：在实现前澄清目标、方案和边界。
2. **using-git-worktrees**：在合适的平台中准备隔离工作区。
3. **writing-plans**：把设计拆成可执行的细粒度计划。
4. **subagent-driven-development** 或 **executing-plans**：按计划推进实现。
5. **test-driven-development**：在实现阶段执行 RED-GREEN-REFACTOR。
6. **requesting-code-review**：在关键阶段做结构化代码审查。
7. **finishing-a-development-branch**：在完成后做收尾、验证和集成决策。

## 包含的主要技能

### 测试 / Testing

- `test-driven-development`

### 调试 / Debugging

- `systematic-debugging`
- `verification-before-completion`

### 协作 / Collaboration

- `brainstorming`
- `writing-plans`
- `executing-plans`
- `dispatching-parallel-agents`
- `requesting-code-review`
- `receiving-code-review`
- `using-git-worktrees`
- `finishing-a-development-branch`
- `subagent-driven-development`

### Spec 与初始化 / Spec Bootstrap

- `spec-init`
- `spec-update`
- `setup`（旧别名，兼容保留）
- `reading-spec`

## Spec 更新工作流

- `spec-update` 现在会先检查 `.agents/spec` 是否存在。
- `spec-update` 会读取现有 spec 文件，结合相关时间窗内的已提交 git 变更，先生成一份更新计划供审核。
- `spec-update` 的 CLI 不直接落盘更新；只有计划审核通过后，后续流程才允许执行保守更新。

## 理念

- **Test-Driven Development**：先写失败测试，再写实现
- **Systematic over ad-hoc**：优先系统化流程，而不是拍脑袋
- **Complexity reduction**：复杂度控制优先于技巧炫耀
- **Evidence over claims**：没有验证的“完成”，基本等于没完成

## 贡献

如果你要在这个 fork 上继续扩展 skills、脚本或工作流：

1. Fork 或 clone 当前仓库
2. 创建你的分支
3. 按 `skills/writing-skills/SKILL.md` 的方法编写和测试技能
4. 提交 PR

## 更新

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

- Issues: https://github.com/xuansheep/my-superpowers/issues
- Repository: https://github.com/xuansheep/my-superpowers
