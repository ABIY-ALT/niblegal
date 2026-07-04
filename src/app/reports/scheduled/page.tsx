'use client';

import { useState } from 'react';
import {
  Calendar, Clock, Mail, Plus, Edit, Trash2, CheckCircle, AlertTriangle
} from 'lucide-react';

function ScheduledReports() {
  const [showModal, setShowModal] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([
    {
      id: 1,
      name: 'Weekly Contract Summary',
      module: 'contracts',
      frequency: 'weekly',
      day: 'Monday',
      time: '09:00',
      recipients: ['manager@bank.com', 'legal@bank.com'],
      lastRun: '2026-07-03T09:00:00',
      nextRun: '2026-07-10T09:00:00',
      status: 'active'
    },
    {
      id: 2,
      name: 'Monthly Advisory Stats',
      module: 'advisory',
      frequency: 'monthly',
      day: '1',
      time: '08:30',
      recipients: ['manager@bank.com'],
      lastRun: '2026-06-01T08:30:00',
      nextRun: '2026-07-01T08:30:00',
      status: 'active'
    }
  ]);

  const deleteReport = (id: number) => {
    setScheduledReports(scheduledReports.filter(report => report.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Reports</h1>
          <p className="text-gray-500">Manage recurring reports</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Schedule
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Total Scheduled</p>
          <h3 className="text-2xl font-bold text-amber-600">{scheduledReports.length}</h3>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Active</p>
          <h3 className="text-2xl font-bold text-green-600">
            {scheduledReports.filter(r => r.status === 'active').length}
          </h3>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Failed Last Run</p>
          <h3 className="text-2xl font-bold text-red-600">0</h3>
        </div>
      </div>

      {/* Scheduled Reports List */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Scheduled Reports</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Module</th>
                <th>Frequency</th>
                <th>Next Run</th>
                <th>Last Run</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scheduledReports.map(report => (
                <tr key={report.id}>
                  <td className="font-medium">{report.name}</td>
                  <td className="capitalize">{report.module}</td>
                  <td className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="capitalize">{report.frequency}</span>
                  </td>
                  <td>
                    {new Date(report.nextRun).toLocaleDateString()} at {new Date(report.nextRun).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </td>
                  <td>
                    {new Date(report.lastRun).toLocaleDateString()} at {new Date(report.lastRun).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </td>
                  <td>
                    {report.status === 'active' ? (
                      <span className="badge bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Active
                      </span>
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Paused
                      </span>
                    )}
                  </td>
                  <td className="flex gap-2">
                    <button className="btn btn-ghost btn-sm p-2">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => deleteReport(report.id)} className="btn btn-ghost btn-sm p-2 text-red-600 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">New Scheduled Report</h2>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Report Name</label>
                <input type="text" className="form-control" placeholder="Enter report name" />
              </div>
              <div className="form-group">
                <label className="form-label">Module</label>
                <select className="form-control">
                  <option>Contracts</option>
                  <option>Legal Advisory</option>
                  <option>Knowledge</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-control">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input type="time" className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Recipients</label>
                <input type="text" className="form-control" placeholder="Enter email addresses" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={() => setShowModal(false)} className="btn btn-primary">Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduledReports;