#!/bin/bash

# Render.com Testing Script
# This script tests the Render.com Manim rendering service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Render.com Manim Rendering Service${NC}"
echo ""

# Check if SERVICE_URL is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Please provide the Render.com service URL${NC}"
    echo -e "${YELLOW}Usage: ./test-render-com.sh https://your-service.onrender.com${NC}"
    exit 1
fi

SERVICE_URL="$1"
echo -e "${BLUE}📋 Testing Service: ${SERVICE_URL}${NC}"
echo ""

# Test 1: Health Check
echo -e "${BLUE}🏥 Test 1: Health Check${NC}"
if curl -s -f "$SERVICE_URL/health" >/dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    curl -s "$SERVICE_URL/health" | jq . 2>/dev/null || curl -s "$SERVICE_URL/health"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo -e "${YELLOW}Service might still be starting up. Wait a few minutes and try again.${NC}"
    exit 1
fi
echo ""

# Test 2: Simple Rendering
echo -e "${BLUE}🎬 Test 2: Simple Script Rendering${NC}"
SIMPLE_SCRIPT='{
  "script": "from manim import *\n\nclass SimpleTest(Scene):\n    def construct(self):\n        text = Text(\"Hello from Render.com!\")\n        self.play(Write(text))\n        self.wait(2)",
  "quality": "low_quality",
  "format": "mp4"
}'

echo "Submitting simple script..."
SIMPLE_RESULT=$(curl -s -X POST "$SERVICE_URL/render" \
  -H "Content-Type: application/json" \
  -d "$SIMPLE_SCRIPT")

if echo "$SIMPLE_RESULT" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Simple rendering successful${NC}"
    echo "$SIMPLE_RESULT" | jq '{success, request_id, render_time, file_size, video_file_path}'
    
    # Test download endpoint
    REQUEST_ID=$(echo "$SIMPLE_RESULT" | jq -r '.request_id')
    echo "Testing download endpoint for request: $REQUEST_ID"
    if curl -s -f "$SERVICE_URL/download/$REQUEST_ID" -o /dev/null; then
        echo -e "${GREEN}✅ Download endpoint working${NC}"
    else
        echo -e "${YELLOW}⚠️  Download endpoint might not be ready yet${NC}"
    fi
else
    echo -e "${RED}❌ Simple rendering failed${NC}"
    echo "$SIMPLE_RESULT" | jq . 2>/dev/null || echo "$SIMPLE_RESULT"
    exit 1
fi
echo ""

# Test 3: Complex Rendering
echo -e "${BLUE}🧮 Test 3: Complex Script Rendering${NC}"
COMPLEX_SCRIPT='{
  "script": "from manim import *\n\nclass MathDemo(Scene):\n    def construct(self):\n        title = Text(\"Mathematical Animation\", font_size=48)\n        title.set_color(BLUE)\n        title.to_edge(UP)\n        self.play(Write(title))\n        self.wait(1)\n        \n        # Create equation\n        equation = MathTex(\"E = mc^2\")\n        equation.scale(2)\n        equation.set_color(YELLOW)\n        self.play(Write(equation))\n        self.wait(1)\n        \n        # Create circle\n        circle = Circle(radius=1, color=RED)\n        circle.next_to(equation, DOWN, buff=1)\n        self.play(Create(circle))\n        self.wait(1)\n        \n        # Transform\n        square = Square(side_length=2, color=GREEN)\n        square.move_to(circle.get_center())\n        self.play(Transform(circle, square))\n        self.wait(2)",
  "quality": "medium_quality",
  "format": "mp4"
}'

echo "Submitting complex script..."
COMPLEX_RESULT=$(curl -s -X POST "$SERVICE_URL/render" \
  -H "Content-Type: application/json" \
  -d "$COMPLEX_SCRIPT")

if echo "$COMPLEX_RESULT" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Complex rendering successful${NC}"
    echo "$COMPLEX_RESULT" | jq '{success, request_id, render_time, file_size, video_file_path}'
else
    echo -e "${RED}❌ Complex rendering failed${NC}"
    echo "$COMPLEX_RESULT" | jq . 2>/dev/null || echo "$COMPLEX_RESULT"
    exit 1
fi
echo ""

# Test 4: Base64 Return Test
echo -e "${BLUE}📦 Test 4: Base64 Video Return${NC}"
BASE64_SCRIPT='{
  "script": "from manim import *\n\nclass QuickTest(Scene):\n    def construct(self):\n        dot = Dot(color=RED)\n        self.add(dot)\n        self.wait(1)",
  "quality": "low_quality",
  "format": "mp4",
  "return_base64": true
}'

