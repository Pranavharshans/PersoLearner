#!/bin/bash

# Quick test script for the deployed service
SERVICE_URL="https://manim-renderer-cvebuvehua-uc.a.run.app"

echo "🧪 Testing Manim rendering service..."
echo "Service URL: ${SERVICE_URL}"
echo ""

# Test health
echo "Testing health endpoint..."
curl -s "${SERVICE_URL}/health" | jq .
echo ""

# Test render with simple script
echo "Testing render endpoint..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "script": "from manim import *\n\nclass TestScene(Scene):\n    def construct(self):\n        text = Text(\"Hello from Cloud!\")\n        self.play(Write(text))\n        self.wait(2)",
    "quality": "low_quality",
    "format": "mp4"
  }' \
  "${SERVICE_URL}/render" | jq .

echo ""
echo "✅ Test completed"
