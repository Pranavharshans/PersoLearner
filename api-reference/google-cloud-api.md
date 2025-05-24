# Google Cloud Platform API Reference

## Overview

Google Cloud Platform (GCP) provides cloud computing services for video rendering, storage, and compute operations. For Learnim, we'll primarily use Compute Engine, Cloud Run, and Vertex AI for Manim video rendering.

## Core Services for Learnim

### 1. Google Cloud Compute Engine (GPU Instances)
### 2. Google Cloud Run (Serverless Containers)
### 3. Vertex AI Custom Jobs (ML Workloads)
### 4. Google Cloud Storage (File Storage)

---

## Installation & Setup

### Python Client Libraries

```bash
# Install the main Google Cloud library
pip install google-cloud

# Or install specific services
pip install google-cloud-compute
pip install google-cloud-run
pip install google-cloud-storage
pip install google-cloud-aiplatform
```

### Authentication

```python
import os
from google.oauth2 import service_account
from google.cloud import compute_v1, storage, aiplatform

# Method 1: Service Account Key File
credentials = service_account.Credentials.from_service_account_file(
    'path/to/service-account-key.json'
)

# Method 2: Environment Variables
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'path/to/service-account-key.json'

# Method 3: Default Credentials (when running on GCP)
# Automatically uses the service account attached to the compute instance
```

---

## Google Cloud Compute Engine

### Creating GPU Instances for Manim Rendering

```python
from google.cloud import compute_v1
import time

def create_gpu_instance_for_manim(
    project_id: str,
    zone: str,
    instance_name: str,
    machine_type: str = "n1-standard-4",
    gpu_type: str = "nvidia-tesla-t4",
    gpu_count: int = 1
):
    """
    Create a GPU instance optimized for Manim rendering
    """
    compute_client = compute_v1.InstancesClient()
    
    # Define the instance configuration
    instance_config = {
        "name": instance_name,
        "machine_type": f"zones/{zone}/machineTypes/{machine_type}",
        
        # Boot disk with Ubuntu and Docker pre-installed
        "disks": [
            {
                "boot": True,
                "auto_delete": True,
                "initialize_params": {
                    "source_image": "projects/cos-cloud/global/images/family/cos-stable",
                    "disk_size_gb": "50",
                    "disk_type": f"projects/{project_id}/zones/{zone}/diskTypes/pd-ssd"
                }
            }
        ],
        
        # Network configuration
        "network_interfaces": [
            {
                "network": "global/networks/default",
                "access_configs": [
                    {
                        "type": "ONE_TO_ONE_NAT",
                        "name": "External NAT"
                    }
                ]
            }
        ],
        
        # GPU configuration
        "guest_accelerators": [
            {
                "accelerator_type": f"projects/{project_id}/zones/{zone}/acceleratorTypes/{gpu_type}",
                "accelerator_count": gpu_count
            }
        ],
        
        # Scheduling to allow GPU
        "scheduling": {
            "on_host_maintenance": "TERMINATE"
        },
        
        # Startup script to install dependencies
        "metadata": {
            "items": [
                {
                    "key": "startup-script",
                    "value": """#!/bin/bash
                    # Install Docker and NVIDIA drivers
                    curl -fsSL https://get.docker.com -o get-docker.sh
                    sh get-docker.sh
                    
                    # Install NVIDIA Docker runtime
                    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
                    curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
                    curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list
                    
                    apt-get update && apt-get install -y nvidia-docker2
                    systemctl restart docker
                    
                    # Pull Manim Docker image
                    docker pull manimcommunity/manim:latest
                    """
                }
            ]
        },
        
        # Service account for accessing other GCP services
        "service_accounts": [
            {
                "email": "default",
                "scopes": [
                    "https://www.googleapis.com/auth/cloud-platform"
                ]
            }
        ]
    }
    
    # Create the instance
    operation = compute_client.insert(
        project=project_id,
        zone=zone,
        instance_resource=instance_config
    )
    
    return operation

def wait_for_operation(project_id: str, zone: str, operation_name: str):
    """Wait for a compute operation to complete"""
    compute_client = compute_v1.ZoneOperationsClient()
    
    while True:
        result = compute_client.get(
            project=project_id,
            zone=zone,
            operation=operation_name
        )
        
        if result.status == "DONE":
            if result.error:
                raise Exception(f"Operation failed: {result.error}")
            return result
        
        time.sleep(5)

def delete_instance(project_id: str, zone: str, instance_name: str):
    """Delete a compute instance"""
    compute_client = compute_v1.InstancesClient()
    
    operation = compute_client.delete(
        project=project_id,
        zone=zone,
        instance=instance_name
    )
    
    return operation
```

