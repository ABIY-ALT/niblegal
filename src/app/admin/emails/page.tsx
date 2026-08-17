'use client';

import { Mail, Save } from 'lucide-react';

const templates = [
  { name: 'Contract Expiry Reminder', subject: 'Contract expiry action required', channel: 'CMS' },
  { name: 'Approval Request', subject: 'Document awaiting approval', channel: 'Workflow' },
  { name: 'SLA Breach Warning', subject: 'SLA warning for legal advisory request', channel: 'LAHD' },
];

export default function AdminEmailTemplatesPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-2"><Mail size={24} className="text-accent" /> Email Templates</h1>
          <p className="text-muted text-sm mt-1">Review standard outbound messages used by workflow and expiry alerts.</p>
        </div>
        <button className="btn btn-primary"><Save size={16} /> Save Changes</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-bg-input text-muted text-[11px] uppercase tracking-wider border-b border-border">
            <tr><th className="py-3 px-4">Template</th><th className="px-4">Subject</th><th className="px-4">Module</th><th className="px-4 text-right">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {templates.map(template => (
              <tr key={template.name}>
                <td className="py-3 px-4 font-semibold">{template.name}</td>
                <td className="px-4">{template.subject}</td>
                <td className="px-4">{template.channel}</td>
                <td className="px-4 text-right"><span className="badge status-active">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
