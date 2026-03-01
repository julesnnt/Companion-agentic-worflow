/**
 * AdminView — Hospital Operational Intelligence dashboard.
 */

import AdminDashboard from '../components/admin/AdminDashboard'

export default function AdminView() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full px-6 py-7">
        <AdminDashboard />
      </div>
    </div>
  )
}