### Managing Instance Lifecycle

```python
def start_instance(project_id: str, zone: str, instance_name: str):
    """Start a stopped instance"""
    compute_client = compute_v1.InstancesClient()
    
    operation = compute_client.start(
        project=project_id,
        zone=zone,
        instance=instance_name
    )
    
    return operation

def stop_instance(project_id: str, zone: str, instance_name: str):
    """Stop a running instance"""
    compute_client = compute_v1.InstancesClient()
    
    operation = compute_client.stop(
        project=project_id,
        zone=zone,
        instance=instance_name
    )
    
    return operation

def get_instance_status(project_id: str, zone: str, instance_name: str):
    """Get the current status of an instance"""
    compute_client = compute_v1.InstancesClient()
    
    instance = compute_client.get(
        project=project_id,
        zone=zone,
        instance=instance_name
    )
    
    return {
        "name": instance.name,
        "status": instance.status,
        "machine_type": instance.machine_type.split('/')[-1],
        "external_ip": instance.network_interfaces[0].access_configs[0].nat_i_p if instance.network_interfaces[0].access_configs else None
    }
```

---

## Google Cloud Run

### Deploying Manim Rendering Service

```python
from google.cloud import run_v2
import json

def deploy_manim_service(
    project_id: str,
    region: str,
    service_name: str,
    image_url: str
):
    """
    Deploy a Cloud Run service for Manim rendering
    """
    client = run_v2.ServicesClient()
    
    service_config = {
        "template": {
            "containers": [
                {
                    "image": image_url,
                    "ports": [{"container_port": 8080}],
                    "env": [
                        {"name": "PORT", "value": "8080"},
                        {"name": "GOOGLE_CLOUD_PROJECT", "value": project_id}
                    ],
                    "resources": {
                        "limits": {
                            "cpu": "4",
                            "memory": "8Gi"
                        }
                    }
                }
            ],
            "timeout": "3600s",  # 1 hour timeout for video rendering
            "service_account": f"manim-renderer@{project_id}.iam.gserviceaccount.com"
        },
        "traffic": [
            {
                "percent": 100,
                "type": "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
            }
        ]
    }
    
    parent = f"projects/{project_id}/locations/{region}"
    
    operation = client.create_service(
        parent=parent,
        service=service_config,
        service_id=service_name
    )
    
    return operation

def invoke_manim_service(service_url: str, manim_script: str, video_id: str):
    """
    Invoke the Cloud Run service to render a Manim video
    """
    import requests
    
    payload = {
        "script": manim_script,
        "video_id": video_id,
        "quality": "720p",
        "format": "mp4"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {get_access_token()}"
    }
    
    response = requests.post(
        f"{service_url}/render",
        json=payload,
        headers=headers,
        timeout=3600  # 1 hour timeout
    )
    
    return response.json()

def get_access_token():
    """Get an access token for authenticating with Cloud Run"""
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account
    
    credentials = service_account.Credentials.from_service_account_file(
        'path/to/service-account-key.json',
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    
    credentials.refresh(Request())
    return credentials.token
```

---

## Vertex AI Custom Jobs

### Running Manim Rendering as Custom Jobs

