/**
 * PatientView — 3-panel patient interface.
 */

import { useAppStore } from '../store/appStore'
import ChatInterface from '../components/chat/ChatInterface'
import ReportViewer from '../components/reports/ReportViewer'
import TreatmentTimeline from '../components/timeline/TreatmentTimeline'
import MedicationManager from '../components/medications/MedicationManager'
import DailyCheckin from '../components/checkin/DailyCheckin'
import DocumentManager from '../components/checkin/DocumentManager'
import HealthCalendar from '../components/calendar/HealthCalendar'
import RightPanel from '../components/layout/RightPanel'

export default function PatientView() {
  const { activeView } = useAppStore()

  // Calendar gets a wider max-width
  if (activeView === 'calendar') {
    return (
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full px-6 py-7">
            <HealthCalendar />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {activeView === 'chat' ? (
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full px-6 py-7">
              {activeView === 'report'       && <ReportViewer />}
              {activeView === 'timeline'     && <TreatmentTimeline />}
              {activeView === 'medications'  && <MedicationManager />}
              {activeView === 'checkin'      && <DailyCheckin />}
              {activeView === 'documents'    && <DocumentManager />}
            </div>
          </div>
        )}
      </main>

      {/* Right contextual panel */}
      <RightPanel />
    </div>
  )
}
