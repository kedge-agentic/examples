#!/bin/bash
# CCAAS Demo - Production Setup Script
#
# Connects the demo frontend to a deployed CCAAS backend.
# Unlike setup.sh, this does NOT start the backend (it's already running).
#
# What it does:
#   1. Verify production backend is reachable
#   2. Create/fetch demo tenant and API key
#   3. Create example Skills on production backend
#   4. Write .env pointing to production
#   5. Start demo frontend locally
#
# Usage:
#   ./setup-production.sh [OPTIONS]
#
# Options:
#   --backend-url URL      Production backend URL (default: https://ccaas.zhushou.one)
#   --demo-port PORT       Local demo frontend port (default: 5179)
#   --tenant-id ID         Tenant slug (default: ccaas-demo)
#   --skip-skills          Skip Skills creation
#   --env-only             Only write .env file, don't start frontend
#   --help                 Show help

set -e

# Defaults
BACKEND_URL="https://ccaas.zhushou.one"
DEMO_PORT=5179
TENANT_ID="ccaas-demo"
SKIP_SKILLS=false
ENV_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-url)
            BACKEND_URL="$2"
            shift 2
            ;;
        --demo-port)
            DEMO_PORT="$2"
            shift 2
            ;;
        --tenant-id)
            TENANT_ID="$2"
            shift 2
            ;;
        --skip-skills)
            SKIP_SKILLS=true
            shift
            ;;
        --env-only)
            ENV_ONLY=true
            shift
            ;;
        --help)
            echo "Usage: ./setup-production.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --backend-url URL      Production backend URL (default: https://ccaas.zhushou.one)"
            echo "  --demo-port PORT       Local demo frontend port (default: 5179)"
            echo "  --tenant-id ID         Tenant slug (default: ccaas-demo)"
            echo "  --skip-skills          Skip Skills creation"
            echo "  --env-only             Only write .env file, don't start frontend"
            echo "  --help                 Show help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage"
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEMO_PID=""

cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping services...${NC}"
    if [ -n "$DEMO_PID" ] && kill -0 "$DEMO_PID" 2>/dev/null; then
        kill "$DEMO_PID" 2>/dev/null || true
        echo "  ✓ Demo stopped"
    fi
    echo -e "${GREEN}Done${NC}"
    exit 0
}

trap cleanup INT TERM EXIT

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        CCAAS Demo - Production Setup                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "Backend:   $BACKEND_URL"
echo "Tenant:    $TENANT_ID"
echo "Demo port: $DEMO_PORT"

# Step 1: Verify backend is reachable
echo ""
echo -e "${YELLOW}🔍 Step 1: Verifying production backend...${NC}"

# Try /health first, fall back to /api/v1/tenants
HEALTH=$(curl -s --max-time 10 "$BACKEND_URL/health" 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q '"ok"'; then
    echo -e "   ${GREEN}✓ Backend is healthy ($BACKEND_URL)${NC}"
else
    # Fallback: check if API is responding via tenants endpoint
    FALLBACK=$(curl -s --max-time 10 "$BACKEND_URL/api/v1/tenants" 2>/dev/null || echo "")
    if echo "$FALLBACK" | grep -q '"id"'; then
        echo -e "   ${GREEN}✓ Backend is reachable ($BACKEND_URL)${NC}"
    else
        echo -e "   ${RED}✗ Cannot reach backend at $BACKEND_URL${NC}"
        echo -e "   ${RED}  Response: $HEALTH${NC}"
        exit 1
    fi
fi

# Step 2: Create/fetch tenant and API key
echo ""
echo -e "${YELLOW}🔑 Step 2: Setting up tenant...${NC}"

API_KEY=""

# Try to create tenant
TENANT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/tenants" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"CCAAS Demo\",\"slug\":\"$TENANT_ID\",\"description\":\"Demo tenant for production showcase\"}" 2>/dev/null)

