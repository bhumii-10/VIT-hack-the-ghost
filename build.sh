#!/bin/bash
# Simple build script for Render

echo "Starting build..."
cd backend
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
echo "Build complete!"
echo "Using simplified app for deployment"