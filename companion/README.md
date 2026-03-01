# COMPANION — Clinical AI Healthcare Assistant

> A production-quality AI healthcare companion system built for the AI for Healthcare hackathon.

---

## What is COMPANION?

**COMPANION** is a full-stack AI healthcare assistant that sits on top of structured medical reports (from Part 1's DICOM → Report pipeline) and provides:

| Subsystem | What it does |
|---|---|
| **Clinical Intelligence Engine** | Transforms reports into 3 audience versions; generates treatment roadmaps; monitors clinical risk |
| **Patient Companion Interface** | Persona-based AI chat; medication tracking; daily check-ins; document management |
| **Hospital Operational Intelligence** | Admin dashboard with risk alerts, no-show detection, smart appointment scheduling |
| **Ethical & Safety Guardrails** | Emergency keyword detection, disclaimer enforcement, LLM output sanitization |
| **Companion Persona Framework** | 4 live-switchable AI personas (Robert, Luna, Atlas, Nova) |

---

## Project Structure

```
companion/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # Application entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── agents/
│   │   ├── reportTransformer.py   # 3-version report generator
│   │   ├── treatmentRoadmap.py    # Treatment timeline generator
│   │   ├── riskMonitor.py         # Hybrid rule + LLM risk engine
│   │   └── emotionalSupport.py    # Tone detection + crisis response
│   ├── api/routes/
│   │   ├── reports.py             # POST /transform, /roadmap
│   │   ├── chat.py                # POST /chat
│   │   ├── medications.py         # GET/PATCH medications
│   │   ├── checkin.py             # POST /checkin
│   │   ├── admin.py               # GET /dashboard, /alerts
│   │   ├── appointments.py        # Smart scheduling
│   │   └── documents.py           # Upload & categorise
│   ├── ethics/
│   │   └── guardrails.py          # Safety rules + disclaimers
│   ├── models/
│   │   └── schemas.py             # All Pydantic data models
│   └── mock_data/                 # Demo JSON datasets
└── frontend/                   # React + TypeScript + Tailwind
    └── src/
        ├── components/
        │   ├── layout/            # Sidebar, TopBanner, RightPanel
        │   ├── chat/              # ChatInterface, MessageBubble
        │   ├── persona/           # PersonaSwitcher
        │   ├── reports/           # ReportViewer, ReportUploader
        │   ├── timeline/          # TreatmentTimeline
        │   ├── medications/       # MedicationManager
        │   ├── checkin/           # DailyCheckin, DocumentManager
        │   ├── admin/             # AdminDashboard
        │   └── common/            # EmergencyModal
        ├── pages/
        │   ├── PatientView.tsx
        │   └── AdminView.tsx
        ├── store/appStore.ts      # Zustand global state
        ├── services/api.ts        # Axios API client
        └── types/index.ts         # Full TypeScript types
```

---

## Quick Start

### 1. Backend Setup

```bash
cd companion/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

> **Demo Mode:** If no `ANTHROPIC_API_KEY` is set, the backend runs in demo mode with pre-built responses. All endpoints still work.

### 2. Frontend Setup

```bash
cd companion/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173**

---

## Demo Flow (Step by Step)

1. **Load Demo Report**
   - Navigate to "My Report" in the sidebar
   - Click "Load Demo Report (CT Chest)"
   - Watch the AI pipeline generate 3 report versions simultaneously

2. **View Plain Language Summary**
   - Toggle between "Plain Language", "Action Checklist", and "Clinical View"
   - Notice the tone shift from clinical to accessible language

3. **Care Roadmap**
   - Navigate to "Care Roadmap"
   - See the 4-phase treatment timeline with status indicators
   - Each phase shows tasks, owners, and timeframes

4. **Chat with Companions**
   - Type a question in the chat
   - Switch persona (sidebar) from Atlas → Luna → Nova
   - Notice different response styles and emotional tones

5. **Daily Check-In**
   - Navigate to "Daily Check-In"
   - Set Pain Level to 9, Temperature to 39.5°C
   - Submit → triggers HIGH RISK alert

6. **Emergency Response**
   - In chat, type "I have severe chest pain"
   - Emergency modal appears immediately

7. **Admin Dashboard**
   - Click "Admin Dashboard" at bottom of sidebar
   - See real-time patient alerts, risk indicators
   - Use Smart Appointment Scheduler to find and book slots

8. **Medication Tracking**
   - Navigate to "Medications"
   - Toggle dose buttons to mark medications taken
   - Watch adherence percentage update in real-time

---

## Personas

| Persona | Focus | Tone |
|---------|-------|------|
| 🔬 **Atlas** | Clinical information, report explanation | Precise, analytical, evidence-based |
| 🌙 **Luna** | Emotional support, mental wellbeing | Warm, empathetic, reassuring |
| 📋 **Robert** | Administrative tasks, appointments | Calm, structured, professional |
| ⭐ **Nova** | Recovery coaching, motivation | Energetic, goal-oriented, positive |

---

## Ethical Architecture

COMPANION implements a multi-layer ethical safety system:

```
User Input
    ↓
[Emergency Keyword Detection] → Immediate emergency response if triggered
    ↓
[LLM Emotional Tone Analysis] → Detect anxiety, fear, crisis signals
    ↓
[LLM Response Generation] → Persona-aware, context-grounded
    ↓
[Output Sanitization] → Remove certainty language, add hedging
    ↓
[Disclaimer Injection] → Mandatory disclaimer on every response
    ↓
User Output
```

**Non-negotiable constraints enforced at every layer:**
- Never diagnose
- Never use certainty language
- Never contradict the treating physician
- Always recommend consulting healthcare professionals
- Immediate escalation for emergency keywords

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/transform` | POST | Transform report into 3 versions |
| `/api/reports/roadmap` | POST | Generate treatment roadmap |
| `/api/chat/` | POST | Persona-based chat with guardrails |
| `/api/medications/{patient_id}` | GET | Get patient medications |
| `/api/medications/{id}/log` | PATCH | Log a dose |
| `/api/checkin/` | POST | Submit daily check-in |
| `/api/admin/dashboard` | GET | Full admin dashboard data |
| `/api/admin/alerts` | GET | Patient risk alerts |
| `/api/appointments/suggest` | POST | Get appointment slots |
| `/api/appointments/book` | POST | Book an appointment |
| `/api/documents/{patient_id}` | GET | Get patient documents |
| `/api/documents/upload/{id}` | POST | Upload & categorise document |

Interactive API docs available at: **http://localhost:8000/docs**

---

## Technology Stack

**Backend:**
- FastAPI (Python) — async, high-performance API
- Anthropic Claude SDK — `claude-sonnet-4-6` for all LLM calls
- Pydantic v2 — strict data validation
- Uvicorn — ASGI server

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS — medical-grade UI design
- Zustand — lightweight global state
- TanStack Query — server state management
- Framer Motion — smooth animations
- Lucide React — consistent icon system

---

## Design Principles

- **Calm medical aesthetic** — teal/white/slate palette, rounded cards, generous whitespace
- **Progressive disclosure** — simple by default, deep when needed
- **Accessible first** — high contrast, clear labels, ARIA-friendly
- **Error-graceful** — demo mode fallbacks, clear error messages
- **Mobile-aware** — responsive grid layouts throughout

---

*COMPANION — Enhancing patient care through ethical, intelligent AI.*
*AI for Healthcare Hackathon — 2024*
