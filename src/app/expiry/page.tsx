'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  Bell,
  Mail,
  Send,
  Download,
  ChevronRight,
  Clock,
  Filter,
  X
} from 'lucide-react';
import { differenceInDays, isPast } from 'date-fns';
import {
  contracts as storeContracts
} from '@/data/store';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_CATEGORY_LABELS,
  formatDate
} from '@/utils/formatters';
import type { Contract } from '@/types';

type ExpiryCategory = '90d' | '60d' | '30d' | 'expired';

export default function ContractExpiryPage() {
  const [contracts] = useState(storeContracts);
  const [selectedCategory, setSelectedCategory] = useState<ExpiryCategory | null>(null);
  const [reminderSent, setReminderSent] = useState<string[]>([]);

  // Categorize contracts
  const { expiring90, expiring60, expiring30, expired } = useMemo(() => {
    const now = new Date();
    const exp90: Contract[] = [];
    const exp60: Contract[] = [];
    const exp30: Contract[] = [];
    const exp: Contract[] = [];

    contracts.forEach(c => {
      if (!c.expiryDate) return;
      const expiry = new Date(c.expiryDate);
      
      if (isPast(expiry)) {
        exp.push(c);
        return;
      }

      const daysUntil = differenceInDays(expiry, now);

      if (daysUntil <= 30) {
        exp30.push(c);
      } else if (daysUntil <= 60) {
        exp60.push(c);
      } else if (daysUntil <= 90) {
        exp90.push(c);
      }
    });

    return { expiring90: exp90, expiring60: exp60, expiring30: exp30, expired: exp };
  }, [contracts]);

  const categories: { 
    key: ExpiryCategory; 
    label: string; 
    contracts: Contract[]; 
    color: string;
    badge: string;
  }[] = [
    { key: '30d', label: 'Expiring in 30 Days', contracts: expiring30, color: 'var(--danger)', badge: 'bg-red-100 text-red-800' },
    { key: '60d', label: 'Expiring in 60 Days', contracts: expiring60, color: 'var(--warning)', badge: 'bg-amber-100 text-amber-800' },
    { key: '90d', label: 'Expiring in 90 Days', contracts: expiring90, color: 'var(--accent)', badge: 'bg-blue-100 text-blue-800' },
    { key: 'expired', label: 'Expired Contracts', contracts: expired, color: 'var(--text-muted)', badge: 'bg-gray-100 text-gray-800' }
  ];

  const handleSendReminder = (id: string, type: string) => {
    setReminderSent(prev => [...prev, id]);
    alert(`${type} reminder sent successfully!`);
    setTimeout(() => {
      setReminderSent(prev => prev.filter(cid => cid !== id));
    }, 3000);
  };

  const totalAtRisk = expiring90.length + expiring60.length + expiring30.length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Contract Expiry Tracker</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Monitor and manage contracts approaching their expiry dates
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{totalAtRisk}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Contracts at Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {categories.map(cat => (
          <div 
            key={cat.key} 
            className="card" 
            style={{ 
              padding: 16, 
              cursor: 'pointer',
              borderLeft: `4px solid ${cat.color}`,
              background: selectedCategory === cat.key ? 'var(--gold)' + '10' : 'white'
            }}
            onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>{cat.label}</h4>
              <span style={{ 
                padding: '4px 10px', 
                borderRadius: 999, 
                fontSize: 11, 
                fontWeight: 600,
                background: cat.key === '30d' ? 'var(--danger)' + '15' : 
                            cat.key === '60d' ? 'var(--warning)' + '15' : 
                            cat.key === '90d' ? 'var(--accent)' + '15' : 'var(--border-light)',
                color: cat.color
              }}>
                {cat.contracts.length}
              </span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: cat.color }}>
              {cat.contracts.length}
            </p>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {cat.contracts.length === 1 ? 'contract' : 'contracts'}
            </div>
          </div>
        ))}
      </div>

      {/* Expiry Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {(selectedCategory ? categories.filter(c => c.key === selectedCategory) : categories).map(cat => (
          <div key={cat.key} className="card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ 
                  width: 10, height: 10, borderRadius: '50%', background: cat.color 
                }} />
                <span className="card-title">{cat.label}</span>
                <span style={{ 
                  padding: '2px 10px', 
                  borderRadius: 999, 
                  fontSize: 11, 
                  fontWeight: 600,
                  background: cat.key === '30d' ? 'var(--danger)' + '15' : 
                              cat.key === '60d' ? 'var(--warning)' + '15' : 
                              cat.key === '90d' ? 'var(--accent)' + '15' : 'var(--border-light)',
                  color: cat.color
                }}>
                  {cat.contracts.length}
                </span>
              </div>
              {cat.contracts.length > 0 && (
                <button className="btn btn-secondary btn-sm">
                  <Send size={14} /> Send All Reminders
                </button>
              )}
            </div>

            {cat.contracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                <Calendar size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p>No {cat.label.toLowerCase()}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ minWidth: 800 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Contract</th>
                      <th>Category</th>
                      <th>Counterparty</th>
                      <th>Department</th>
                      <th>Start Date</th>
                      <th>Expiry Date</th>
                      <th style={{ width: 280 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.contracts.map(contract => {
                      const daysRemaining = contract.expiryDate 
                        ? differenceInDays(new Date(contract.expiryDate), new Date())
                        : 0;
                      return (
                        <tr key={contract.id}>
                          <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                            <div style={{ 
                              width: 8, height: 8, borderRadius: '50%', 
                              background: cat.color, margin: '0 auto'
                            }} />
                          </td>
                          <td>
                            <Link href={`/contracts/${contract.id}`} style={{ fontWeight: 600 }}>
                              {contract.title}
                            </Link>
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                              {contract.id}
                            </div>
                          </td>
                          <td>{CONTRACT_CATEGORY_LABELS[contract.category]}</td>
                          <td>{contract.counterparty}</td>
                          <td>{contract.requestingDepartment}</td>
                          <td>{formatDate(contract.startDate)}</td>
                          <td>
                            <span style={{ color: cat.color, fontWeight: 600 }}>
                              {formatDate(contract.expiryDate)}
                            </span>
                            <div style={{ 
                              fontSize: 11, 
                              color: 'var(--text-muted)', 
                              marginTop: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Clock size={10} />
                              {cat.key === 'expired' 
                                ? `Expired ${Math.abs(daysRemaining)} days ago`
                                : `${daysRemaining} days remaining`
                              }
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {reminderSent.includes(contract.id) ? (
                                <button className="btn btn-success btn-sm" disabled>
                                  <Bell size={14} /> Reminder Sent
                                </button>
                              ) : (
                                <>
                                  <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleSendReminder(contract.id, 'Email')}
                                  >
                                    <Mail size={14} /> Email
                                  </button>
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleSendReminder(contract.id, 'System')}
                                  >
                                    <Bell size={14} /> Notify
                                  </button>
                                </>
                              )}
                              <Link 
                                href={`/contracts/${contract.id}`} 
                                className="btn btn-ghost btn-sm"
                              >
                                <ChevronRight size={14} /> View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
