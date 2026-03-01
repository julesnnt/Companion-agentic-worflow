"""
COMPANION — Clinical AI Assistant Backend
FastAPI application entry point.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes import reports, chat, medications, checkin, admin, appointments, documents, calendar

load_dotenv()

app = FastAPI(
    title="COMPANION API",
    description="AI-powered clinical companion system for enhanced patient care",
    version="1.0.0",
)

# Allow Vite dev server + any Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Route registration ───────────────────────────────────────────────────────
app.include_router(reports.router,      prefix="/api/reports",      tags=["Reports"])
app.include_router(chat.router,         prefix="/api/chat",         tags=["Chat"])
app.include_router(medications.router,  prefix="/api/medications",  tags=["Medications"])
app.include_router(checkin.router,      prefix="/api/checkin",      tags=["Check-In"])
app.include_router(admin.router,        prefix="/api/admin",        tags=["Admin"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(documents.router,    prefix="/api/documents",    tags=["Documents"])
app.include_router(calendar.router,     prefix="/api/calendar",     tags=["Calendar"])


@app.get("/")
async def root():
    return {
        "service": "COMPANION API",
        "version": "1.0.0",
        "status": "operational",
        "demo_mode": os.getenv("DEMO_MODE", "false").lower() == "true",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
