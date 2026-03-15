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

# 默认配置
BACKEND_PORT=3001
DEMO_PORT=5179
SKIP_DB=false
SKIP_SKILLS=false

# 解析命令行参数
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
            echo "用法: ./setup.sh [OPTIONS]"
            echo ""
            echo "参数:"
            echo "  --backend-port PORT    后端端口 (默认: 3001)"
            echo "  --demo-port PORT       Demo 端口 (默认: 5179)"
            echo "  --skip-db              跳过数据库清空"
            echo "  --skip-skills          跳过 Skills 创建"
            echo "  --help                 显示帮助信息"
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            echo "使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/packages/backend"

# 禁用 localhost 代理
export no_proxy="localhost,127.0.0.1"
export NO_PROXY="localhost,127.0.0.1"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 记录子进程 PID
BACKEND_PID=""
DEMO_PID=""

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止服务...${NC}"

    if [ -n "$DEMO_PID" ] && kill -0 "$DEMO_PID" 2>/dev/null; then
        kill "$DEMO_PID" 2>/dev/null || true
        echo "  ✓ Demo 已停止"
    fi

    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
        echo "  ✓ 后端已停止"
    fi

    echo -e "${GREEN}服务已停止${NC}"
    exit 0
}

# 注册退出处理
trap cleanup INT TERM EXIT

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          CCAAS Demo - 从零开始初始化                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "配置: 后端端口=$BACKEND_PORT, Demo端口=$DEMO_PORT"

# Step 1: 清空数据库
echo ""
echo -e "${YELLOW}📦 Step 1: 清空数据库...${NC}"
if [ "$SKIP_DB" = true ]; then
    echo -e "   ${YELLOW}⏭ 已跳过 (--skip-db)${NC}"
else
    if [ -f "$BACKEND_DIR/.agent-workspace/data.db" ]; then
        rm -f "$BACKEND_DIR/.agent-workspace/data.db"
        echo -e "   ${GREEN}✓ 数据库已清空${NC}"
    else
        echo -e "   ${GREEN}✓ 数据库不存在，无需清空${NC}"
    fi

    # 同时清空 sessions 目录
    if [ -d "$BACKEND_DIR/.agent-workspace/sessions" ]; then
        rm -rf "$BACKEND_DIR/.agent-workspace/sessions"
        echo -e "   ${GREEN}✓ Sessions 已清空${NC}"
    fi
fi

# Step 2: 检查依赖
echo ""
echo -e "${YELLOW}📦 Step 2: 检查依赖...${NC}"
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "   安装后端依赖..."
    cd "$BACKEND_DIR" && npm install --silent
fi
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "   安装 Demo 依赖..."
    cd "$SCRIPT_DIR" && npm install --silent
fi
echo -e "   ${GREEN}✓ 依赖已就绪${NC}"

# Step 3: 启动后端（后台运行）
echo ""
echo -e "${YELLOW}🔧 Step 3: 启动后端服务...${NC}"
cd "$BACKEND_DIR"

# 确保端口没有被占用
if lsof -i ":$BACKEND_PORT" > /dev/null 2>&1; then
    echo -e "   ${YELLOW}⚠ 端口 $BACKEND_PORT 已被占用，尝试释放...${NC}"
    lsof -ti ":$BACKEND_PORT" | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 启动后端
PORT=$BACKEND_PORT npm run start:dev > /tmp/ccaas-backend.log 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"

# 等待后端启动
echo -n "   等待后端启动"
for i in {1..60}; do
    if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        echo ""
        echo -e "   ${GREEN}✓ 后端已启动 (http://localhost:$BACKEND_PORT)${NC}"
        break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 60 ]; then
        echo ""
        echo -e "   ${RED}✗ 后端启动超时，请检查日志: /tmp/ccaas-backend.log${NC}"
        exit 1
    fi
done

# Step 4: 配置 Demo 租户
echo ""
echo -e "${YELLOW}🔑 Step 4: 配置 Demo 租户...${NC}"

BACKEND_URL="http://localhost:$BACKEND_PORT"
API_KEY=""
TENANT_ID="ccaas-demo"

# Create demo tenant (API key is auto-generated with tenant)
echo "   创建租户..."
TENANT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/tenants" \
    -H "Content-Type: application/json" \
    -d '{"name":"CCAAS Demo","slug":"ccaas-demo","description":"Demo tenant for showcase"}' 2>/dev/null)

