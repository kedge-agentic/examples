#!/bin/bash
# CCAAS Demo - 从零开始初始化脚本
#
# 功能：
#   1. 清空数据库
#   2. 启动后端服务
#   3. 创建示例 Skills
#   4. 启动 Demo 前端
#   5. Ctrl+C 优雅退出
#
# 用法：
#   ./setup.sh [OPTIONS]
#
# 参数：
#   --backend-port PORT    后端端口 (默认: 3001)
#   --demo-port PORT       Demo 端口 (默认: 5179)
#   --skip-db              跳过数据库清空
#   --skip-skills          跳过 Skills 创建
#   --help                 显示帮助信息

set -e

# Source shared library for logging, port management, etc.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TOOLS_DIR="$ROOT_DIR/tools"
source "$TOOLS_DIR/solution-lib.sh"

# Default bootstrap key for internal solutions
# Can be overridden by setting CCAAS_BOOTSTRAP_KEY environment variable
CCAAS_BOOTSTRAP_KEY="${CCAAS_BOOTSTRAP_KEY:-sk-default-testd84f5b7a1dbdbc4c424417be6c009f01}"

# Configuration
BACKEND_PORT=3001
DEMO_PORT=5179
SKIP_DB=false
SKIP_SKILLS=false

# Parse CLI arguments
show_help() {
    echo "用法: ./setup.sh [OPTIONS]"
    echo ""
    echo "参数:"
    echo "  --backend-port PORT    后端端口 (默认: 3001)"
    echo "  --demo-port PORT       Demo 端口 (默认: 5179)"
    echo "  --skip-db              跳过数据库清空"
    echo "  --skip-skills          跳过 Skills 创建"
    echo "  --help                 显示帮助信息"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --demo-port)
            DEMO_PORT="$2"
            shift 2
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --skip-skills)
            SKIP_SKILLS=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            echo "使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

BACKEND_DIR="$ROOT_DIR/packages/backend"
BACKEND_URL="http://localhost:$BACKEND_PORT"

# Disable localhost proxy
export no_proxy="localhost,127.0.0.1"
export NO_PROXY="localhost,127.0.0.1"

# Track subprocess PIDs
BACKEND_PID=""
DEMO_PID=""

# Custom function: Clear database (ccaas-demo specific)
clear_database() {
    log_step "1" "清空数据库"

    if [ "$SKIP_DB" = true ]; then
        log_warn "已跳过 (--skip-db)"
        return 0
    fi

    local db_path="$BACKEND_DIR/.agent-workspace/data.db"
    local sessions_dir="$BACKEND_DIR/.agent-workspace/sessions"

    if [ -f "$db_path" ]; then
        rm -f "$db_path"
        log_success "数据库已清空"
    else
        log_info "数据库不存在，无需清空"
    fi

    if [ -d "$sessions_dir" ]; then
        rm -rf "$sessions_dir"
        log_success "Sessions 已清空"
    fi
}