echo "Submitting script with base64 return..."
BASE64_RESULT=$(curl -s -X POST "$SERVICE_URL/render" \
  -H "Content-Type: application/json" \
  -d "$BASE64_SCRIPT")

if echo "$BASE64_RESULT" | jq -e '.success' >/dev/null 2>&1; then
    HAS_BASE64=$(echo "$BASE64_RESULT" | jq -r '.video_base64 // "null"')
    VIDEO_SIZE_MB=$(echo "$BASE64_RESULT" | jq -r '.video_size_mb // "unknown"')
    
    if [ "$HAS_BASE64" != "null" ]; then
        echo -e "${GREEN}✅ Base64 video return successful${NC}"
        echo "Video size: ${VIDEO_SIZE_MB} MB"
        echo "$BASE64_RESULT" | jq '{success, request_id, render_time, file_size, video_size_mb}'
    else
        echo -e "${YELLOW}⚠️  Base64 data not returned${NC}"
    fi
else
    echo -e "${RED}❌ Base64 rendering failed${NC}"
    echo "$BASE64_RESULT" | jq . 2>/dev/null || echo "$BASE64_RESULT"
fi
echo ""

# Test 5: Error Handling
echo -e "${BLUE}🚫 Test 5: Error Handling (Invalid Script)${NC}"
INVALID_SCRIPT='{
  "script": "invalid python code that should fail",
  "quality": "low_quality",
  "format": "mp4"
}'

echo "Submitting invalid script..."
INVALID_RESULT=$(curl -s -X POST "$SERVICE_URL/render" \
  -H "Content-Type: application/json" \
  -d "$INVALID_SCRIPT")

if echo "$INVALID_RESULT" | jq -e '.success == false' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Error handling works correctly${NC}"
    echo "$INVALID_RESULT" | jq '{success, error}'
else
    echo -e "${YELLOW}⚠️  Error handling might not be working as expected${NC}"
    echo "$INVALID_RESULT" | jq . 2>/dev/null || echo "$INVALID_RESULT"
fi
echo ""

# Test 6: Status Endpoint
echo -e "${BLUE}📊 Test 6: Status Endpoint${NC}"
if [ ! -z "$REQUEST_ID" ]; then
    echo "Checking status for request: $REQUEST_ID"
    STATUS_RESULT=$(curl -s "$SERVICE_URL/status/$REQUEST_ID")
    
    if echo "$STATUS_RESULT" | jq -e '.status' >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Status endpoint working${NC}"
        echo "$STATUS_RESULT" | jq '{request_id, status, file_size, download_url}'
    else
        echo -e "${YELLOW}⚠️  Status endpoint might not be working${NC}"
        echo "$STATUS_RESULT"
    fi
else
    echo -e "${YELLOW}⚠️  No request ID available for status test${NC}"
fi
echo ""

# Test 7: Performance Check
echo -e "${BLUE}⚡ Test 7: Performance Check${NC}"
echo "Testing response time..."

START_TIME=$(date +%s)
PERF_RESULT=$(curl -s -X POST "$SERVICE_URL/render" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "from manim import *\n\nclass QuickTest(Scene):\n    def construct(self):\n        dot = Dot()\n        self.add(dot)\n        self.wait(1)",
    "quality": "low_quality",
    "format": "mp4"
  }')
END_TIME=$(date +%s)

RESPONSE_TIME=$((END_TIME - START_TIME))
echo "Total response time: ${RESPONSE_TIME}s"

if echo "$PERF_RESULT" | jq -e '.success' >/dev/null 2>&1; then
    RENDER_TIME=$(echo "$PERF_RESULT" | jq -r '.render_time // "unknown"')
    echo "Actual render time: ${RENDER_TIME}s"
    echo -e "${GREEN}✅ Performance test completed${NC}"
else
    echo -e "${YELLOW}⚠️  Performance test failed${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}🎉 Render.com Testing Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  Service URL: ${SERVICE_URL}"
echo -e "  Platform: Render.com"
echo -e "  Storage: Direct video return (no cloud storage needed)"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo -e "  1. If all tests passed, you can proceed with Next.js integration"
echo -e "  2. Set RENDER_SERVICE_URL=${SERVICE_URL} in your environment"
echo -e "  3. No AWS setup required - videos are returned directly!"
echo ""

# Save service info for later use
cat > render-service-info.json << EOF
{
  "service_url": "$SERVICE_URL",
  "platform": "render.com",
  "storage_mode": "direct_return",
  "tested_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✅ Service information saved to render-service-info.json${NC}"
echo -e "${BLUE}💡 Use this file to configure your Next.js environment variables${NC}" 