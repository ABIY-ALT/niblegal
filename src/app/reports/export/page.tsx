'use client';

import { useState } from 'react';
import {
  Download, FileText, FileSpreadsheet, File, Printer, FilePlus, History
} from 'lucide-react';

function ExportCenter() {
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedReport, setSelectedReport] = useState('');

  const exportHistory = [
    { id: 1, name: 'Weekly Contract Report', format: 'PDF', date: '2026-07-03', user: 'Dr. Tadesse Girma' },
    { id: 2, name: 'Advisory Stats', format: 'Excel', date: '2026-07-02', user: 'Yonas Bekele' },
    { id: 3, name: 'Compliance Report', format: 'CSV', date: '2026-07-01', user: 'Meron Alemu' }
  ];

  const reports = [
    { id: 'contracts-status', name: 'Contract Status Report' },
    { id: 'contracts-value', name: 'Contract Value Report' },
    { id: 'advisory-stats', name: 'Advisory Statistics' },
    { id: 'sla-compliance', name: 'SLA Compliance Report' },
    { id: 'performance-summary', name: 'Performance Summary' },
    { id: 'audit-trail', name: 'Audit Trail Report' }
  ];

  const exportReport = () => {
    alert(`Exporting ${selectedReport} as ${selectedFormat.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export Center</h1>
        <p className="text-gray-500">Download and print reports in various formats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Form */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <FilePlus size={18} />
              <span className="card-title">New Export</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Select Report</label>
              <select
                className="form-control"
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
              >
                <option value="">-- Choose a report --</option>
                {reports.map(report => (
                  <option key={report.id} value={report.id}>{report.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Export Format</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${selectedFormat === 'pdf' ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setSelectedFormat('pdf')}
                >
                  <FileText size={24} className="text-red-600" />
                  <span className="text-xs font-medium">PDF</span>
                </button>
                <button
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${selectedFormat === 'excel' ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setSelectedFormat('excel')}
                >
                  <FileSpreadsheet size={24} className="text-green-600" />
                  <span className="text-xs font-medium">Excel</span>
                </button>
                <button
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${selectedFormat === 'csv' ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setSelectedFormat('csv')}
                >
                  <File size={24} className="text-blue-600" />
                  <span className="text-xs font-medium">CSV</span>
                </button>
                <button
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${selectedFormat === 'print' ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setSelectedFormat('print')}
                >
                  <Printer size={24} className="text-purple-600" />
                  <span className="text-xs font-medium">Print</span>
                </button>
              </div>
            </div>

            <button
              onClick={exportReport}
              disabled={!selectedReport || !selectedFormat}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>

        {/* Export History */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <History size={18} />
              <span className="card-title">Export History</span>
            </div>
          </div>
          <div className="divide-y">
            {exportHistory.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded">
                    {item.format === 'PDF' && <FileText size={20} className="text-red-600" />}
                    {item.format === 'Excel' && <FileSpreadsheet size={20} className="text-green-600" />}
                    {item.format === 'CSV' && <File size={20} className="text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.date} • {item.user}</p>
                  </div>
                </div>
                <span className="badge bg-gray-100 text-gray-800">{item.format}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportCenter;