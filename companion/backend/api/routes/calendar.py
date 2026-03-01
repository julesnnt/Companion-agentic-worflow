"""
Health Calendar API — CRUD event management + AI report parsing.
DEMO_MODE: in-memory store with realistic pre-seeded data.
"""
from __future__ import annotations

import asyncio
from uuid import uuid4
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter

from models.schemas import (
    HealthEvent, HealthEventCreate, HealthEventType,
    BulkEventsCreate, ParsedEventsPreview,
)

router = APIRouter()

# In-memory event store  { user_id -> [HealthEvent] }
_store: dict = {}


# ── Demo data helpers ────────────────────────────────────────────────────────

def _dt(base: datetime, days: int, hour: int, minute: int = 0) -> str:
    return (base + timedelta(days=days)).replace(
        hour=hour, minute=minute, second=0, microsecond=0
    ).isoformat()


def _ev(user_id: str, base: datetime,
        type: HealthEventType, title: str, desc: str,
        days: int, hour: int, minute: int = 0) -> HealthEvent:
    return HealthEvent(
        id=str(uuid4()), user_id=user_id,
        type=type, title=title, description=desc, recurring=False,
        start_datetime=_dt(base, days, hour, minute),
    )


def _seed_events(user_id: str) -> list:
    """Pre-seeded events for PAT-001 (realistic CT chest follow-up scenario)."""
    today = datetime.now()
    E = HealthEventType
    return [
        _ev(user_id, today, E.EXAM,        "CT Thorax de contrôle",        "Surveillance nodule pulmonaire 8mm. Jeun 4h.",           42,  9),
        _ev(user_id, today, E.APPOINTMENT, "Consultation Pneumologie",     "Dr. Sarah Chen — Hôpital Central. Apporter CD scanner.", 21, 14, 30),
        _ev(user_id, today, E.EXAM,        "Bilan sanguin complet",        "NFS, CRP, D-dimères. Ordonnance disponible en ligne.",   14,  8),
        _ev(user_id, today, E.URGENT,      "Appel Dr. Martin",             "Résultats biopsie bronchique — urgent.",                   2, 11),
        _ev(user_id, today, E.APPOINTMENT, "Téléconsultation Généraliste", "Suivi état général. Lien envoyé par e-mail.",              7, 16),
        # Medication course: 7 days, morning + evening
        *[_ev(user_id, today, E.MEDICATION, "Amoxicilline 500mg", "Pendant le repas.", i, 8)  for i in range(7)],
        *[_ev(user_id, today, E.MEDICATION, "Amoxicilline 500mg", "Pendant le repas.", i, 20) for i in range(7)],
    ]


def _parse_events(user_id: str) -> list:
    """Events auto-extracted from the CT chest medical report (AI simulation)."""
    today = datetime.now()
    E = HealthEventType
    return [
        _ev(user_id, today, E.EXAM,        "CT Thorax de contrôle",        "Suivi obligatoire nodule 8mm spiculé — à 6 semaines.",         42,  9),
        _ev(user_id, today, E.EXAM,        "Bronchoscopie + biopsie",       "Geste diagnostique ciblé. Jeun 8h requis.",                    14,  8),
        _ev(user_id, today, E.EXAM,        "Bilan marqueurs tumoraux",      "NSE, Pro-GRP, CEA, NFS. Labo d'analyse médicale.",             3,  7, 30),
        _ev(user_id, today, E.APPOINTMENT, "Consultation Pneumologue",      "Dr. Chen. Apporter CD scanner + résultats biopsie.",           21, 14, 30),
        _ev(user_id, today, E.APPOINTMENT, "Consultation Oncologue",        "Évaluation initiale — Dr. Patel. Tous rapports requis.",        28, 10),
        _ev(user_id, today, E.URGENT,      "Appel résultats biopsie",       "Contacter Dr. Martin dès réception. Urgent.",                  10,  9),
        *[_ev(user_id, today, E.MEDICATION, f"Prednisolone 20mg (J{i+1})",
              "Anti-inflammatoire — matin, pendant le repas.", i, 8) for i in range(5)],
    ]


def _get_store(user_id: str) -> list:
    if user_id not in _store:
        _store[user_id] = _seed_events(user_id)
    return _store[user_id]


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/events")
async def get_events(user_id: str = "PAT-001"):
    return _get_store(user_id)


@router.post("/events", response_model=HealthEvent)
async def create_event(event: HealthEventCreate):
    ev = HealthEvent(id=str(uuid4()), **event.model_dump())
    _get_store(event.user_id).append(ev)
    return ev


@router.post("/events/bulk")
async def bulk_create_events(payload: BulkEventsCreate):
    created = []
    for e in payload.events:
        ev = HealthEvent(id=str(uuid4()), **e.model_dump())
        _get_store(e.user_id).append(ev)
        created.append(ev)
    return created


@router.put("/events/{event_id}", response_model=HealthEvent)
async def update_event(event_id: str, event: HealthEventCreate):
    store = _get_store(event.user_id)
    for i, ev in enumerate(store):
        if ev.id == event_id:
            updated = HealthEvent(id=event_id, **event.model_dump())
            store[i] = updated
            return updated
    ev = HealthEvent(id=event_id, **event.model_dump())
    store.append(ev)
    return ev


@router.delete("/events/{event_id}")
async def delete_event(event_id: str, user_id: str = "PAT-001"):
    if user_id in _store:
        _store[user_id] = [ev for ev in _store[user_id] if ev.id != event_id]
    return {"deleted": event_id}


@router.post("/parse")
async def parse_report(user_id: str = "PAT-001") -> ParsedEventsPreview:
    """Simulate AI parsing of the loaded medical report → health events."""
    await asyncio.sleep(1.5)  # Simulate AI processing latency
    events = _parse_events(user_id)
    return ParsedEventsPreview(
        events=events,
        summary=f"Companion a détecté {len(events)} événements à planifier depuis votre rapport médical.",
    )
