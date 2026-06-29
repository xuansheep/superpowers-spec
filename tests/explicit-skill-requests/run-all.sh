#!/usr/bin/env bash
# Run all explicit skill request gate tests
# Usage: ./run-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPTS_DIR="$SCRIPT_DIR/prompts"
NEGATIVE_RUNNER="$SCRIPT_DIR/../skill-triggering/run-negative-test.sh"

echo "=== Running Explicit Skill Request Gate Tests ==="
echo ""

PASSED=0
FAILED=0
RESULTS=()

run_negative() {
    local name="$1"
    local skill="$2"
    local prompt="$3"

    echo ">>> Closed gate: $name"
    if "$NEGATIVE_RUNNER" "$skill" "$prompt"; then
        PASSED=$((PASSED + 1))
        RESULTS+=("PASS: $name")
    else
        FAILED=$((FAILED + 1))
        RESULTS+=("FAIL: $name")
    fi
    echo ""
}

run_negative "subagent-driven-development-please" "subagent-driven-development" "$PROMPTS_DIR/subagent-driven-development-please.txt"
run_negative "use-systematic-debugging" "systematic-debugging" "$PROMPTS_DIR/use-systematic-debugging.txt"
run_negative "mid-conversation-execute-plan" "subagent-driven-development" "$PROMPTS_DIR/mid-conversation-execute-plan.txt"

# Test: please use brainstorming
echo ">>> Open workflow entry: please-use-brainstorming"
if "$SCRIPT_DIR/run-test.sh" "brainstorming" "$PROMPTS_DIR/please-use-brainstorming.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS+=("PASS: please-use-brainstorming")
else
    FAILED=$((FAILED + 1))
    RESULTS+=("FAIL: please-use-brainstorming")
fi
echo ""

echo "=== Summary ==="
for result in "${RESULTS[@]}"; do
    echo "  $result"
done
echo ""
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total: $((PASSED + FAILED))"

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
