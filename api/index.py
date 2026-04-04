import os
import sys

# Add the project root to sys.path so we can import backend
# This assumes api/index.py is one level down from root
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.append(root_dir)

from backend.app import app

# Vercel serverless function handler
handler = app
