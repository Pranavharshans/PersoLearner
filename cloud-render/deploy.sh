#!/bin/bash

# Deployment Script for Manim Rendering Service
# This script builds and deploys the Manim rendering service to Google Cloud Run

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment configuration
if [ -f ".env.gcp" ]; then
    source .env.gcp
    echo -e "${GREEN}✅ Loaded configuration from .env.gcp${NC}"
else
    echo -e "${RED}❌ .env.gcp file not found${NC}"
    echo -e "${YELLOW}Please run ./setup-gcp.sh first${NC}"
    exit 1
fi

# Validate required variables
required_vars=(
    "GOOGLE_CLOUD_PROJECT"
    "GOOGLE_CLOUD_REGION"
    "SERVICE_NAME"
    "ARTIFACT_REGISTRY_REPO"
    "SERVICE_ACCOUNT_EMAIL"
    "GCS_BUCKET_NAME"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required variable ${var} is not set${NC}"
        exit 1
    fi
done

echo -e "${BLUE}🚀 Deploying Manim rendering service to Google Cloud Run${NC}"
echo -e "${BLUE}Project: ${GOOGLE_CLOUD_PROJECT}${NC}"
echo -e "${BLUE}Region: ${GOOGLE_CLOUD_REGION}${NC}"
echo -e "${BLUE}Service: ${SERVICE_NAME}${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
for tool in gcloud docker; do
    if ! command_exists "$tool"; then
        echo -e "${RED}❌ $tool is not installed${NC}"
        exit 1
    fi
done

# Set gcloud project
echo -e "${BLUE}📋 Setting gcloud project...${NC}"
gcloud config set project "${GOOGLE_CLOUD_PROJECT}"

# Build timestamp for image tagging
BUILD_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="${ARTIFACT_REGISTRY_REPO}/${SERVICE_NAME}:${BUILD_TIMESTAMP}"
LATEST_TAG="${ARTIFACT_REGISTRY_REPO}/${SERVICE_NAME}:latest"

echo -e "${BLUE}🏗️  Building Docker image...${NC}"
echo -e "${YELLOW}Image tag: ${IMAGE_TAG}${NC}"

# Build the Docker image
docker build \
    --platform linux/amd64 \
    --tag "${IMAGE_TAG}" \
    --tag "${LATEST_TAG}" \
    --build-arg BUILD_TIMESTAMP="${BUILD_TIMESTAMP}" \
    .

echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Push the image to Artifact Registry
echo -e "${BLUE}📤 Pushing image to Artifact Registry...${NC}"
docker push "${IMAGE_TAG}"
docker push "${LATEST_TAG}"

echo -e "${GREEN}✅ Image pushed successfully${NC}"

# Deploy to Cloud Run
echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"

# Prepare environment variables for Cloud Run
ENV_VARS=(
    "GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}"
    "GCS_BUCKET_NAME=${GCS_BUCKET_NAME}"
    "MAX_RENDER_TIME=${MAX_RENDER_TIME:-3600}"
    "DEFAULT_QUALITY=${DEFAULT_QUALITY:-medium_quality}"
    "DEFAULT_FORMAT=${DEFAULT_FORMAT:-mp4}"
    "FLASK_DEBUG=false"
)

# Convert array to comma-separated string
ENV_VARS_STRING=$(IFS=,; echo "${ENV_VARS[*]}")

# Deploy the service
gcloud run deploy "${SERVICE_NAME}" \
    --image="${IMAGE_TAG}" \
    --region="${GOOGLE_CLOUD_REGION}" \
    --service-account="${SERVICE_ACCOUNT_EMAIL}" \
    --memory="${MEMORY:-2Gi}" \
    --cpu="${CPU:-2}" \
    --timeout="${TIMEOUT:-3600}" \
    --concurrency="${CONCURRENCY:-1}" \
    --min-instances="${MIN_INSTANCES:-0}" \
    --max-instances="${MAX_INSTANCES:-3}" \
    --set-env-vars="${ENV_VARS_STRING}" \
    --allow-unauthenticated \
    --port=8080 \
    --execution-environment=gen2 \
    --cpu-boost \
    --session-affinity

echo -e "${GREEN}✅ Service deployed successfully${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --region="${GOOGLE_CLOUD_REGION}" \
    --format="value(status.url)")

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Service Information:${NC}"
echo -e "  Service Name: ${SERVICE_NAME}"
echo -e "  Service URL: ${SERVICE_URL}"
echo -e "  Region: ${GOOGLE_CLOUD_REGION}"
echo -e "  Image: ${IMAGE_TAG}"
echo ""

# Test the health endpoint
echo -e "${BLUE}🏥 Testing health endpoint...${NC}"
if curl -s -f "${SERVICE_URL}/health" >/dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    
    # Show health response
    echo -e "${BLUE}Health response:${NC}"
    curl -s "${SERVICE_URL}/health" | jq . || curl -s "${SERVICE_URL}/health"
else
    echo -e "${YELLOW}⚠️  Health check failed - service may still be starting${NC}"
fi

echo ""
echo -e "${BLUE}📝 Available endpoints:${NC}"
echo -e "  Health: ${SERVICE_URL}/health"
echo -e "  Render: ${SERVICE_URL}/render (POST)"
echo -e "  Status: ${SERVICE_URL}/status/<request_id> (GET)"
echo ""

# Create a simple test script
echo -e "${BLUE}📝 Creating quick test script...${NC}"
cat > quick-test.sh << EOF
#!/bin/bash

# Quick test script for the deployed service
SERVICE_URL="${SERVICE_URL}"

echo "🧪 Testing Manim rendering service..."
echo "Service URL: \${SERVICE_URL}"
echo ""

# Test health
echo "Testing health endpoint..."
curl -s "\${SERVICE_URL}/health" | jq .
echo ""

# Test render with simple script
echo "Testing render endpoint..."
curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{
    "script": "from manim import *\\n\\nclass TestScene(Scene):\\n    def construct(self):\\n        text = Text(\"Hello from Cloud!\")\\n        self.play(Write(text))\\n        self.wait(2)",
    "quality": "low_quality",
    "format": "mp4"
  }' \\
  "\${SERVICE_URL}/render" | jq .

echo ""
echo "✅ Test completed"
EOF

chmod +x quick-test.sh

echo -e "${GREEN}✅ Quick test script created: quick-test.sh${NC}"

# Show logs command
echo ""
echo -e "${BLUE}📊 Useful commands:${NC}"
echo -e "  View logs: ${YELLOW}gcloud run services logs tail ${SERVICE_NAME} --region=${GOOGLE_CLOUD_REGION}${NC}"
echo -e "  Update service: ${YELLOW}./deploy.sh${NC}"
echo -e "  Test service: ${YELLOW}./quick-test.sh${NC}"
echo -e "  Full test: ${YELLOW}./test-service.sh${NC}"
echo ""

# Save deployment info
cat > deployment-info.json << EOF
{
  "service_name": "${SERVICE_NAME}",
  "service_url": "${SERVICE_URL}",
  "region": "${GOOGLE_CLOUD_REGION}",
  "project_id": "${GOOGLE_CLOUD_PROJECT}",
  "image": "${IMAGE_TAG}",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "build_timestamp": "${BUILD_TIMESTAMP}"
}
EOF

echo -e "${GREEN}✅ Deployment info saved to deployment-info.json${NC}"

# Optional: Open service URL in browser (if running locally)
if command_exists open && [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}🌐 Opening service URL in browser...${NC}"
    open "${SERVICE_URL}/health"
elif command_exists xdg-open && [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${BLUE}🌐 Opening service URL in browser...${NC}"
    xdg-open "${SERVICE_URL}/health"
fi

echo ""
echo -e "${GREEN}🚀 Deployment complete! Your Manim rendering service is ready.${NC}" 