```python
from google.cloud import aiplatform
from google.cloud.aiplatform import gapic as aip

def create_manim_custom_job(
    project_id: str,
    region: str,
    job_display_name: str,
    manim_script: str,
    video_id: str
):
    """
    Create a Vertex AI custom job for Manim rendering
    """
    aiplatform.init(project=project_id, location=region)
    
    # Define the custom job spec
    job_spec = {
        "worker_pool_specs": [
            {
                "machine_spec": {
                    "machine_type": "n1-standard-4",
                    "accelerator_type": "NVIDIA_TESLA_T4",
                    "accelerator_count": 1
                },
                "replica_count": 1,
                "container_spec": {
                    "image_uri": "gcr.io/your-project/manim-renderer:latest",
                    "env": [
                        {"name": "MANIM_SCRIPT", "value": manim_script},
                        {"name": "VIDEO_ID", "value": video_id},
                        {"name": "OUTPUT_BUCKET", "value": f"gs://{project_id}-videos"}
                    ]
                }
            }
        ]
    }
    
    # Create the custom job
    job = aiplatform.CustomJob(
        display_name=job_display_name,
        job_spec=job_spec
    )
    
    # Submit the job
    job.run(sync=False)  # Run asynchronously
    
    return job

def monitor_custom_job(job_name: str):
    """
    Monitor the status of a custom job
    """
    client = aip.JobServiceClient()
    
    job = client.get_custom_job(name=job_name)
    
    return {
        "name": job.name,
        "state": job.state.name,
        "create_time": job.create_time,
        "start_time": job.start_time,
        "end_time": job.end_time,
        "error": job.error.message if job.error else None
    }
```

---

## Google Cloud Storage

### Managing Video Files

```python
from google.cloud import storage
import os

def upload_video_to_gcs(
    bucket_name: str,
    source_file_path: str,
    destination_blob_name: str
):
    """Upload a video file to Google Cloud Storage"""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    
    # Upload with metadata
    blob.metadata = {
        "content-type": "video/mp4",
        "cache-control": "public, max-age=3600"
    }
    
    blob.upload_from_filename(source_file_path)
    
    # Make the blob publicly readable
    blob.make_public()
    
    return blob.public_url

def download_video_from_gcs(
    bucket_name: str,
    source_blob_name: str,
    destination_file_path: str
):
    """Download a video file from Google Cloud Storage"""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    
    blob.download_to_filename(destination_file_path)

def generate_signed_url(
    bucket_name: str,
    blob_name: str,
    expiration_minutes: int = 60
):
    """Generate a signed URL for temporary access to a video"""
    from datetime import datetime, timedelta
    
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    
    url = blob.generate_signed_url(
        expiration=datetime.utcnow() + timedelta(minutes=expiration_minutes),
        method='GET'
    )
    
    return url

def delete_video_from_gcs(bucket_name: str, blob_name: str):
    """Delete a video file from Google Cloud Storage"""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    
    blob.delete()
```

---

## Complete Manim Rendering Pipeline

### Orchestrating the Full Pipeline

