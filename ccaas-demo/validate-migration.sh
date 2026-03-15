#!/bin/bash
# Validation script for ccaas-demo migration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASSED=0
FAILED=0

echo "Validating ccaas-demo migration..."
echo ""

# Test 1: Syntax validation
echo "Test 1: Syntax validation"
if bash -n "$SCRIPT_DIR/setup.sh"; then
    echo "  ✓ Syntax valid"
    ((PASSED++))
else
    echo "  ✗ Syntax invalid"
    ((FAILED++))
fi

# Test 2: Library loading
echo "Test 2: Shared library loading"
if grep -q "source.*solution-lib.sh" "$SCRIPT_DIR/setup.sh"; then
    echo "  ✓ Shared library imported"
    ((PASSED++))
else
    echo "  ✗ Shared library not imported"
    ((FAILED++))
fi

# Test 3: Custom functions exist
echo "Test 3: Custom functions exist"
if grep -q "clear_database()" "$SCRIPT_DIR/setup.sh" && \
   grep -q "inject_json_skills()" "$SCRIPT_DIR/setup.sh"; then
    echo "  ✓ Custom functions defined"
    ((PASSED++))
else
    echo "  ✗ Custom functions missing"
    ((FAILED++))
fi

# Test 4: CLI arguments preserved
echo "Test 4: CLI arguments preserved"
if grep -q "\-\-backend-port" "$SCRIPT_DIR/setup.sh" && \
   grep -q "\-\-demo-port" "$SCRIPT_DIR/setup.sh" && \
   grep -q "\-\-skip-db" "$SCRIPT_DIR/setup.sh" && \
   grep -q "\-\-skip-skills" "$SCRIPT_DIR/setup.sh"; then
    echo "  ✓ CLI arguments preserved"
    ((PASSED++))
else
    echo "  ✗ CLI arguments missing"
    ((FAILED++))
fi

# Test 5: Shared functions used
echo "Test 5: Shared functions used"
if grep -q "kill_port" "$SCRIPT_DIR/setup.sh" && \
   grep -q "wait_for_port" "$SCRIPT_DIR/setup.sh" && \
   grep -q "stop_service" "$SCRIPT_DIR/setup.sh" && \
   grep -q "log_success" "$SCRIPT_DIR/setup.sh"; then
    echo "  ✓ Shared functions used"
    ((PASSED++))
else
    echo "  ✗ Shared functions not used"
    ((FAILED++))
fi

# Test 6: Code reduction
echo "Test 6: Code reduction"
OLD_LOC=$(wc -l < "$SCRIPT_DIR/.migration-backup/setup.sh.old" | tr -d ' ')
NEW_LOC=$(wc -l < "$SCRIPT_DIR/setup.sh" | tr -d ' ')
REDUCTION=$((OLD_LOC - NEW_LOC))
PERCENT=$((REDUCTION * 100 / OLD_LOC))

echo "  Old: $OLD_LOC lines"
echo "  New: $NEW_LOC lines"
echo "  Saved: $REDUCTION lines ($PERCENT%)"

if [ $PERCENT -ge 15 ]; then
    echo "  ✓ Code reduction achieved: $PERCENT%"
    ((PASSED++))
else
    echo "  ✗ Insufficient code reduction: $PERCENT% (target: 15%+)"
    ((FAILED++))
fi

# Summary
echo ""
echo "======================================"
echo "  Validation Results"
echo "======================================"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All validations passed!"
    exit 0
else
    echo "❌ Some validations failed"
    exit 1
fi
