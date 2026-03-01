"""
Vercel serverless entry point for COMPANION FastAPI backend.
Mangum wraps the ASGI app so Vercel's Python runtime can call it.
"""
import sys
import os

# Make the backend package importable from the serverless function
sys.path.insert(
    0,
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'companion', 'backend')
)

from main import app       # noqa: E402
from mangum import Mangum  # noqa: E402

handler = Mangum(app, lifespan="off")
