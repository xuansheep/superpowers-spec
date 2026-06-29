#!/usr/bin/env bash
# Run all skill gate tests
# Usage: ./run-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPTS_DIR="$SCRIPT_DIR/prompts"

GATED_SKILLS=(
    "systematic-debugging"
    "test-driven-development"
    "writing-plans"
    "dispatching-parallel-agents"
    "executing-plans"
    "requesting-code-review"
    "reading-spec"
    "spec-init"
    "spec-update"
)

echo "=== Running Skill Gate Tests ==="
echo ""

PASSED=0
FAILED=0
RESULTS=()

for skill in "${GATED_SKILLS[@]}"; do
    prompt_file="$PROMPTS_DIR/${skill}.txt"

    if [ ! -f "$prompt_file" ]; then
        echo "SKIP: No prompt file for $skill"
        continue
    fi

    echo "Testing closed gate: $skill"

    if "$SCRIPT_DIR/run-negative-test.sh" "$skill" "$prompt_file" 3 2>&1 | tee /tmp/skill-test-$skill-gated.log; then
        PASSED=$((PASSED + 1))
        RESULTS+=("PASS: $skill gated")
    else
        FAILED=$((FAILED + 1))
        RESULTS+=("FAIL: $skill gated")
    fi

    echo ""
    echo "---"
    echo ""
done

echo "Testing closed gate: brainstorming-not-explicit"
if "$SCRIPT_DIR/run-negative-test.sh" "brainstorming" "$PROMPTS_DIR/brainstorming-implicit.txt" 3 2>&1 | tee /tmp/skill-test-brainstorming-negative.log; then
    PASSED=$((PASSED + 1))
    RESULTS+=("PASS: brainstorming-not-explicit")
else
    FAILED=$((FAILED + 1))
    RESULTS+=("FAIL: brainstorming-not-explicit")
fi

echo ""
echo "---"
echo ""

echo "Testing explicit request: brainstorming"
if "$SCRIPT_DIR/run-test.sh" "brainstorming" "$SCRIPT_DIR/../explicit-skill-requests/prompts/please-use-brainstorming.txt" 3 2>&1 | tee /tmp/skill-test-brainstorming-explicit.log; then
    PASSED=$((PASSED + 1))
    RESULTS+=("PASS: brainstorming-explicit")
else
    FAILED=$((FAILED + 1))
    RESULTS+=("FAIL: brainstorming-explicit")
fi

echo ""
echo "---"
echo ""

echo ""
echo "=== Summary ==="
for result in "${RESULTS[@]}"; do
    echo "  $result"
done
echo ""
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [ $FAILED -gt 0 ]; then
    exit 1
fi
