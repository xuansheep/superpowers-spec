---
name: automatic-learning
description: Use when carrying out multi-step implementation, debugging, testing, environment setup, or integration troubleshooting tasks that surface repeated failures, permission limits, missing dependencies, path mistakes, encoding issues, or unreliable file writes.
---

# Automatic Learning

This skill captures high-value lessons from task execution and keeps project memory current. It records only validated, reusable experience, or explicitly marked inferences, and rejects after-the-fact storytelling and fake completion states.

## 1. Activation Principles

When this skill is triggered, follow these principles strictly:

- **Facts first**: If long-term memory conflicts with the current logs, command output, or code facts, trust the validated current facts.
- **Do not block the main path**: Keep listening for failure signals during the task, but do not slow down delivery just to organize memory.
- **Only record high-value experience**: One-off mistakes, low-confidence guesses, or rare issues with no reuse value do not belong in long-term memory.
- **Sensitive information must not be persisted**: Never record secrets, tokens, credentials, customer private data, or full sensitive paths.
- **Do not fabricate status**: If historical files or long-term memory fail to write, clearly state the failure reason and what remains unfinished.

## 2. Subagent Enablement Rules

Subagents may be used only when the current session explicitly allows them. Any one of the following counts as permission:

- The user explicitly asks for or allows "subagents", "delegation", "parallel agent work", "background agents", or "asynchronous integration".
- System or developer instructions explicitly require subagent use for this skill.
- The current runtime tools allow `spawn_agent` for this kind of task.

If none of the above applies, the main agent must not call `spawn_agent`.

### 2.1 Asynchronous Delegation Rules

When subagents are allowed and a retrospective is needed, the main agent should normally use fire-and-forget mode:

- Call `spawn_agent` and immediately continue the main task or final output.
- Do not call `wait_agent` in the same turn to wait for completion.
- Do not pause briefly just to confirm the history file was written.
- Waiting is allowed only when:
  - The user explicitly asks to wait for the subagent result or to confirm the write.
  - The main task cannot continue without the subagent result.
  - System or developer instructions explicitly require waiting.
- If you do not wait, the final report must say that delegation happened and completion was not awaited.

## 3. Core Execution Flow

### 3.1 Initialization

At the start of the task:

1. First confirm whether delegation is allowed for retrospective output:
   - If the current mode supports `request_user_input`, use interactive options and wait for the user's reply.
   - If the current mode does not support interactive input, ask the question directly in plain text and wait.
   - Before receiving explicit permission or refusal, do not read long-term memory, do not execute the main task, and do not create a subagent.
2. Try to read `docs/automatic/learning/memory.md` from the project root.
3. If the file does not exist:
   - When writing is allowed and the current mode allows file modification, create an empty template.
   - If the current mode does not allow writing, record only that the long-term memory file is missing.
4. If the file is unreadable, garbled, looks binary, appears encrypted, or is not Markdown:
   - Do not treat the broken content as valid memory.
   - Degrade to "no usable long-term memory" for this task.
   - Treat the problem as a candidate high-value environment or file-read/write lesson.
5. Extract rules, pitfalls, and known environment constraints from the memory that is actually usable for the current task.

### 3.2 Execution Monitoring

During task execution, keep track of:

- The full command line, working directory, critical environment variable state, and exit code for failed commands.
- Whether the failure came from environment variables, missing dependencies, permission problems, path mistakes, network restrictions, encoding problems, file locks, or sandbox limits.
- Effective fixes, failed attempts, fallback commands, and validation results.
- Early warning signals such as error text, missing files, unwritable directories, garbled output, or permission prompts.

### 3.3 Whether a Retrospective Is Needed

At the end of the task, decide whether there is high-value reusable experience.

Cases that do not need a retrospective:

- No failures, no troubleshooting, and no useful environment constraints discovered.
- Only a typo, temporary slip, or a low-value attempt happened once.
- The root cause could not be confirmed and the inferred value is low.

Cases that do need a retrospective:

- Commands failed because of permissions, dependencies, paths, network, encoding, file locks, or sandbox limits.
- A reusable correct command pattern, prerequisite, or fallback was discovered.
- The long-term memory file was unreadable, corrupted, encoded incorrectly, or conflicted with reality.
- Repeated attempts produced a stable, verifiable troubleshooting pattern.

### 3.4 Retrospective Handling

If no retrospective is needed:

- Skip writing the history file and skip long-term memory updates.
- State in the final report that there was no high-value reusable experience.

If a retrospective is needed and subagents are allowed:

1. The main agent prepares the full retrospective context.
2. The main agent creates a subagent and hands it all of the following:
   - The retrospective body.
   - The target history path `docs/automatic/learning/history/yyyyMMddHHmmss.md`.
   - The current long-term memory path `docs/automatic/learning/memory.md`.
   - The rules for deduplication, conflict replacement, noise filtering, and sensitive-data exclusion.
3. The subagent writes the history file first.
4. After the history file is confirmed written, the subagent extracts and merges updates into `memory.md`.
5. The main agent must not block waiting for the memory merge; after calling `spawn_agent`, it must not call `wait_agent` unless the user explicitly asks to wait or the main task depends on the subagent result.
6. The final report must say that delegation happened and completion was not awaited, and it must include the target history path or the expected path.

