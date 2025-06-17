# Migrating Manim Rendering Service to Oracle Cloud Infrastructure (OCI)

This guide will help you migrate your Manim rendering service from Google Cloud Run to Oracle Cloud Infrastructure's Always Free tier, which includes:

- **Compute**: Arm-based Ampere A1 cores (4 OCPUs, 24GB RAM)
- **Storage**: 200GB Block Volume + 10GB Object Storage
- **Network**: Always Free networking resources

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [OCI Account Setup](#oci-account-setup)
3. [OCI CLI Installation](#oci-cli-installation)
4. [Create OCI Resources](#create-oci-resources)
5. [Application Migration](#application-migration)
6. [Deployment](#deployment)
7. [Testing](#testing)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

- Oracle Cloud Infrastructure (OCI) account with Always Free tier
- Local development environment with Docker
- SSH client
- Basic understanding of cloud computing concepts

## OCI Account Setup

### 1. Create OCI Account

1. Go to [Oracle Cloud](https://www.oracle.com/cloud/free/)
2. Sign up for a free account
3. Complete the verification process
4. Access the OCI Console

### 2. Gather Required Information

Once logged into OCI Console, collect these values:

- **Tenancy OCID**: Found in Profile → Tenancy
- **User OCID**: Found in Profile → User Settings
- **Region**: Choose your preferred region (e.g., `us-phoenix-1`)
- **Compartment OCID**: Use root compartment or create a new one

### 3. Create API Key

1. Go to Profile → User Settings
2. Click "API Keys" in the left menu
3. Click "Add API Key"
4. Choose "Generate API Key Pair"
5. Download both private and public keys
6. Copy the configuration file content shown
7. Note the fingerprint value

## OCI CLI Installation

### On macOS:
```bash
brew install oci-cli
```

### On Linux:
```bash
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
```

### On Windows:
Download from [OCI CLI Releases](https://github.com/oracle/oci-cli/releases)

### Configure OCI CLI:
```bash
oci setup config
```

Follow the prompts and enter the values you collected earlier.

## Create OCI Resources

### 1. Create Object Storage Bucket

```bash
# Get your namespace
NAMESPACE=$(oci os ns get --query 'data' --raw-output)

# Create bucket for videos
oci os bucket create \
    --compartment-id YOUR_COMPARTMENT_ID \
    --namespace-name $NAMESPACE \
    --name manim-videos \
    --public-access-type ObjectRead
```

### 2. Create Virtual Cloud Network (VCN)

```bash
# Create VCN
VCN_ID=$(oci network vcn create \
    --compartment-id YOUR_COMPARTMENT_ID \
    --display-name "manim-vcn" \
    --cidr-block "10.0.0.0/16" \
    --query 'data.id' \
    --raw-output)

# Create Internet Gateway
IGW_ID=$(oci network internet-gateway create \
    --compartment-id YOUR_COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "manim-igw" \
    --is-enabled true \
    --query 'data.id' \
    --raw-output)

# Create Route Table
RT_ID=$(oci network route-table create \
    --compartment-id YOUR_COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "manim-rt" \
    --route-rules '[{"destination": "0.0.0.0/0", "networkEntityId": "'$IGW_ID'"}]' \
    --query 'data.id' \
    --raw-output)

# Create Security List
SL_ID=$(oci network security-list create \
    --compartment-id YOUR_COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "manim-sl" \
    --egress-security-rules '[{"destination": "0.0.0.0/0", "protocol": "all", "isStateless": false}]' \
    --ingress-security-rules '[
        {"source": "0.0.0.0/0", "protocol": "6", "isStateless": false, "tcpOptions": {"destinationPortRange": {"min": 22, "max": 22}}},
        {"source": "0.0.0.0/0", "protocol": "6", "isStateless": false, "tcpOptions": {"destinationPortRange": {"min": 8080, "max": 8080}}}
    ]' \
    --query 'data.id' \
    --raw-output)

# Create Subnet
SUBNET_ID=$(oci network subnet create \
    --compartment-id YOUR_COMPARTMENT_ID \
    --vcn-id $VCN_ID \
    --display-name "manim-subnet" \
    --cidr-block "10.0.1.0/24" \
    --route-table-id $RT_ID \
    --security-list-ids '["'$SL_ID'"]' \
    --query 'data.id' \
    --raw-output)
```

### 3. Create SSH Key Pair

```bash
ssh-keygen -t rsa -b 2048 -f ~/.ssh/oci_manim_key -N ""
```

## Application Migration

### 1. Update Dependencies

Create a new `requirements-oci.txt` file:

```txt
# Core Manim dependencies
manim==0.18.0
numpy==1.24.3
scipy==1.11.1
matplotlib==3.7.2
Pillow==9.5.0

# Web framework
Flask==2.3.2
Flask-CORS==4.0.0
gunicorn==21.2.0

# Oracle Cloud Infrastructure SDK
oci==2.112.1

# Utility libraries
requests==2.31.0
python-dotenv==1.0.0
pydantic==2.1.1
typing-extensions==4.7.1

# Video processing
opencv-python-headless==4.8.0.74

# Logging and monitoring
structlog==23.1.0
prometheus-client==0.17.1

# Development and testing
pytest==7.4.0
pytest-asyncio==0.21.1
```

### 2. Update Application Code

Modify your `app.py` to use OCI SDK instead of Google Cloud SDK:

#### Key Changes:

1. **Replace Google Cloud imports:**
   ```python
   # OLD (Google Cloud)
   from google.cloud import storage, monitoring_v3, logging as cloud_logging
   from google.auth import default
   
   # NEW (Oracle Cloud)
   import oci
   from oci.object_storage import ObjectStorageClient
   from oci.monitoring import MonitoringClient
   ```

2. **Update configuration:**
   ```python
   class Config:
       # OCI Configuration
       TENANCY_ID = os.getenv('OCI_TENANCY_ID')
       USER_ID = os.getenv('OCI_USER_ID')
       FINGERPRINT = os.getenv('OCI_FINGERPRINT')
       PRIVATE_KEY_PATH = os.getenv('OCI_PRIVATE_KEY_PATH', '/app/oci_private_key.pem')
       REGION = os.getenv('OCI_REGION', 'us-phoenix-1')
       COMPARTMENT_ID = os.getenv('OCI_COMPARTMENT_ID')
       
       # Object Storage
       NAMESPACE = os.getenv('OCI_NAMESPACE')
       BUCKET_NAME = os.getenv('OCI_BUCKET_NAME', 'manim-videos')
   ```

3. **Update client initialization:**
   ```python
   # Create OCI config
   oci_config = {
       "user": config.USER_ID,
       "key_file": config.PRIVATE_KEY_PATH,
       "fingerprint": config.FINGERPRINT,
       "tenancy": config.TENANCY_ID,
       "region": config.REGION
   }
   
   # Initialize OCI clients
   object_storage_client = ObjectStorageClient(oci_config)
   monitoring_client = MonitoringClient(oci_config)
   ```

4. **Update file upload method:**
   ```python
   def _upload_to_oci_storage(self, local_file: Path, object_name: str) -> str:
       with open(local_file, 'rb') as file_data:
           self.object_storage_client.put_object(
               namespace_name=self.namespace,
               bucket_name=self.bucket_name,
               object_name=object_name,
               put_object_body=file_data,
               content_type='video/mp4'
           )
       
       object_url = f"https://objectstorage.{config.REGION}.oraclecloud.com/n/{self.namespace}/b/{self.bucket_name}/o/{object_name}"
       return object_url
   ```

### 3. Create ARM-Compatible Dockerfile

Create `Dockerfile.oci`:

```dockerfile
# Multi-stage build optimized for Oracle Cloud ARM instances
FROM python:3.11-slim-bullseye

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    wget \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-science \
    texlive-pictures \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf2.0-dev \
    libffi-dev \
    shared-mime-info \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements-oci.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Create directories
RUN mkdir -p /app/output /app/temp /app/logs \
    && chmod 755 /app/output /app/temp /app/logs

# Copy application code
COPY app.py .

# Create non-root user
RUN useradd --create-home --shell /bin/bash manim \
    && chown -R manim:manim /app
USER manim

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

ENTRYPOINT ["python", "app.py"]
```

### 4. Create Docker Compose File

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  manim-renderer:
    build:
      context: .
      dockerfile: Dockerfile.oci
    ports:
      - "8080:8080"
    environment:
      - OCI_TENANCY_ID=${OCI_TENANCY_ID}
      - OCI_USER_ID=${OCI_USER_ID}
      - OCI_FINGERPRINT=${OCI_FINGERPRINT}
      - OCI_PRIVATE_KEY_PATH=/app/oci_private_key.pem
      - OCI_REGION=${OCI_REGION}
      - OCI_COMPARTMENT_ID=${OCI_COMPARTMENT_ID}
      - OCI_NAMESPACE=${OCI_NAMESPACE}
      - OCI_BUCKET_NAME=${OCI_BUCKET_NAME}
      - MAX_RENDER_TIME=3600
      - DEFAULT_QUALITY=medium_quality
      - DEFAULT_FORMAT=mp4
    volumes:
      - ./output:/app/output
      - ./logs:/app/logs
      - ./oci_private_key.pem:/app/oci_private_key.pem:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Deployment

### 1. Create Compute Instance

```bash
# Get the latest Ubuntu ARM image
IMAGE_ID=$(oci compute image list \
    --compartment-id YOUR_COMPARTMENT_ID \
    --operating-system "Canonical Ubuntu" \
    --shape "VM.Standard.A1.Flex" \
    --sort-by "TIMECREATED" \
    --sort-order "DESC" \
    --query 'data[0].id' \
    --raw-output)

# Create instance
INSTANCE_ID=$(oci compute instance launch \
    --compartment-id YOUR_COMPARTMENT_ID \
    --display-name "manim-renderer" \
    --availability-domain "$(oci iam availability-domain list --compartment-id YOUR_COMPARTMENT_ID --query 'data[0].name' --raw-output)" \
    --shape "VM.Standard.A1.Flex" \
    --shape-config '{"ocpus": 4, "memoryInGBs": 24}' \
    --image-id $IMAGE_ID \
    --subnet-id $SUBNET_ID \
    --ssh-authorized-keys-file ~/.ssh/oci_manim_key.pub \
    --boot-volume-size-in-gbs 200 \
    --query 'data.id' \
    --raw-output)

# Wait for instance to be running
oci compute instance get --instance-id $INSTANCE_ID --wait-for-state "RUNNING"

# Get public IP
PUBLIC_IP=$(oci compute instance list-vnics \
    --instance-id $INSTANCE_ID \
    --query 'data[0]."public-ip"' \
    --raw-output)

echo "Instance created with IP: $PUBLIC_IP"
```

### 2. Setup Instance

```bash
# SSH into the instance
ssh -i ~/.ssh/oci_manim_key ubuntu@$PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)" -- --accept-all-defaults

# Create application directory
mkdir -p ~/manim-renderer
```

### 3. Deploy Application

```bash
# Copy files to instance
scp -i ~/.ssh/oci_manim_key app.py requirements-oci.txt Dockerfile.oci docker-compose.yml ubuntu@$PUBLIC_IP:~/manim-renderer/

# Copy OCI private key
scp -i ~/.ssh/oci_manim_key YOUR_OCI_PRIVATE_KEY.pem ubuntu@$PUBLIC_IP:~/manim-renderer/oci_private_key.pem

# SSH back into instance
ssh -i ~/.ssh/oci_manim_key ubuntu@$PUBLIC_IP

# Set up environment
cd ~/manim-renderer
chmod 600 oci_private_key.pem

# Create environment file
cat > .env << EOF
OCI_TENANCY_ID=YOUR_TENANCY_ID
OCI_USER_ID=YOUR_USER_ID
OCI_FINGERPRINT=YOUR_FINGERPRINT
OCI_REGION=YOUR_REGION
OCI_COMPARTMENT_ID=YOUR_COMPARTMENT_ID
OCI_NAMESPACE=YOUR_NAMESPACE
OCI_BUCKET_NAME=manim-videos
EOF

# Build and start the service
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs
```

### 4. Create Systemd Service (Optional)

```bash
sudo tee /etc/systemd/system/manim-renderer.service << EOF
[Unit]
Description=Manim Renderer Service
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/manim-renderer
ExecStart=/usr/bin/docker-compose up
ExecStop=/usr/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable manim-renderer
sudo systemctl start manim-renderer
```

## Testing

### 1. Health Check

```bash
curl http://YOUR_PUBLIC_IP:8080/health
```

### 2. Render Test

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "script": "from manim import *\n\nclass TestScene(Scene):\n    def construct(self):\n        text = Text(\"Hello from Oracle Cloud!\")\n        self.play(Write(text))\n        self.wait(2)",
    "quality": "medium_quality",
    "format": "mp4"
  }' \
  http://YOUR_PUBLIC_IP:8080/render
```

### 3. Available Endpoints

- **Health**: `GET /health`
- **Render**: `POST /render`
- **Status**: `GET /status/<request_id>`
- **Formats**: `GET /formats`

## Monitoring and Maintenance

### 1. Check Service Status

```bash
# Check Docker containers
docker-compose ps

# View logs
docker-compose logs -f

# Check system resources
htop
df -h
```

### 2. Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### 3. Backup Important Data

```bash
# Backup OCI configuration
cp ~/.oci/config ~/.oci/config.backup

# Backup application data
tar -czf manim-renderer-backup.tar.gz ~/manim-renderer
```

### 4. Monitor Object Storage Usage

```bash
# List objects in bucket
oci os object list --namespace-name YOUR_NAMESPACE --bucket-name manim-videos

# Check bucket size
oci os object list --namespace-name YOUR_NAMESPACE --bucket-name manim-videos --query 'sum(data[].size)'
```

## Cost Optimization

### Always Free Tier Limits:
- **Compute**: 3,000 OCPU hours/month (4 OCPUs = 750 hours)
- **Block Storage**: 200GB total
- **Object Storage**: 10GB
- **Outbound Data Transfer**: 10TB/month

### Tips:
1. **Monitor usage** regularly through OCI Console
2. **Set up billing alerts** to avoid unexpected charges
3. **Clean up old video files** from Object Storage
4. **Use lifecycle policies** to auto-delete old objects
5. **Stop instances** when not in use (manual scaling)

## Troubleshooting

### Common Issues:

1. **SSH Connection Failed**
   - Check security list allows port 22
   - Verify SSH key permissions (600)
   - Ensure instance is in RUNNING state

2. **Service Not Accessible**
   - Check security list allows port 8080
   - Verify Docker service is running
   - Check application logs

3. **OCI SDK Authentication Failed**
   - Verify OCI config file
   - Check private key permissions
   - Validate OCID values

4. **Out of Memory Errors**
   - Monitor memory usage
   - Adjust Docker memory limits
   - Consider using swap file

### Useful Commands:

```bash
# Check instance status
oci compute instance get --instance-id YOUR_INSTANCE_ID

# Monitor system resources
htop
free -h
df -h

# Check Docker logs
docker-compose logs -f

# Restart service
sudo systemctl restart manim-renderer
```

## Migration Checklist

- [ ] OCI account created and verified
- [ ] OCI CLI installed and configured
- [ ] API keys generated and stored securely
- [ ] Object Storage bucket created
- [ ] VCN and networking resources created
- [ ] Application code updated for OCI SDK
- [ ] Docker images built for ARM architecture
- [ ] Compute instance created and configured
- [ ] Application deployed and tested
- [ ] Monitoring and alerting configured
- [ ] Backup procedures established
- [ ] Documentation updated

## Conclusion

This migration moves your Manim rendering service from Google Cloud's paid tier to Oracle Cloud's Always Free tier, providing:

- **Cost savings**: $0/month vs Google Cloud Run costs
- **Better resources**: 4 OCPUs + 24GB RAM vs Cloud Run limitations
- **Full control**: Own VM vs managed service constraints
- **Scalability**: Can upgrade to paid resources if needed

The Always Free tier is perfect for development, testing, and moderate production workloads. Monitor your usage to stay within free tier limits and enjoy your cost-effective Manim rendering service! 