```python
import asyncio
import json
from typing import Dict, Any

class ManimRenderingPipeline:
    def __init__(self, project_id: str, region: str, zone: str):
        self.project_id = project_id
        self.region = region
        self.zone = zone
        
    async def render_video(
        self,
        video_id: str,
        manim_script: str,
        user_id: str,
        rendering_method: str = "cloud_run"  # or "custom_job" or "compute_engine"
    ) -> Dict[str, Any]:
        """
        Complete pipeline for rendering a Manim video
        """
        try:
            # Step 1: Validate the Manim script
            if not self._validate_manim_script(manim_script):
                raise ValueError("Invalid Manim script")
            
            # Step 2: Choose rendering method and execute
            if rendering_method == "cloud_run":
                result = await self._render_with_cloud_run(video_id, manim_script)
            elif rendering_method == "custom_job":
                result = await self._render_with_custom_job(video_id, manim_script)
            elif rendering_method == "compute_engine":
                result = await self._render_with_compute_engine(video_id, manim_script)
            else:
                raise ValueError(f"Unknown rendering method: {rendering_method}")
            
            # Step 3: Upload to Cloud Storage
            video_url = self._upload_to_storage(result["video_path"], video_id, user_id)
            
            # Step 4: Generate thumbnail
            thumbnail_url = self._generate_thumbnail(result["video_path"], video_id, user_id)
            
            # Step 5: Clean up temporary files
            self._cleanup_temp_files(result["video_path"])
            
            return {
                "status": "success",
                "video_id": video_id,
                "video_url": video_url,
                "thumbnail_url": thumbnail_url,
                "duration": result.get("duration"),
                "file_size": result.get("file_size")
            }
            
        except Exception as e:
            return {
                "status": "error",
                "video_id": video_id,
                "error": str(e)
            }
    
    def _validate_manim_script(self, script: str) -> bool:
        """Validate that the Manim script is safe and well-formed"""
        # Basic validation - in production, use more sophisticated checks
        forbidden_imports = ['os', 'subprocess', 'sys', '__import__']
        
        for forbidden in forbidden_imports:
            if forbidden in script:
                return False
        
        # Check for required Manim imports
        if 'from manim import *' not in script and 'import manim' not in script:
            return False
        
        return True
    
    async def _render_with_cloud_run(self, video_id: str, script: str) -> Dict[str, Any]:
        """Render using Cloud Run service"""
        service_url = f"https://manim-renderer-{self.project_id}.{self.region}.run.app"
        
        result = invoke_manim_service(service_url, script, video_id)
        
        return {
            "video_path": result["video_path"],
            "duration": result.get("duration"),
            "file_size": result.get("file_size")
        }
    
    async def _render_with_custom_job(self, video_id: str, script: str) -> Dict[str, Any]:
        """Render using Vertex AI Custom Job"""
        job = create_manim_custom_job(
            self.project_id,
            self.region,
            f"manim-render-{video_id}",
            script,
            video_id
        )
        
        # Wait for job completion
        while True:
            status = monitor_custom_job(job.name)
            if status["state"] in ["JOB_STATE_SUCCEEDED", "JOB_STATE_FAILED"]:
                break
            await asyncio.sleep(30)
        
        if status["state"] == "JOB_STATE_FAILED":
            raise Exception(f"Custom job failed: {status['error']}")
        
        # Download result from GCS
        video_path = f"/tmp/{video_id}.mp4"
        download_video_from_gcs(
            f"{self.project_id}-temp",
            f"renders/{video_id}.mp4",
            video_path
        )
        
        return {"video_path": video_path}
    
    async def _render_with_compute_engine(self, video_id: str, script: str) -> Dict[str, Any]:
        """Render using Compute Engine GPU instance"""
        instance_name = f"manim-renderer-{video_id}"
        
        # Create instance
        operation = create_gpu_instance_for_manim(
            self.project_id,
            self.zone,
            instance_name
        )
        
        # Wait for instance to be ready
        wait_for_operation(self.project_id, self.zone, operation.name)
        
        try:
            # Execute rendering on the instance
            # This would involve SSH connection and Docker execution
            # Implementation depends on your specific setup
            
            # For now, return a placeholder
            return {"video_path": f"/tmp/{video_id}.mp4"}
            
        finally:
            # Clean up instance
            delete_instance(self.project_id, self.zone, instance_name)
    
    def _upload_to_storage(self, local_path: str, video_id: str, user_id: str) -> str:
        """Upload video to Cloud Storage"""
        bucket_name = f"{self.project_id}-videos"
        blob_name = f"users/{user_id}/videos/{video_id}.mp4"
        
        return upload_video_to_gcs(bucket_name, local_path, blob_name)
    
    def _generate_thumbnail(self, video_path: str, video_id: str, user_id: str) -> str:
        """Generate and upload video thumbnail"""
        # Use ffmpeg or similar to generate thumbnail
        # This is a placeholder implementation
        thumbnail_path = f"/tmp/{video_id}_thumb.jpg"
        
        # Generate thumbnail (implementation needed)
        # ...
        
        bucket_name = f"{self.project_id}-videos"
        blob_name = f"users/{user_id}/thumbnails/{video_id}.jpg"
        
        return upload_video_to_gcs(bucket_name, thumbnail_path, blob_name)
    
    def _cleanup_temp_files(self, *file_paths: str):
        """Clean up temporary files"""
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)

# Usage example
async def main():
    pipeline = ManimRenderingPipeline(
        project_id="your-project-id",
        region="us-central1",
        zone="us-central1-a"
    )
    
    manim_script = """
from manim import *

class CreateCircle(Scene):
    def construct(self):
        circle = Circle()
        circle.set_fill(PINK, opacity=0.5)
        self.play(Create(circle))
    """
    
    result = await pipeline.render_video(
        video_id="test-video-123",
        manim_script=manim_script,
        user_id="user-456",
        rendering_method="cloud_run"
    )
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Environment Variables

```bash
# Google Cloud Configuration
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_REGION="us-central1"
export GOOGLE_CLOUD_ZONE="us-central1-a"