if echo "$TENANT_RESPONSE" | grep -q '"id"'; then
    API_KEY=$(echo "$TENANT_RESPONSE" | grep -o '"apiKey":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "   ${GREEN}✓ Tenant created: $TENANT_ID${NC}"
elif echo "$TENANT_RESPONSE" | grep -q "already exists"; then
    echo -e "   ${GREEN}✓ Tenant already exists: $TENANT_ID${NC}"
    EXISTING_TENANT=$(curl -s "$BACKEND_URL/api/v1/tenants/$TENANT_ID" 2>/dev/null)
    API_KEY=$(echo "$EXISTING_TENANT" | grep -o '"apiKey":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    echo -e "   ${YELLOW}⚠ Tenant response: $TENANT_RESPONSE${NC}"
fi

if [ -n "$API_KEY" ]; then
    echo -e "   ${GREEN}✓ API Key obtained: ${API_KEY:0:20}...${NC}"
else
    echo -e "   ${YELLOW}⚠ Could not obtain API Key, using default config${NC}"
fi

# Step 3: Write .env
echo ""
echo -e "${YELLOW}📝 Step 3: Writing .env...${NC}"

if [ -n "$API_KEY" ]; then
    cat > "$SCRIPT_DIR/.env" << EOF
VITE_BACKEND_URL=$BACKEND_URL
VITE_TENANT_ID=$TENANT_ID
VITE_API_KEY=$API_KEY
EOF
else
    cat > "$SCRIPT_DIR/.env" << EOF
VITE_BACKEND_URL=$BACKEND_URL
VITE_TENANT_ID=default
EOF
fi
echo -e "   ${GREEN}✓ .env written${NC}"

# Step 4: Create Skills
echo ""
echo -e "${YELLOW}📋 Step 4: Creating Skills...${NC}"

SKILLS_DIR="$SCRIPT_DIR/skills"

if [ "$SKIP_SKILLS" = true ]; then
    echo -e "   ${YELLOW}⏭ Skipped (--skip-skills)${NC}"
elif [ ! -d "$SKILLS_DIR" ]; then
    echo -e "   ${YELLOW}⚠ Skills directory not found: $SKILLS_DIR${NC}"
else
    for skill_file in "$SKILLS_DIR"/*.json; do
        if [ -f "$skill_file" ]; then
            skill_name=$(basename "$skill_file" .json)
            json_data=$(cat "$skill_file")

            display_name=$(echo "$json_data" | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)
            [ -z "$display_name" ] && display_name="$skill_name"

            if [ -n "$API_KEY" ]; then
                response=$(curl -s -X POST "$BACKEND_URL/api/v1/skills" \
                    -H "Content-Type: application/json" \
                    -H "Authorization: Bearer $API_KEY" \
                    -d "$json_data" 2>/dev/null)
            else
                response=$(curl -s -X POST "$BACKEND_URL/api/v1/skills" \
                    -H "Content-Type: application/json" \
                    -d "$json_data" 2>/dev/null)
            fi

            if echo "$response" | grep -q '"id"'; then
                skill_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
                if [ -n "$skill_id" ]; then
                    if [ -n "$API_KEY" ]; then
                        curl -s -X POST "$BACKEND_URL/api/v1/skills/$skill_id/publish" \
                            -H "Authorization: Bearer $API_KEY" > /dev/null 2>&1
                    else
                        curl -s -X POST "$BACKEND_URL/api/v1/skills/$skill_id/publish" > /dev/null 2>&1
                    fi
                    echo -e "   ${GREEN}✓ Created and published: $display_name${NC}"
                fi
            elif echo "$response" | grep -q "already exists"; then
                echo -e "   ${YELLOW}⚠ Already exists: $display_name${NC}"
            else
                echo -e "   ${YELLOW}⚠ Failed to create: $display_name${NC}"
            fi
        fi
    done
fi

# Step 5: Start frontend (or exit if --env-only)
if [ "$ENV_ONLY" = true ]; then
    echo ""
    echo -e "${GREEN}✅ Environment configured. Run 'npm run dev' to start the frontend.${NC}"
    trap - INT TERM EXIT
    exit 0
fi

echo ""
echo -e "${YELLOW}🎨 Step 5: Starting demo frontend...${NC}"
cd "$SCRIPT_DIR"

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi

# Check port
if lsof -i ":$DEMO_PORT" > /dev/null 2>&1; then
    echo -e "   ${YELLOW}⚠ Port $DEMO_PORT in use, freeing...${NC}"
    lsof -ti ":$DEMO_PORT" | xargs kill -9 2>/dev/null || true
    sleep 2
fi

VITE_PORT=$DEMO_PORT npm run dev -- --port $DEMO_PORT > /tmp/ccaas-demo-prod.log 2>&1 &
DEMO_PID=$!
echo "   Demo PID: $DEMO_PID"

echo -n "   Waiting for demo"
for i in {1..30}; do
    if curl -s "http://localhost:$DEMO_PORT" > /dev/null 2>&1; then
        echo ""
        echo -e "   ${GREEN}✓ Demo started (http://localhost:$DEMO_PORT)${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Summary
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Production setup complete!${NC}"
echo ""
echo -e "${YELLOW}📍 Addresses:${NC}"
echo "   - Demo:    http://localhost:$DEMO_PORT"
echo "   - Backend: $BACKEND_URL"
echo ""
echo -e "${YELLOW}📋 Skills:${NC}"
if [ -n "$API_KEY" ]; then
    curl -s "$BACKEND_URL/api/v1/skills" -H "Authorization: Bearer $API_KEY" 2>/dev/null | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read name; do
        echo "   - $name"
    done
else
    curl -s "$BACKEND_URL/api/v1/skills" 2>/dev/null | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read name; do
        echo "   - $name"
    done
fi
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "   - Press Ctrl+C to stop the frontend"
echo "   - Demo log: /tmp/ccaas-demo-prod.log"
echo "   - Use --env-only to just configure without starting"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

wait
