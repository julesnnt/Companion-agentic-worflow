/**
 * App — Root layout with dark sidebar and clean content area.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TopBanner from './components/layout/TopBanner'
import EmergencyModal from './components/common/EmergencyModal'
import PatientView from './pages/PatientView'
import AdminView from './pages/AdminView'

export default function App() {
  return (
    <BrowserRouter>
      {/* Full-height flex column */}
      <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
        <TopBanner />

        {/* Main shell: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          {/* Content area — sits on light bg */}
          <div className="flex flex-1 overflow-hidden bg-slate-50">
            <Routes>
              <Route path="/"      element={<PatientView />} />
              <Route path="/admin" element={<AdminView />}   />
            </Routes>
          </div>
        </div>

        <EmergencyModal />
      </div>
    </BrowserRouter>
  )
}
