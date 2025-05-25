#!/bin/bash

# Google Cloud Setup Script for Manim Rendering Service
# This script sets up the necessary Google Cloud resources for the Manim rendering service

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-manim-next}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
SERVICE_NAME="manim-renderer"
BUCKET_NAME="${GCS_BUCKET_NAME:-manim-next-videos}"
SERVICE_ACCOUNT_NAME="manim-renderer-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "${BLUE}🚀 Setting up Google Cloud resources for Manim rendering service${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Service Name: ${SERVICE_NAME}${NC}"
echo -e "${BLUE}Bucket Name: ${BUCKET_NAME}${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if gcloud is installed
if ! command_exists gcloud; then
    echo -e "${RED}❌ Google Cloud SDK (gcloud) is not installed${NC}"
    echo -e "${YELLOW}Please install it from: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  You are not authenticated with Google Cloud${NC}"
    echo -e "${BLUE}Running: gcloud auth login${NC}"
    gcloud auth login
fi

# Set the project
echo -e "${BLUE}📋 Setting project to ${PROJECT_ID}${NC}"
gcloud config set project "${PROJECT_ID}"

# Check if project exists
if ! gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
    echo -e "${RED}❌ Project ${PROJECT_ID} does not exist${NC}"
    echo -e "${YELLOW}Please create the project first or set GOOGLE_CLOUD_PROJECT environment variable${NC}"
    exit 1
fi

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
apis=(
    "cloudbuild.googleapis.com"
    "run.googleapis.com"
    "storage.googleapis.com"
    "monitoring.googleapis.com"
    "logging.googleapis.com"
    "iam.googleapis.com"
    "containerregistry.googleapis.com"
    "artifactregistry.googleapis.com"
)

for api in "${apis[@]}"; do
    echo -e "${YELLOW}  Enabling ${api}...${NC}"
    gcloud services enable "${api}"
done

echo -e "${GREEN}✅ APIs enabled successfully${NC}"

# Create service account
echo -e "${BLUE}👤 Creating service account: ${SERVICE_ACCOUNT_NAME}${NC}"
if gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Service account already exists${NC}"
else
    gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
        --display-name="Manim Renderer Service Account" \
        --description="Service account for Manim rendering Cloud Run service"
    echo -e "${GREEN}✅ Service account created${NC}"
fi

# Grant necessary IAM roles to service account
echo -e "${BLUE}🔐 Granting IAM roles to service account...${NC}"
roles=(
    "roles/storage.admin"
    "roles/monitoring.metricWriter"
    "roles/logging.logWriter"
    "roles/cloudsql.client"
)

for role in "${roles[@]}"; do
    echo -e "${YELLOW}  Granting ${role}...${NC}"
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="${role}"
done

echo -e "${GREEN}✅ IAM roles granted successfully${NC}"

# Create Google Cloud Storage bucket
echo -e "${BLUE}🪣 Creating Google Cloud Storage bucket: ${BUCKET_NAME}${NC}"
if gsutil ls -b "gs://${BUCKET_NAME}" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Bucket already exists${NC}"
else
    gsutil mb -p "${PROJECT_ID}" -c STANDARD -l "${REGION}" "gs://${BUCKET_NAME}"
    echo -e "${GREEN}✅ Bucket created successfully${NC}"
fi

# Set bucket permissions
echo -e "${BLUE}🔒 Setting bucket permissions...${NC}"
gsutil iam ch "serviceAccount:${SERVICE_ACCOUNT_EMAIL}:roles/storage.admin" "gs://${BUCKET_NAME}"

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on "gs://${BUCKET_NAME}"

# Set bucket lifecycle policy to delete old files
echo -e "${BLUE}♻️  Setting bucket lifecycle policy...${NC}"
cat > /tmp/lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "matchesStorageClass": ["STANDARD"]
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/lifecycle.json "gs://${BUCKET_NAME}"
rm /tmp/lifecycle.json

echo -e "${GREEN}✅ Bucket configured successfully${NC}"

# Create Artifact Registry repository (for newer Docker images)
echo -e "${BLUE}📦 Creating Artifact Registry repository...${NC}"
REPO_NAME="manim-renderer"
if gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Artifact Registry repository already exists${NC}"
else
    gcloud artifacts repositories create "${REPO_NAME}" \
        --repository-format=docker \
        --location="${REGION}" \
        --description="Docker repository for Manim renderer"
    echo -e "${GREEN}✅ Artifact Registry repository created${NC}"
fi

# Configure Docker authentication for Artifact Registry
echo -e "${BLUE}🔑 Configuring Docker authentication...${NC}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev"

# Create environment file for deployment
echo -e "${BLUE}📝 Creating environment configuration...${NC}"
cat > .env.gcp << EOF
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=${PROJECT_ID}
GOOGLE_CLOUD_REGION=${REGION}
GCS_BUCKET_NAME=${BUCKET_NAME}
SERVICE_ACCOUNT_EMAIL=${SERVICE_ACCOUNT_EMAIL}
ARTIFACT_REGISTRY_REPO=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}

# Service Configuration
SERVICE_NAME=${SERVICE_NAME}
MAX_RENDER_TIME=3600
DEFAULT_QUALITY=medium_quality
DEFAULT_FORMAT=mp4

# Cloud Run Configuration
MEMORY=2Gi
CPU=2
TIMEOUT=3600
CONCURRENCY=1
MIN_INSTANCES=0
MAX_INSTANCES=10
EOF

echo -e "${GREEN}✅ Environment configuration saved to .env.gcp${NC}"

# Create a test script
echo -e "${BLUE}🧪 Creating test script...${NC}"
cat > test-service.sh << 'EOF'
#!/bin/bash

# Test script for Manim rendering service
set -e

# Load environment
source .env.gcp

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Manim rendering service...${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${GOOGLE_CLOUD_REGION} --format="value(status.url)")

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Service not found. Please deploy first."
    exit 1
fi

echo -e "${BLUE}Service URL: ${SERVICE_URL}${NC}"

# Test health endpoint
echo -e "${BLUE}Testing health endpoint...${NC}"
curl -s "${SERVICE_URL}/health" | jq .

# Test render endpoint with a simple script
echo -e "${BLUE}Testing render endpoint...${NC}"
cat > test_script.json << 'SCRIPT_EOF'
{
  "script": "from manim import *\n\nclass TestScene(Scene):\n    def construct(self):\n        text = Text('Hello from Cloud!')\n        self.play(Write(text))\n        self.wait(2)",
  "quality": "low_quality",
  "format": "mp4"
}
SCRIPT_EOF

curl -X POST \
  -H "Content-Type: application/json" \
  -d @test_script.json \
  "${SERVICE_URL}/render" | jq .

rm test_script.json

echo -e "${GREEN}✅ Test completed${NC}"
EOF

chmod +x test-service.sh

echo -e "${GREEN}✅ Test script created: test-service.sh${NC}"

# Summary
echo ""
echo -e "${GREEN}🎉 Google Cloud setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  Project ID: ${PROJECT_ID}"
echo -e "  Region: ${REGION}"
echo -e "  Service Account: ${SERVICE_ACCOUNT_EMAIL}"
echo -e "  Storage Bucket: gs://${BUCKET_NAME}"
echo -e "  Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "  1. Run ${YELLOW}./deploy.sh${NC} to build and deploy the service"
echo -e "  2. Run ${YELLOW}./test-service.sh${NC} to test the deployed service"
echo ""
echo -e "${BLUE}💡 Configuration saved to .env.gcp${NC}"
echo -e "${BLUE}💡 Load it with: ${YELLOW}source .env.gcp${NC}" 