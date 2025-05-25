# Multi-stage build for optimized image size
FROM python:3.11-slim-bullseye as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core system tools
    build-essential \
    git \
    curl \
    wget \
    # LaTeX and fonts for mathematical rendering
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-science \
    texlive-pictures \
    # FFmpeg for video processing
    ffmpeg \
    # Additional dependencies for Manim
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf2.0-dev \
    libffi-dev \
    shared-mime-info \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p /app/output \
    && mkdir -p /app/temp \
    && mkdir -p /app/logs \
    && chmod 755 /app/output /app/temp /app/logs

# Copy application code
COPY . .

# Set proper permissions
RUN chmod +x /app/*.py || true

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash manim \
    && chown -R manim:manim /app
USER manim

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Set entrypoint
ENTRYPOINT ["python", "app.py"] 