# Storage Configuration
export GCS_BUCKET_VIDEOS="your-project-videos"
export GCS_BUCKET_TEMP="your-project-temp"

# Service Configuration
export CLOUD_RUN_SERVICE_URL="https://manim-renderer-your-project.us-central1.run.app"
```

---

## Cost Optimization

### Best Practices for Cost Management

```python
def estimate_rendering_cost(
    duration_minutes: float,
    rendering_method: str,
    machine_type: str = "n1-standard-4"
) -> Dict[str, float]:
    """
    Estimate the cost of rendering a video
    """
    # Pricing as of 2024 (approximate)
    pricing = {
        "cloud_run": {
            "cpu_per_second": 0.000024,  # $0.000024 per vCPU-second
            "memory_per_gb_second": 0.0000025,  # $0.0000025 per GB-second
            "requests": 0.0000004  # $0.0000004 per request
        },
        "compute_engine": {
            "n1-standard-4": 0.19,  # $0.19 per hour
            "nvidia-tesla-t4": 0.35  # $0.35 per hour for GPU
        },
        "custom_job": {
            "base_cost": 0.20,  # Base cost per hour
            "gpu_cost": 0.35   # Additional GPU cost per hour
        }
    }
    
    hours = duration_minutes / 60
    
    if rendering_method == "cloud_run":
        # Assume 4 vCPUs and 8GB memory
        cpu_cost = 4 * 3600 * hours * pricing["cloud_run"]["cpu_per_second"]
        memory_cost = 8 * 3600 * hours * pricing["cloud_run"]["memory_per_gb_second"]
        request_cost = pricing["cloud_run"]["requests"]
        total_cost = cpu_cost + memory_cost + request_cost
        
    elif rendering_method == "compute_engine":
        machine_cost = hours * pricing["compute_engine"][machine_type]
        gpu_cost = hours * pricing["compute_engine"]["nvidia-tesla-t4"]
        total_cost = machine_cost + gpu_cost
        
    elif rendering_method == "custom_job":
        total_cost = hours * (pricing["custom_job"]["base_cost"] + pricing["custom_job"]["gpu_cost"])
    
    return {
        "estimated_cost_usd": round(total_cost, 4),
        "duration_hours": hours,
        "method": rendering_method
    }

def choose_optimal_rendering_method(estimated_duration_minutes: float) -> str:
    """
    Choose the most cost-effective rendering method based on duration
    """
    costs = {}
    methods = ["cloud_run", "compute_engine", "custom_job"]
    
    for method in methods:
        cost_info = estimate_rendering_cost(estimated_duration_minutes, method)
        costs[method] = cost_info["estimated_cost_usd"]
    
    # Return the method with lowest cost
    return min(costs, key=costs.get)
```

---

## Monitoring and Logging

```python
from google.cloud import logging
from google.cloud import monitoring_v3

def setup_logging():
    """Setup Cloud Logging"""
    client = logging.Client()
    client.setup_logging()

def log_rendering_metrics(
    video_id: str,
    duration: float,
    method: str,
    cost: float,
    success: bool
):
    """Log rendering metrics to Cloud Monitoring"""
    client = monitoring_v3.MetricServiceClient()
    project_name = f"projects/{os.environ['GOOGLE_CLOUD_PROJECT']}"
    
    # Create time series data
    series = monitoring_v3.TimeSeries()
    series.metric.type = "custom.googleapis.com/manim/rendering_duration"
    series.resource.type = "global"
    
    # Add labels
    series.metric.labels["video_id"] = video_id
    series.metric.labels["method"] = method
    series.metric.labels["success"] = str(success)
    
    # Add data point
    point = series.points.add()
    point.value.double_value = duration
    point.interval.end_time.seconds = int(time.time())
    
    # Write to Cloud Monitoring
    client.create_time_series(
        name=project_name,
        time_series=[series]
    )
```

This comprehensive Google Cloud API reference provides everything needed to implement scalable Manim video rendering for the Learnim platform, with multiple rendering options, cost optimization, and proper monitoring. 