#!/bin/bash

# Google Cloud Only Testing Script
# This script tests the Google Cloud rendering service independently
# Run this before deploying to Vercel to ensure cloud rendering works

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Google Cloud Rendering Service Only${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "cloud-render" ]; then
    echo -e "${RED}❌ cloud-render directory not found${NC}"
    echo -e "${YELLOW}Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found${NC}"
    echo -e "${YELLOW}Please install Google Cloud SDK first${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  You are not authenticated with Google Cloud${NC}"
    echo -e "${BLUE}Please run: gcloud auth login${NC}"
    exit 1
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${RED}❌ No Google Cloud project set${NC}"
    echo -e "${YELLOW}Please set a project: gcloud config set project YOUR_PROJECT_ID${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Current Google Cloud Project: ${CURRENT_PROJECT}${NC}"

# Check if service exists
REGION=${GOOGLE_CLOUD_REGION:-us-central1}
SERVICE_NAME="manim-renderer"

echo -e "${BLUE}🔍 Checking if service exists in region: ${REGION}${NC}"

if ! gcloud run services describe $SERVICE_NAME --region=$REGION &>/dev/null; then
    echo -e "${RED}❌ Service '$SERVICE_NAME' not found in region '$REGION'${NC}"
    echo -e "${YELLOW}Please deploy the service first:${NC}"
    echo -e "${YELLOW}  cd cloud-render${NC}"
    echo -e "${YELLOW}  ./setup-gcp.sh${NC}"
    echo -e "${YELLOW}  ./deploy.sh${NC}"
    exit 1
fi

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo -e "${GREEN}✅ Service found: ${SERVICE_URL}${NC}"
echo ""

# Test 1: Health Check
echo -e "${BLUE}🏥 Test 1: Health Check${NC}"
if curl -s -f "$SERVICE_URL/health" >/dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    curl -s "$SERVICE_URL/health" | jq . 2>/dev/null || curl -s "$SERVICE_URL/health"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Simple Rendering
echo -e "${BLUE}🎬 Test 2: Simple Script Rendering${NC}"
SIMPLE_SCRIPT='{
  "script": "from manim import *\n\nclass SimpleTest(Scene):\n    def construct(self):\n        text = Text(\"Hello from Cloud!\")\n        self.play(Write(text))\n        self.wait(2)",
  "quality": "low_quality",
  "format": "mp4"
}'

echo "Submitting simple script..."
SIMPLE_RESULT=$(curl -s -X POST "$SERVICE_URL/render" \
  -H "Content-Type: application/json" \
  -d "$SIMPLE_SCRIPT")

if echo "$SIMPLE_RESULT" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Simple rendering successful${NC}"
    echo "$SIMPLE_RESULT" | jq '{success, request_id, render_time, file_size, gcs_url}'
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
    echo "$COMPLEX_RESULT" | jq '{success, request_id, render_time, file_size, gcs_url}'
else
    echo -e "${RED}❌ Complex rendering failed${NC}"
    echo "$COMPLEX_RESULT" | jq . 2>/dev/null || echo "$COMPLEX_RESULT"
    exit 1
fi
echo ""

# Test 4: Error Handling
echo -e "${BLUE}🚫 Test 4: Error Handling (Invalid Script)${NC}"
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

# Test 5: Storage Check
echo -e "${BLUE}💾 Test 5: Storage Verification${NC}"
BUCKET_NAME=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(spec.template.spec.template.spec.containers[0].env[?name=='GCS_BUCKET_NAME'].value)" 2>/dev/null)

if [ -z "$BUCKET_NAME" ]; then
    # Try to get from .env.gcp if it exists
    if [ -f "cloud-render/.env.gcp" ]; then
        BUCKET_NAME=$(grep "GCS_BUCKET_NAME=" cloud-render/.env.gcp | cut -d'=' -f2)
    fi
fi

if [ -n "$BUCKET_NAME" ]; then
    echo "Checking bucket: $BUCKET_NAME"
    if gsutil ls "gs://$BUCKET_NAME" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Storage bucket accessible${NC}"
        VIDEO_COUNT=$(gsutil ls "gs://$BUCKET_NAME/videos/" 2>/dev/null | wc -l || echo "0")
        echo "Videos in storage: $VIDEO_COUNT"
    else
        echo -e "${YELLOW}⚠️  Storage bucket not accessible or empty${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not determine bucket name${NC}"
fi
echo ""

# Test 6: Performance Check
echo -e "${BLUE}⚡ Test 6: Performance Check${NC}"
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
echo -e "${GREEN}🎉 Google Cloud Testing Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  Service URL: ${SERVICE_URL}"
echo -e "  Region: ${REGION}"
echo -e "  Project: ${CURRENT_PROJECT}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo -e "  1. If all tests passed, you can proceed with Vercel deployment"
echo -e "  2. Set CLOUD_RUN_SERVICE_URL=${SERVICE_URL} in your environment"
echo -e "  3. Follow the Vercel deployment steps in DEPLOYMENT_GUIDE.md"
echo ""

# Save service info for later use
cat > gcp-service-info.json << EOF
{
  "service_url": "$SERVICE_URL",
  "service_name": "$SERVICE_NAME",
  "region": "$REGION",
  "project_id": "$CURRENT_PROJECT",
  "tested_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✅ Service information saved to gcp-service-info.json${NC}"
echo -e "${BLUE}💡 Use this file to configure your Next.js environment variables${NC}" 