If a retrospective is needed but subagents are not allowed, the main agent must write the retrospective itself.

## 4. Main Agent Responsibilities

The main agent is responsible for:

- Reading and interpreting usable long-term memory.
- Monitoring failures and troubleshooting during task execution.
- Deciding whether high-value reusable experience exists.
- Summarizing the full retrospective context.
- Starting subagent delegation when allowed, or handling the retrospective itself otherwise.
- Producing the final post-task learning report.

The main agent must not:

- Write unverified inferences as confirmed facts.
- Call subagents without permission.
- Claim completion when a write failed.
- Invent experience just to pad the report.
- Write secrets or sensitive data into history or long-term memory.

Do not use `spawn_agent` and then call `wait_agent` just to give the user a more definite status. That blocks the user from continuing and defeats the point of asynchronous delegation.

## 5. Subagent Responsibilities

When delegated, the subagent only does the following:

1. Write the history retrospective file:
   - Path format: `docs/automatic/learning/history/yyyyMMddHHmmss.md`
   - Use the local session time in 24-hour format.
2. Verify that the history file was written successfully.
3. Read the existing `docs/automatic/learning/memory.md`.
4. Distill high-value, stable, reusable experience.
5. Merge updates into long-term memory while respecting deduplication, conflict replacement, noise filtering, and sensitive-data rules.
6. If any write fails, clearly report the failing path, the failing stage, and the error cause.

The subagent must not:

- Redo the main task.
- Expand the task scope.
- Write unverified or low-value experience.
- Append endlessly and bloat `memory.md`.
- Keep conflicting old and new rules side by side.

## 7. Long-Term Memory Maintenance Format

`memory.md` should stay compact and is best maintained with the following structure:

```markdown
# Automatic Learning Memory

## Stable Rules
- Verified, long-lived rules.

## Frequent Failure Patterns
- Common error patterns, typical messages, and root causes.

## Effective Workflows
- Verified commands, troubleshooting paths, and fallback approaches.

## Preconditions
- Preconditions for easy-to-miss commands, directory requirements, permission requirements, and dependency requirements.

## Environment Constraints
- Current repository, system, sandbox, network, encoding, or tool boundaries.
```

Maintenance requirements:

- When new experience replaces old experience, replace the old rule directly.
- If the same experience already exists, merge it instead of duplicating it.
- Keep only executable, verifiable, reusable conclusions.
- Low-confidence content stays in the history retrospective and does not enter long-term memory.
- Never record secrets, credentials, tokens, customer private data, or sensitive business data.

## 8. Post-Task Learning Report Format

The final output should normally include a compact panel. If there is no high-value experience, output only:

```markdown
**Post-Task Learning**
- No high-value reusable experience.
```

If there is high-value experience, report it in descending value order:

```markdown
**Post-Task Learning**
- **Issue**: Brief summary of the core problem.
- **Failed Command & Env**: The failed command and the environment factor that caused it.
- **Confirmed Cause / Hypothesis**: Root cause; state clearly whether it is confirmed or inferred.
- **Effective Fix**: The final effective action or the correct execution pattern.
- **Prevention Signal**: Early warning signs and prerequisites that must be checked.
- **Reuse When**: Future scenarios, repositories, or environments where this applies.
- **Confidence**: high / medium / low.
- **Delegation**: Delegated to a subagent asynchronously; completion was not awaited.
- **History Target**: `docs/automatic/learning/history/yyyyMMddHHmmss.md`.
- **Next Check**: If you need to confirm the write, ask later to check the subagent result.
```

## 9. Decision Table

| Scenario | Main Agent Action | Subagent Action |
|---|---|---|
| No failure, no troubleshooting value | Report no high-value experience | Do not create |
| Failure exists but no reusable value | Explain briefly, do not write long-term memory | Do not create |
| High-value experience exists and subagents are allowed | Summarize context and delegate | Write history and update memory |
| High-value experience exists but subagents are not allowed | Explain why and give a retrospective recommendation | Do not create |
| memory.md does not exist | Create or delegate creation when writing is allowed | Handle according to permission |
| memory.md is garbled or unreadable | Degrade to no usable memory and record the issue | Repair or recreate when authorized |
| History write fails | Report failure, do not claim success | Report the failing stage and cause |
| Long-term memory conflicts | Trust the current verified facts | Replace the old rule and avoid keeping both |

## 10. Subagent Delegation Prompt Template

When subagents are allowed and there is a high-value retrospective, the main agent should delegate with this intent:

```text
You are the memory-integration subagent for automatic-learning. Do not redo the main task.

Goal:
1. Write the provided retrospective to the history file:
   docs/automatic/learning/history/yyyyMMddHHmmss.md
2. Confirm that the history file was written successfully.
3. Read and update:
   docs/automatic/learning/memory.md
4. Extract only high-value, reusable, verifiable experience.
5. Deduplicate, replace conflicting old rules, and filter low-confidence noise.
6. Never record secrets, credentials, tokens, customer private data, or sensitive data.
7. If any write fails, report the failing path, the failing stage, and the error cause clearly.

Retrospective context:
<full retrospective provided by the main agent>
```