if echo "$TENANT_RESPONSE" | grep -q '"id"'; then
    # Extract API key from tenant creation response
    API_KEY=$(echo "$TENANT_RESPONSE" | grep -o '"apiKey":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "   ${GREEN}✓ 租户已创建: $TENANT_ID${NC}"
elif echo "$TENANT_RESPONSE" | grep -q "already exists"; then
    echo -e "   ${GREEN}✓ 租户已存在: $TENANT_ID${NC}"
    # Fetch existing tenant to get API key
    EXISTING_TENANT=$(curl -s "$BACKEND_URL/api/v1/tenants/$TENANT_ID" 2>/dev/null)
    API_KEY=$(echo "$EXISTING_TENANT" | grep -o '"apiKey":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    echo -e "   ${YELLOW}⚠ 租户创建响应: $TENANT_RESPONSE${NC}"
fi

if [ -n "$API_KEY" ]; then
    echo -e "   ${GREEN}✓ API Key 已获取: ${API_KEY:0:20}...${NC}"

    # Write .env file for demo frontend
    cat > "$SCRIPT_DIR/.env" << EOF
VITE_BACKEND_URL=$BACKEND_URL
VITE_TENANT_ID=$TENANT_ID
VITE_API_KEY=$API_KEY
EOF
    echo -e "   ${GREEN}✓ 已写入 .env 文件${NC}"
else
    echo -e "   ${YELLOW}⚠ 无法创建 API Key，使用默认配置${NC}"
    cat > "$SCRIPT_DIR/.env" << EOF
VITE_BACKEND_URL=$BACKEND_URL
VITE_TENANT_ID=default
EOF
fi

# Step 5: 创建示例 Skills
echo ""
echo -e "${YELLOW}📝 Step 5: 创建示例 Skills...${NC}"

SKILLS_DIR="$SCRIPT_DIR/skills"

if [ "$SKIP_SKILLS" = true ]; then
    echo -e "   ${YELLOW}⏭ 已跳过 (--skip-skills)${NC}"
elif [ ! -d "$SKILLS_DIR" ]; then
    echo -e "   ${YELLOW}⚠ Skills 目录不存在: $SKILLS_DIR${NC}"
else
    # 遍历 skills 目录下的所有 JSON 文件
    for skill_file in "$SKILLS_DIR"/*.json; do
        if [ -f "$skill_file" ]; then
            skill_name=$(basename "$skill_file" .json)

            # 读取 JSON 文件内容
            json_data=$(cat "$skill_file")

            # 提取 skill 名称用于显示
            display_name=$(echo "$json_data" | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)
            [ -z "$display_name" ] && display_name="$skill_name"

            # 创建 skill (with API key if available)
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

            # 检查是否成功创建
            if echo "$response" | grep -q '"id"'; then
                skill_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

                if [ -n "$skill_id" ]; then
                    # 发布 skill (with API key if available)
                    if [ -n "$API_KEY" ]; then
                        curl -s -X POST "$BACKEND_URL/api/v1/skills/$skill_id/publish" \
                            -H "Authorization: Bearer $API_KEY" > /dev/null 2>&1
                    else
                        curl -s -X POST "$BACKEND_URL/api/v1/skills/$skill_id/publish" > /dev/null 2>&1
                    fi
                    echo -e "   ${GREEN}✓ 已创建并发布: $display_name${NC}"
                fi
            elif echo "$response" | grep -q "already exists"; then
                echo -e "   ${YELLOW}⚠ 已存在: $display_name${NC}"
            else
                echo -e "   ${YELLOW}⚠ 创建失败: $display_name${NC}"
            fi
        fi
    done
fi

# Step 6: 启动 Demo
echo ""
echo -e "${YELLOW}🎨 Step 6: 启动 Demo...${NC}"
cd "$SCRIPT_DIR"

# 确保端口没有被占用
if lsof -i ":$DEMO_PORT" > /dev/null 2>&1; then
    echo -e "   ${YELLOW}⚠ 端口 $DEMO_PORT 已被占用，尝试释放...${NC}"
    lsof -ti ":$DEMO_PORT" | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 使用环境变量覆盖 vite 端口配置
VITE_PORT=$DEMO_PORT npm run dev -- --port $DEMO_PORT > /tmp/ccaas-demo.log 2>&1 &
DEMO_PID=$!
echo "   Demo PID: $DEMO_PID"

# 等待 Demo 启动
echo -n "   等待 Demo 启动"
for i in {1..30}; do
    if curl -s "http://localhost:$DEMO_PORT" > /dev/null 2>&1; then
        echo ""
        echo -e "   ${GREEN}✓ Demo 已启动 (http://localhost:$DEMO_PORT)${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# 显示完成信息
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ 初始化完成！${NC}"
echo ""
echo -e "${YELLOW}📍 访问地址：${NC}"
echo "   - Demo:    http://localhost:$DEMO_PORT"
echo "   - Backend: http://localhost:$BACKEND_PORT"
echo ""
echo -e "${YELLOW}📋 已创建的 Skills：${NC}"
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
echo -e "${YELLOW}💡 提示：${NC}"
echo "   - 按 Ctrl+C 停止所有服务"
echo "   - 后端日志: /tmp/ccaas-backend.log"
echo "   - Demo 日志: /tmp/ccaas-demo.log"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# 等待子进程
wait
