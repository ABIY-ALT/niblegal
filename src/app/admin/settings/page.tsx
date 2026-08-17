'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Settings, Plus, X, ListPlus } from 'lucide-react';
import { SystemLookups, useSystemLookups } from '@/hooks/useSystemLookups';

const settings = [
  ['Session timeout', '8 hours'],
  ['Password reset expiry', '24 hours'],
  ['Audit retention', '7 years'],
  ['Default renewal alert', '60 days before expiry'],
  ['SLA scan cadence', 'Hourly'],
];

export default function AdminSystemSettingsPage() {
  const qc = useQueryClient();
  const { lookups, isLoading } = useSystemLookups();
  const [localLookups, setLocalLookups] = useState<SystemLookups | null>(null);
  const [newVal, setNewVal] = useState('');

  // Copy server state to local state on first load
  if (!isLoading && !localLookups && lookups) {
    setLocalLookups(lookups);
  }

  const mutation = useMutation({
    mutationFn: async (updatedLookups: SystemLookups) => {
      const res = await fetch('/api/system', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'settings',
          data: { lookupConfig: updatedLookups }
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-settings-lookups'] });
      alert('Settings saved successfully!');
    }
  });

  const addLookupValue = (key: keyof SystemLookups) => {
    if (!newVal.trim() || !localLookups) return;
    
    // Auto format new value: replace spaces with underscores and uppercase
    const formattedVal = newVal.trim().replace(/\s+/g, '_').toUpperCase();
    
    if (localLookups[key].includes(formattedVal)) {
      alert('Value already exists!');
      return;
    }
    setLocalLookups({
      ...localLookups,
      [key]: [...localLookups[key], formattedVal]
    });
    setNewVal('');
  };

  const removeLookupValue = (key: keyof SystemLookups, value: string) => {
    if (!localLookups) return;
    setLocalLookups({
      ...localLookups,
      [key]: localLookups[key].filter(v => v !== value)
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-2"><Settings size={24} className="text-accent" /> System Settings</h1>
          <p className="text-muted text-sm mt-1">Review global defaults for sessions, audit retention, and configurable form fields.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => localLookups && mutation.mutate(localLookups)}
          disabled={mutation.isPending}
        >
          <Save size={16} /> {mutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Core Settings (Readonly for now) */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-bg-surface">
            <h2 className="text-sm font-bold text-primary flex items-center gap-2 m-0"><Settings size={16} className="text-muted" /> Core Parameters</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg-input text-muted text-[11px] uppercase tracking-wider border-b border-border">
              <tr><th className="py-3 px-4">Setting</th><th className="px-4">Current Value</th><th className="px-4 text-right">State</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {settings.map(([name, value]) => (
                <tr key={name}>
                  <td className="py-3 px-4 font-semibold">{name}</td>
                  <td className="px-4 text-muted">{value}</td>
                  <td className="px-4 text-right"><span className="badge status-active">Enabled</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Dynamic Lookup Configurations */}
        <div className="card p-0 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-border bg-bg-surface">
            <h2 className="text-sm font-bold text-primary flex items-center gap-2 m-0"><ListPlus size={16} className="text-muted" /> Form Field Configurations</h2>
            <p className="text-xs text-muted mt-1">Add new types to dropdowns across the application.</p>
          </div>
          
          <div className="p-5 flex flex-col gap-6">
            {localLookups && (Object.keys(localLookups) as Array<keyof SystemLookups>).map(key => (
              <div key={key}>
                <label className="text-sm font-bold text-primary mb-2 block">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {localLookups[key].map(val => (
                    <span key={val} className="badge bg-bg-input border border-border text-xs flex items-center gap-1.5 pl-2 pr-1 py-1">
                      {val.replace(/_/g, ' ')}
                      <button onClick={() => removeLookupValue(key, val)} className="text-muted hover:text-danger p-0.5 rounded-full hover:bg-bg-surface transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="form-control text-sm flex-1" 
                    placeholder="New value (e.g. Special Request)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setNewVal((e.target as HTMLInputElement).value);
                        setTimeout(() => addLookupValue(key), 0);
                      }
                    }}
                    onChange={(e) => setNewVal(e.target.value)}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={() => addLookupValue(key)}>Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
