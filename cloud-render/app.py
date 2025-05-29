#!/usr/bin/env python3
"""
Manim Cloud Rendering Service
A Flask application for rendering Manim scripts in Google Cloud Run
"""

import os
import sys
import json
import uuid
import time
import tempfile
import subprocess
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from google.cloud import storage, monitoring_v3, logging as cloud_logging
from google.auth import default
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
class Config:
    """Application configuration"""
    PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'manim-next')
    BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'manim-next-videos')
    SERVICE_NAME = os.getenv('K_SERVICE', 'manim-renderer')
    REVISION = os.getenv('K_REVISION', 'unknown')
    
    # Directories
    OUTPUT_DIR = Path('/app/output')
    TEMP_DIR = Path('/app/temp')
    LOGS_DIR = Path('/app/logs')
    
    # Rendering settings
    MAX_RENDER_TIME = int(os.getenv('MAX_RENDER_TIME', '3600'))  # 1 hour
    DEFAULT_QUALITY = os.getenv('DEFAULT_QUALITY', 'medium_quality')
    DEFAULT_FORMAT = os.getenv('DEFAULT_FORMAT', 'mp4')

config = Config()

# Ensure directories exist
for directory in [config.OUTPUT_DIR, config.TEMP_DIR, config.LOGS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Initialize Google Cloud clients
try:
    credentials, project = default()
    storage_client = storage.Client(project=config.PROJECT_ID, credentials=credentials)
    monitoring_client = monitoring_v3.MetricServiceClient(credentials=credentials)
    cloud_logging_client = cloud_logging.Client(project=config.PROJECT_ID, credentials=credentials)
    
    # Setup cloud logging handler
    cloud_logging_client.setup_logging()
    
    logger.info("Google Cloud clients initialized", project_id=config.PROJECT_ID)
except Exception as e:
    logger.error("Failed to initialize Google Cloud clients", error=str(e))
    storage_client = None
    monitoring_client = None
    cloud_logging_client = None

class ManimRenderer:
    """
    Handles Manim script rendering with Google Cloud Storage integration
    """
    
    def __init__(self):
        self.storage_client = storage_client
        self.bucket_name = config.BUCKET_NAME
        self.output_dir = config.OUTPUT_DIR
        self.temp_dir = config.TEMP_DIR
        
    def validate_script(self, script_content: str) -> Tuple[bool, str]:
        """
        Validate Manim script for security and syntax
        """
        try:
            # Basic security checks
            dangerous_imports = [
                'subprocess', 'os.system', 'eval', 'exec', 'open',
                '__import__', 'compile', 'globals', 'locals'
            ]
            
            for dangerous in dangerous_imports:
                if dangerous in script_content:
                    return False, f"Dangerous function/import detected: {dangerous}"
            
            # Check for required Manim imports
            if 'from manim import' not in script_content and 'import manim' not in script_content:
                return False, "Script must import manim"
            
            # Check for Scene class
            if 'class' not in script_content or 'Scene' not in script_content:
                return False, "Script must contain a Scene class"
            
            return True, "Script validation passed"
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def render_script(
        self, 
        script_content: str, 
        request_id: str,
        quality: str = None,
        format: str = None,
        scene_name: str = None
    ) -> Dict[str, Any]:
        """
        Render a Manim script and return the result
        """
        start_time = time.time()
        quality = quality or config.DEFAULT_QUALITY
        format = format or config.DEFAULT_FORMAT
        
        # Map quality names to Manim CLI quality flags
        quality_mapping = {
            'low_quality': 'l',
            'medium_quality': 'm', 
            'high_quality': 'h',
            'production_quality': 'p',
            '4k_quality': 'k'
        }
        
        # Get the correct quality flag
        quality_flag = quality_mapping.get(quality, 'm')  # default to medium
        
        logger.info(
            "Starting render",
            request_id=request_id,
            quality=quality,
            quality_flag=quality_flag,
            format=format,
            scene_name=scene_name
        )
        
        try:
            # Validate script
            is_valid, validation_message = self.validate_script(script_content)
            if not is_valid:
                raise ValueError(f"Script validation failed: {validation_message}")
            
            # Create temporary script file
            script_file = self.temp_dir / f"script_{request_id}.py"
            with open(script_file, 'w', encoding='utf-8') as f:
                f.write(script_content)
            
            # Prepare output directory for this render
            render_output_dir = self.output_dir / request_id
            render_output_dir.mkdir(exist_ok=True)
            
            # Build manim command
            cmd = [
                'manim',
                str(script_file),
                '--output_file', f'video_{request_id}',
                '--media_dir', str(render_output_dir),
                '--quality', quality_flag,
                '--format', format,
                '--disable_caching'
            ]
            
            if scene_name:
                cmd.append(scene_name)
            
            logger.info("Executing manim command", command=' '.join(cmd))
            
            # Execute manim rendering
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=config.MAX_RENDER_TIME,
                cwd=str(self.temp_dir)
            )
            
            if process.returncode != 0:
                error_msg = f"Manim rendering failed: {process.stderr}"
                logger.error("Render failed", error=error_msg, stdout=process.stdout)
                raise RuntimeError(error_msg)
            
            # Find the rendered video file
            video_files = list(render_output_dir.rglob(f'*.{format}'))
            if not video_files:
                raise RuntimeError("No video file found after rendering")
            
            video_file = video_files[0]  # Take the first video file found
            
            # Upload to Google Cloud Storage
            if self.storage_client:
                blob_name = f"videos/{request_id}/video_{request_id}.{format}"
                gcs_url = self._upload_to_gcs(video_file, blob_name)
            else:
                gcs_url = None
                logger.warning("Google Cloud Storage not available, video not uploaded")
            
            # Calculate metrics
            render_time = time.time() - start_time
            file_size = video_file.stat().st_size
            
            # Cleanup temporary files
            script_file.unlink(missing_ok=True)
            
            result = {
                'success': True,
                'request_id': request_id,
                'video_file': str(video_file),
                'gcs_url': gcs_url,
                'blob_name': blob_name if gcs_url else None,
                'file_size': file_size,
                'render_time': render_time,
                'quality': quality,
                'format': format,
                'scene_name': scene_name,
                'timestamp': datetime.utcnow().isoformat(),
                'stdout': process.stdout,
                'stderr': process.stderr
            }
            
            logger.info(
                "Render completed successfully",
                request_id=request_id,
                render_time=render_time,
                file_size=file_size,
                gcs_url=gcs_url
            )
            
            # Report metrics to Google Cloud Monitoring
            self._report_metrics(render_time, file_size, True)
            
            return result
            
        except subprocess.TimeoutExpired:
            error_msg = f"Rendering timeout after {config.MAX_RENDER_TIME} seconds"
            logger.error("Render timeout", request_id=request_id)
            self._report_metrics(time.time() - start_time, 0, False)
            return {
                'success': False,
                'error': error_msg,
                'request_id': request_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            error_msg = f"Rendering failed: {str(e)}"
            logger.error("Render error", request_id=request_id, error=error_msg)
            self._report_metrics(time.time() - start_time, 0, False)
            return {
                'success': False,
                'error': error_msg,
                'request_id': request_id,
                'timestamp': datetime.utcnow().isoformat()
            }
        
        finally:
            # Cleanup
            try:
                script_file = self.temp_dir / f"script_{request_id}.py"
                script_file.unlink(missing_ok=True)
            except:
                pass
    
    def _upload_to_gcs(self, local_file: Path, blob_name: str) -> str:
        """Upload file to Google Cloud Storage"""
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(blob_name)
            
            blob.upload_from_filename(str(local_file))
            
            # Make the blob publicly readable (optional)
            # blob.make_public()
            
            gcs_url = f"gs://{self.bucket_name}/{blob_name}"
            logger.info("File uploaded to GCS", gcs_url=gcs_url, blob_name=blob_name)
            
            return gcs_url
            
        except Exception as e:
            logger.error("Failed to upload to GCS", error=str(e), blob_name=blob_name)
            raise
    
    def _report_metrics(self, render_time: float, file_size: int, success: bool):
        """Report custom metrics to Google Cloud Monitoring"""
        if not monitoring_client:
            return
        
        try:
            project_name = f"projects/{config.PROJECT_ID}"
            
            # Create time series data
            now = time.time()
            seconds = int(now)
            nanos = int((now - seconds) * 10 ** 9)
            interval = monitoring_v3.TimeInterval({
                "end_time": {"seconds": seconds, "nanos": nanos}
            })
            
            # Render time metric
            render_time_series = monitoring_v3.TimeSeries()
            render_time_series.metric.type = "custom.googleapis.com/manim/render_time"
            render_time_series.resource.type = "cloud_run_revision"
            render_time_series.resource.labels["service_name"] = config.SERVICE_NAME
            render_time_series.resource.labels["revision_name"] = config.REVISION
            
            point = monitoring_v3.Point()
            point.value.double_value = render_time
            point.interval = interval
            render_time_series.points = [point]
            
            # Success rate metric
            success_series = monitoring_v3.TimeSeries()
            success_series.metric.type = "custom.googleapis.com/manim/success_rate"
            success_series.resource.type = "cloud_run_revision"
            success_series.resource.labels["service_name"] = config.SERVICE_NAME
            success_series.resource.labels["revision_name"] = config.REVISION
            
            point = monitoring_v3.Point()
            point.value.int64_value = 1 if success else 0
            point.interval = interval
            success_series.points = [point]
            
            # Send metrics
            monitoring_client.create_time_series(
                name=project_name,
                time_series=[render_time_series, success_series]
            )
            
        except Exception as e:
            logger.error("Failed to report metrics", error=str(e))

# Initialize renderer
renderer = ManimRenderer()

# Routes
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': config.SERVICE_NAME,
        'revision': config.REVISION,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/render', methods=['POST'])
def render_video():
    """Main rendering endpoint"""
    try:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Parse request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        script_content = data.get('script')
        if not script_content:
            return jsonify({'error': 'No script content provided'}), 400
        
        quality = data.get('quality', config.DEFAULT_QUALITY)
        format = data.get('format', config.DEFAULT_FORMAT)
        scene_name = data.get('scene_name')
        
        logger.info(
            "Received render request",
            request_id=request_id,
            quality=quality,
            format=format,
            scene_name=scene_name,
            script_length=len(script_content)
        )
        
        # Render the script
        result = renderer.render_script(
            script_content=script_content,
            request_id=request_id,
            quality=quality,
            format=format,
            scene_name=scene_name
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error("Render endpoint error", error=str(e))
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@app.route('/status/<request_id>', methods=['GET'])
def get_render_status(request_id: str):
    """Get rendering status (placeholder for future implementation)"""
    return jsonify({
        'request_id': request_id,
        'status': 'completed',  # This would be dynamic in a real implementation
        'message': 'Status endpoint not fully implemented yet'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error("Internal server error", error=str(error))
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(
        "Starting Manim rendering service",
        port=port,
        debug=debug,
        project_id=config.PROJECT_ID,
        bucket_name=config.BUCKET_NAME
    )
    
    app.run(host='0.0.0.0', port=port, debug=debug) 