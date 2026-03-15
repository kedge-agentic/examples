#!/bin/bash
# setup.sh - Import a demo Solution into KedgeAgentic
#
# Usage:
#   cd demo/01-pure-chat && ../setup.sh       # Run from demo subdirectory
#   ./setup.sh 01-pure-chat                   # Run from demo/ directory with argument
#
# Configuration (via .env or environment variables):
#   CCAAS_URL     - Backend URL (default: https://ccaas.zhushou.one)
#   CCAAS_API_KEY - API key with admin + skills:write scopes (required)

set -e

# ==============================================================================
# Colors and logging
# ==============================================================================

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_NC='\033[0m'

log_info()    { echo -e "${COLOR_BLUE}ℹ️  $1${COLOR_NC}"; }
log_success() { echo -e "${COLOR_GREEN}✅ $1${COLOR_NC}"; }
log_warn()    { echo -e "${COLOR_YELLOW}⚠️  $1${COLOR_NC}"; }
log_error()   { echo -e "${COLOR_RED}❌ $1${COLOR_NC}" >&2; }

log_header() {
    echo ""
    echo "========================================"
    echo "  $1"
    echo "========================================"
    echo ""
}

log_step() {
    echo ""
    echo "Step $1: $2"
    echo "----------------------------------------"
}

# ==============================================================================
# Resolve demo directory
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -n "$1" ]; then
    DEMO_DIR="$SCRIPT_DIR/$1"
else
    DEMO_DIR="$(pwd)"
fi

if [ ! -f "$DEMO_DIR/solution.json" ]; then
    echo "Error: solution.json not found in $DEMO_DIR"
    echo ""
    echo "Usage:"
    echo "  cd demo/01-pure-chat && ../setup.sh"
    echo "  ./setup.sh 01-pure-chat"
    exit 1
fi

# ==============================================================================
# Check dependencies
# ==============================================================================

for cmd in curl jq; do
    if ! command -v "$cmd" &> /dev/null; then
        log_error "Missing required tool: $cmd"
        exit 1
    fi
done

# ==============================================================================
# Load environment
# ==============================================================================

if [ -f "$DEMO_DIR/.env" ]; then
    set -a; source "$DEMO_DIR/.env"; set +a
elif [ -f "$SCRIPT_DIR/.env" ]; then
    set -a; source "$SCRIPT_DIR/.env"; set +a
fi

CCAAS_URL="${CCAAS_URL:-https://ccaas.zhushou.one}"

if [ -z "$CCAAS_API_KEY" ]; then
    log_error "CCAAS_API_KEY is required"
    echo ""
    echo "Set it in .env or as an environment variable:"
    echo "  cp .env.example .env"
    echo "  # Edit .env to set your CCAAS_API_KEY"
    echo ""
    echo "Get an API key from the admin dashboard at $CCAAS_URL"
    exit 1
fi

# ==============================================================================
# Load solution config
# ==============================================================================

DEMO_NAME="$(basename "$DEMO_DIR")"
SOLUTION_SLUG=$(jq -r '.tenant.slug // .slug // ""' "$DEMO_DIR/solution.json")
SOLUTION_NAME=$(jq -r '.tenant.name // .name // ""' "$DEMO_DIR/solution.json")

if [ -z "$SOLUTION_SLUG" ]; then
    log_error "solution.json missing tenant.slug"
    exit 1
fi

# ==============================================================================
# Import solution
# ==============================================================================

log_header "Importing Demo: $DEMO_NAME"
log_info "Backend: $CCAAS_URL"
log_info "API Key: ${CCAAS_API_KEY:0:16}..."

# Step 1: Check backend connectivity
log_step "1" "Checking backend connectivity"
if ! curl -sf "$CCAAS_URL/api/v1/chat/health" > /dev/null 2>&1; then
    log_error "Cannot connect to backend at $CCAAS_URL"
    exit 1
fi
log_success "Backend is reachable"

# Step 2: Import solution via admin API (creates tenant, MCP servers, templates)
log_step "2" "Importing solution (tenant + MCP + templates)"

