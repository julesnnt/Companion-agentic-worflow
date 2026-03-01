"""
Vercel serverless entry point for COMPANION FastAPI backend.
Mangum wraps the ASGI app so Vercel's Python runtime can call it.
"""
import sys
import os

# On Vercel Lambda the function runs from /var/task/ and __file__ may be
# /var/task/index.py (api/ prefix stripped).  Probe all plausible locations
# so the import works both locally and on Vercel.
_here = os.path.dirname(os.path.abspath(__file__))
_cwd  = os.getcwd()

for _base in (_cwd, _here, os.path.normpath(os.path.join(_here, '..'))):
    _candidate = os.path.normpath(os.path.join(_base, 'companion', 'backend'))
    if os.path.isdir(_candidate) and _candidate not in sys.path:
        sys.path.insert(0, _candidate)

from main import app       # noqa: E402
from mangum import Mangum  # noqa: E402

handler = Mangum(app, lifespan="off")
