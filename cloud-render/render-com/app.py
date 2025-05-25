#!/usr/bin/env python3
"""
Manim Cloud Rendering Service for Render.com
A Flask application for rendering Manim scripts and returning videos directly
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
import base64

from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
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
    SERVICE_NAME = os.getenv('RENDER_SERVICE_NAME', 'manim-renderer')
    
    # Directories
    OUTPUT_DIR = Path('/app/output')
    TEMP_DIR = Path('/app/temp')
    LOGS_DIR = Path('/app/logs')
    
    # Rendering settings
    MAX_RENDER_TIME = int(os.getenv('MAX_RENDER_TIME', '3600'))  # 1 hour
    DEFAULT_QUALITY = os.getenv('DEFAULT_QUALITY', 'medium_quality')
    DEFAULT_FORMAT = os.getenv('DEFAULT_FORMAT', 'mp4')
    
    # Render.com specific
    PORT = int(os.getenv('PORT', 8080))

config = Config()

# Ensure directories exist
for directory in [config.OUTPUT_DIR, config.TEMP_DIR, config.LOGS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

class ManimRenderer:
    """
    Handles Manim script rendering and returns videos directly
    """
    
    def __init__(self):
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
        scene_name: str = None,
        return_base64: bool = False
    ) -> Dict[str, Any]:
        """
        Render a Manim script and return video data directly
        """
        start_time = time.time()
        quality = quality or config.DEFAULT_QUALITY
        format = format or config.DEFAULT_FORMAT
        
        logger.info(
            "Starting render",
            request_id=request_id,
            quality=quality,
            format=format,
            scene_name=scene_name,
            return_base64=return_base64
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
                f'--{quality}',
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
            
            # Calculate metrics
            render_time = time.time() - start_time
            file_size = video_file.stat().st_size
            
            # Prepare response data
            result = {
                'success': True,
                'request_id': request_id,
                'video_file_path': str(video_file),
                'file_size': file_size,
                'render_time': render_time,
                'quality': quality,
                'format': format,
                'scene_name': scene_name,
                'timestamp': datetime.utcnow().isoformat(),
                'stdout': process.stdout,
                'stderr': process.stderr
            }
            
            # Add base64 data if requested
            if return_base64:
                with open(video_file, 'rb') as f:
                    video_data = f.read()
                    result['video_base64'] = base64.b64encode(video_data).decode('utf-8')
                    result['video_size_mb'] = len(video_data) / (1024 * 1024)
            
            # Cleanup temporary files
            script_file.unlink(missing_ok=True)
            
            logger.info(
                "Render completed successfully",
                request_id=request_id,
                render_time=render_time,
                file_size=file_size,
                video_file=str(video_file)
            )
            
            return result
            
        except subprocess.TimeoutExpired:
            error_msg = f"Rendering timeout after {config.MAX_RENDER_TIME} seconds"
            logger.error("Render timeout", request_id=request_id)
            return {
                'success': False,
                'error': error_msg,
                'request_id': request_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            error_msg = f"Rendering failed: {str(e)}"
            logger.error("Render error", request_id=request_id, error=error_msg)
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

# Initialize renderer
renderer = ManimRenderer()

# Routes
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': config.SERVICE_NAME,
        'timestamp': datetime.utcnow().isoformat(),
        'storage': 'direct_return'
    })

@app.route('/render', methods=['POST'])
def render_video():
    """Main rendering endpoint - returns video data directly"""
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
        return_base64 = data.get('return_base64', False)
        
        logger.info(
            "Received render request",
            request_id=request_id,
            quality=quality,
            format=format,
            scene_name=scene_name,
            return_base64=return_base64,
            script_length=len(script_content)
        )
        
        # Render the script
        result = renderer.render_script(
            script_content=script_content,
            request_id=request_id,
            quality=quality,
            format=format,
            scene_name=scene_name,
            return_base64=return_base64
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

@app.route('/download/<request_id>', methods=['GET'])
def download_video(request_id: str):
    """Download video file directly"""
    try:
        # Find the video file
        render_output_dir = config.OUTPUT_DIR / request_id
        video_files = list(render_output_dir.rglob('*.mp4'))
        
        if not video_files:
            return jsonify({'error': 'Video file not found'}), 404
        
        video_file = video_files[0]
        
        # Return the file
        return send_file(
            video_file,
            as_attachment=True,
            download_name=f'manim_video_{request_id}.mp4',
            mimetype='video/mp4'
        )
        
    except Exception as e:
        logger.error("Download error", error=str(e), request_id=request_id)
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@app.route('/status/<request_id>', methods=['GET'])
def get_render_status(request_id: str):
    """Get rendering status"""
    try:
        # Check if video file exists
        render_output_dir = config.OUTPUT_DIR / request_id
        video_files = list(render_output_dir.rglob('*.mp4'))
        
        if video_files:
            video_file = video_files[0]
            file_size = video_file.stat().st_size
            return jsonify({
                'request_id': request_id,
                'status': 'completed',
                'file_size': file_size,
                'download_url': f'/download/{request_id}'
            })
        else:
            return jsonify({
                'request_id': request_id,
                'status': 'not_found',
                'message': 'Video file not found'
            })
            
    except Exception as e:
        return jsonify({
            'request_id': request_id,
            'status': 'error',
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error("Internal server error", error=str(error))
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = config.PORT
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(
        "Starting Manim rendering service on Render.com",
        port=port,
        debug=debug,
        storage_mode='direct_return'
    )
    
    app.run(host='0.0.0.0', port=port, debug=debug) 