SOLUTION_JSON=$(cat "$DEMO_DIR/solution.json")
IMPORT_RESPONSE=$(curl -s -X POST "$CCAAS_URL/api/v1/admin/solutions/import" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CCAAS_API_KEY" \
    -d "$SOLUTION_JSON" 2>/dev/null)

if echo "$IMPORT_RESPONSE" | jq -e '.statusCode >= 400' > /dev/null 2>&1; then
    log_error "Import failed"
    echo "$IMPORT_RESPONSE" | jq .
    exit 1
fi

TENANT_ID=$(echo "$IMPORT_RESPONSE" | jq -r '.tenantId // .tenant.id // empty')
if [ -n "$TENANT_ID" ]; then
    log_success "Solution imported (tenant: $TENANT_ID)"
else
    log_success "Solution imported"
fi

# Step 3: Register skills
log_step "3" "Registering skills"

SKILLS_DIR="$DEMO_DIR/skills"
if [ ! -d "$SKILLS_DIR" ]; then
    log_warn "No skills directory found"
else
    SKILL_COUNT=0
    SUCCESS_COUNT=0

    for skill_dir in "$SKILLS_DIR"/*; do
        [ -d "$skill_dir" ] || continue
        skill_file="$skill_dir/SKILL.md"
        [ -f "$skill_file" ] || continue

        skill_name=$(basename "$skill_dir")
        SKILL_COUNT=$((SKILL_COUNT + 1))

        log_info "Processing skill: $skill_name"

        # Extract metadata from frontmatter
        skill_display_name="$skill_name"
        skill_description=""
        if head -n 1 "$skill_file" | grep -q "^---"; then
            extracted_name=$(awk '/^---$/,/^---$/' "$skill_file" | grep "^name:" | sed 's/^name:[[:space:]]*//')
            [ -n "$extracted_name" ] && skill_display_name="$extracted_name"
            extracted_desc=$(awk '/^---$/,/^---$/' "$skill_file" | grep "^description:" | sed 's/^description:[[:space:]]*//')
            [ -n "$extracted_desc" ] && skill_description="$extracted_desc"
        fi

        skill_content_escaped=$(cat "$skill_file" | jq -Rs .)

        # Check if skill exists
        existing_id=$(curl -s "$CCAAS_URL/api/v1/skills/$skill_name" \
            -H "X-Tenant-Id: $SOLUTION_SLUG" \
            -H "X-Api-Key: $CCAAS_API_KEY" 2>/dev/null | jq -r '.id // empty')

        if [ -n "$existing_id" ]; then
            # Update existing skill
            curl -s -X PUT "$CCAAS_URL/api/v1/skills/$existing_id" \
                -H "Content-Type: application/json" \
                -H "X-Tenant-Id: $SOLUTION_SLUG" \
                -H "X-Api-Key: $CCAAS_API_KEY" \
                -d "{
                    \"name\": \"$skill_display_name\",
                    \"description\": \"$skill_description\",
                    \"content\": $skill_content_escaped
                }" > /dev/null 2>&1
            log_success "  Updated: $skill_name"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            # Create new skill
            create_response=$(curl -s -X POST "$CCAAS_URL/api/v1/skills" \
                -H "Content-Type: application/json" \
                -H "X-Tenant-Id: $SOLUTION_SLUG" \
                -H "X-Api-Key: $CCAAS_API_KEY" \
                -d "{
                    \"name\": \"$skill_display_name\",
                    \"slug\": \"$skill_name\",
                    \"description\": \"$skill_description\",
                    \"content\": $skill_content_escaped,
                    \"type\": \"skill\"
                }")

            new_id=$(echo "$create_response" | jq -r '.id // empty')
            if [ -n "$new_id" ]; then
                # Publish skill
                curl -s -X POST "$CCAAS_URL/api/v1/skills/$new_id/publish" \
                    -H "X-Tenant-Id: $SOLUTION_SLUG" \
                    -H "X-Api-Key: $CCAAS_API_KEY" > /dev/null 2>&1
                log_success "  Created: $skill_name"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                log_error "  Failed: $skill_name"
            fi
        fi
    done

    log_success "Skills: $SUCCESS_COUNT/$SKILL_COUNT successful"
fi

# ==============================================================================
# Summary
# ==============================================================================

log_header "Setup Complete"

echo "Solution: $SOLUTION_NAME"
echo "Slug:     $SOLUTION_SLUG"
echo "Backend:  $CCAAS_URL"
echo ""
echo "Test with curl:"
echo ""
echo "  curl -N -X POST $CCAAS_URL/api/v1/sessions/test-$DEMO_NAME/messages \\"
echo "    -H \"Authorization: Bearer \$CCAAS_API_KEY\" \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -H \"Accept: text/event-stream\" \\"
echo "    -d '{\"message\":\"Hello!\",\"tenantId\":\"$SOLUTION_SLUG\"}'"
echo ""