# Custom function: Inject JSON skills (different from SKILL.md format)
inject_json_skills() {
    log_step "5" "创建示例 Skills"

    if [ "$SKIP_SKILLS" = true ]; then
        log_warn "已跳过 (--skip-skills)"
        return 0
    fi

    local skills_dir="$SCRIPT_DIR/skills"

    if [ ! -d "$skills_dir" ]; then
        log_warn "Skills 目录不存在: $skills_dir"
        return 0
    fi

    local count=0
    for skill_file in "$skills_dir"/*.json; do
        if [ -f "$skill_file" ]; then
            local skill_name=$(basename "$skill_file" .json)
            local json_data=$(cat "$skill_file")
            local display_name=$(echo "$json_data" | jq -r '.name // "'$skill_name'"')

            # Create skill
            local response=$(curl -s -X POST "$BACKEND_URL/api/v1/skills" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $API_KEY" \
                -d "$json_data" 2>/dev/null)

            if echo "$response" | grep -q '"id"'; then
                local skill_id=$(echo "$response" | jq -r '.id')

                # Publish skill
                curl -s -X POST "$BACKEND_URL/api/v1/skills/$skill_id/publish" \
                    -H "Authorization: Bearer $API_KEY" > /dev/null 2>&1

                log_success "已创建并发布: $display_name"
                ((count++))
            elif echo "$response" | grep -q "already exists"; then
                log_info "已存在: $display_name"
            else
                log_warn "创建失败: $display_name"
            fi
        fi
    done

    log_success "Skills 创建完成 ($count)"
}

# Cleanup function
cleanup() {
    echo ""
    log_info "正在停止服务..."

    if [ -n "$DEMO_PID" ]; then
        stop_service "$DEMO_PID"
        log_success "Demo 已停止"
    fi

    if [ -n "$BACKEND_PID" ]; then
        stop_service "$BACKEND_PID"
        log_success "后端已停止"
    fi

    log_success "服务已停止"
    exit 0
}

# Register cleanup handler
trap cleanup INT TERM EXIT

# Main workflow
main() {
    log_header "CCAAS Demo - 从零开始初始化"
    log_info "配置: 后端端口=$BACKEND_PORT, Demo端口=$DEMO_PORT"

    # Step 1: Clear database (custom)
    clear_database

    # Step 2: Check dependencies
    log_step "2" "检查依赖"
    check_dependencies

    # Install npm dependencies
    install_npm_dependencies "$BACKEND_DIR"
    install_npm_dependencies "$SCRIPT_DIR"

    # Step 3: Start backend (custom - packages/backend)
    log_step "3" "启动后端服务"
    kill_port "$BACKEND_PORT"

    cd "$BACKEND_DIR"
    PORT=$BACKEND_PORT npm run start:dev > /tmp/ccaas-backend.log 2>&1 &
    BACKEND_PID=$!
    log_success "后端已启动 (PID: $BACKEND_PID)"

    wait_for_port "$BACKEND_PORT" 60

    # Step 4: Setup tenant and modern API key
    log_step "4" "配置 Demo 租户"
    TENANT_ID="ccaas-demo"

    # Step 4a: Create tenant (no API key returned)
    local tenant_response
    tenant_response=$(curl -s -X POST "$BACKEND_URL/api/v1/tenants" \
        -H "Content-Type: application/json" \
        -d '{"name":"CCAAS Demo","slug":"ccaas-demo","description":"Demo tenant for showcase"}' 2>/dev/null)

    if echo "$tenant_response" | grep -q '"id"'; then
        log_success "租户已创建: $TENANT_ID"
    elif echo "$tenant_response" | grep -q "already exists"; then
        log_info "租户已存在: $TENANT_ID"
    else
        log_error "创建租户失败"
        exit 1
    fi

    # Step 4b: Get bootstrap admin key
    BOOTSTRAP_KEY=$(get_or_create_bootstrap_key "$BACKEND_URL")
    if [ -z "$BOOTSTRAP_KEY" ]; then
        log_error "Bootstrap key required. See instructions above."
        exit 1
    fi

    # Step 4c: Create modern API key for this solution
    eval "$(create_solution_api_key "$BACKEND_URL" "$TENANT_ID" "$BOOTSTRAP_KEY" "CCAAS Demo")"

    if [ -n "$API_KEY" ]; then
        log_success "API Key 已创建: ${API_KEY:0:20}..."

        # Write .env file
        cat > "$SCRIPT_DIR/.env" << EOF
VITE_BACKEND_URL=$BACKEND_URL
VITE_TENANT_ID=$TENANT_ID
VITE_API_KEY=$API_KEY
EOF
        log_success "已写入 .env 文件"
    else
        log_error "无法创建 API Key"
        exit 1
    fi

    # Step 5: Create skills (custom JSON format)
    inject_json_skills

    # Step 6: Start demo frontend
    log_step "6" "启动 Demo"
    kill_port "$DEMO_PORT"

    cd "$SCRIPT_DIR"
    VITE_PORT=$DEMO_PORT npm run dev -- --port $DEMO_PORT > /tmp/ccaas-demo.log 2>&1 &
    DEMO_PID=$!
    log_success "Demo 已启动 (PID: $DEMO_PID)"

    wait_for_port "$DEMO_PORT" 30

    # Summary
    echo ""
    echo "========================================"
    log_success "初始化完成！"
    echo "========================================"
    echo ""
    echo "📍 访问地址："
    echo "   - Demo:    http://localhost:$DEMO_PORT"
    echo "   - Backend: http://localhost:$BACKEND_PORT"
    echo ""
    echo "📋 已创建的 Skills："
    if [ -n "$API_KEY" ]; then
        curl -s "$BACKEND_URL/api/v1/skills" -H "Authorization: Bearer $API_KEY" 2>/dev/null | \
            jq -r '.[] | "   - " + .name' 2>/dev/null || echo "   (查询失败)"
    fi
    echo ""
    echo "💡 提示："
    echo "   - 按 Ctrl+C 停止所有服务"
    echo "   - 后端日志: /tmp/ccaas-backend.log"
    echo "   - Demo 日志: /tmp/ccaas-demo.log"
    echo ""

    # Wait for processes
    wait
}

main "$@"
