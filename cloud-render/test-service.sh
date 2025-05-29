#!/bin/bash

# # Test script for Manim rendering service
# set -e

# # Load environment
# source .env.gcp

# # Colors
# GREEN='\033[0;32m'
# BLUE='\033[0;34m'
# NC='\033[0m'

# echo -e "${BLUE}🧪 Testing Manim rendering service...${NC}"

# # Get the service URL
# SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${GOOGLE_CLOUD_REGION} --format="value(status.url)")

# if [ -z "$SERVICE_URL" ]; then
#     echo "❌ Service not found. Please deploy first."
#     exit 1
# fi

# echo -e "${BLUE}Service URL: ${SERVICE_URL}${NC}"

# # Test health endpoint
# echo -e "${BLUE}Testing health endpoint...${NC}"
# curl -s "${SERVICE_URL}/health" | jq .

# # Test render endpoint with a simple script
# echo -e "${BLUE}Testing render endpoint...${NC}"
# cat > test_script.json << 'SCRIPT_EOF'
# {
#   "script": "from manim import *\n\nclass TestScene(Scene):\n    def construct(self):\n        text = Text('Hello from Cloud!')\n        self.play(Write(text))\n        self.wait(2)",
#   "quality": "production",
#   "format": "mp4"
# }
# SCRIPT_EOF

# curl -X POST \
#   -H "Content-Type: application/json" \
#   -d @test_script.json \
#   "${SERVICE_URL}/render" | jq .

# rm test_script.json

# echo -e "${GREEN}✅ Test completed${NC}"


#!/bin/bash
# Test script for Manim rendering service
set -e

# Load environment
source .env.gcp

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Manim rendering service...${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${GOOGLE_CLOUD_REGION} --format="value(status.url)")

if [ -z "$SERVICE_URL" ]; then
    echo -e "${RED}❌ Service not found. Please deploy first.${NC}"
    exit 1
fi

echo -e "${BLUE}Service URL: ${SERVICE_URL}${NC}"

# Test health endpoint
echo -e "${BLUE}Testing health endpoint...${NC}"
health_response=$(curl -s "${SERVICE_URL}/health")
echo "$health_response" | jq .

# Check if health endpoint is working
if echo "$health_response" | jq -e '.status == "healthy"' > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test render endpoint with debug first
echo -e "${BLUE}Testing debug endpoint to check Manim options...${NC}"

debug_response=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"script": "from manim import *", "debug": true}' \
  "${SERVICE_URL}/render" 2>/dev/null)

echo "$debug_response" | jq '.debug_info.help_output' -r | head -20

# Test render endpoint with a simple script
echo -e "${BLUE}Testing render endpoint...${NC}"

# Create JSON payload with proper escaping
cat > test_script.json << 'EOF'
{
  "script": "from manim import *\n\nclass TestScene(Scene):\n    def construct(self):\n        text = Text('Hello from Cloud!')\n        self.play(Write(text))\n        self.wait(2)",
  "quality": "medium_quality",
  "format": "mp4"
}
EOF

echo -e "${BLUE}Payload being sent:${NC}"
cat test_script.json | jq .

echo -e "${BLUE}Making render request...${NC}"
render_response=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d @test_script.json \
  "${SERVICE_URL}/render" 2>/dev/null)

echo "$render_response" | jq .

# Check if render was successful
if echo "$render_response" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ Render test passed${NC}"
    
    # Extract some info about the rendered video
    file_size=$(echo "$render_response" | jq -r '.file_size // .output.size_bytes')
    gcs_url=$(echo "$render_response" | jq -r '.gcs_url // .video_url')
    echo -e "${GREEN}📹 Rendered MP4 file: ${file_size} bytes${NC}"
    echo -e "${GREEN}🔗 Video URL: ${gcs_url}${NC}"
else
    echo -e "${RED}❌ Render test failed${NC}"
    error_msg=$(echo "$render_response" | jq -r '.error // "Unknown error"')
    echo -e "${RED}Error: ${error_msg}${NC}"
fi

# Test formats endpoint
echo -e "${BLUE}Testing formats endpoint...${NC}"
formats_response=$(curl -s "${SERVICE_URL}/formats")
echo "$formats_response" | jq .

# Clean up
rm -f test_script.json

echo -e "${GREEN}✅ Test completed${NC}"