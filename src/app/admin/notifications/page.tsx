'use client';

import { Bell, Save } from 'lucide-react';

const policies = [
  { name: 'Critical alerts', delivery: 'In-app and email', timing: 'Immediate' },
  { name: 'Contract expiry alerts', delivery: 'In-app and email', timing: '90, 60, and 30 days' },
  { name: 'Workflow updates', delivery: 'In-app', timing: 'Immediate' },
  { name: 'Daily digest', delivery: 'Email', timing: '08:00' },
];

export default function AdminNotificationSettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-2"><Bell size={24} className="text-accent" /> Notification Settings</h1>
          <p className="text-muted text-sm mt-1">Configure alert channels and reminder timing for system notifications.</p>
        </div>
        <button className="btn btn-primary"><Save size={16} /> Save Policy</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {policies.map(policy => (
          <div key={policy.name} className="card flex justify-between items-start gap-4">
            <div>
              <h2 className="text-base font-bold m-0">{policy.name}</h2>
              <p className="text-sm text-muted mt-2">{policy.delivery}</p>
            </div>
            <span className="badge bg-accent/10 text-accent">{policy.timing}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
