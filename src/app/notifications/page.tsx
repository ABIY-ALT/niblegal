'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, Zap, CheckCircle, Clock, Check, Trash2, Filter, Mail } from 'lucide-react';
import { notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/data/store';
import { timeAgo } from '@/utils/formatters';
import type { NotificationType } from '@/types';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | NotificationType>('all');
  const [readStatus, setReadStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [state, setState] = useState(notifications);

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    setState([...notifications]);
  };

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id);
    setState([...notifications]);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    setState([...notifications]);
  };

  const getTypeIcon = (type: NotificationType) => {
    switch(type) {
      case 'expiry': return <AlertTriangle size={18} color="var(--warning)" />;
      case 'sla': return <Zap size={18} color="var(--danger)" />;
      case 'workflow': return <CheckCircle size={18} color="var(--success)" />;
      case 'email': return <Mail size={18} color="var(--accent)" />;
      default: return <Bell size={18} color="var(--text-muted)" />;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch(type) {
      case 'expiry': return 'var(--warning)';
      case 'sla': return 'var(--danger)';
      case 'workflow': return 'var(--success)';
      case 'email': return 'var(--accent)';
      default: return 'var(--text-muted)';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch(priority) {
      case 'critical': return 'status-danger';
      case 'high': return 'status-warning';
      case 'medium': return 'status-info';
      case 'low': return 'status-success';
      default: return '';
    }
  };

  const getRelatedLink = (relatedModule?: string, relatedId?: string) => {
    if (!relatedModule || !relatedId) return null;
    return relatedModule === 'CMS' ? `/contracts/${relatedId}` : `/advisory/${relatedId}`;
  };

  const filtered = state.filter(n => {
    const matchesType = filter === 'all' || n.type === filter;
    const matchesRead = 
      readStatus === 'all' ? true : 
      readStatus === 'unread' ? n.status === 'unread' : 
      n.status === 'read';
    return matchesType && matchesRead;
  });

  const unreadCount = state.filter(n => n.status === 'unread').length;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={24} color="var(--accent)" /> Notification Center
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
            You have <strong style={{ color: unreadCount > 0 ? 'var(--accent)' : 'inherit' }}>{unreadCount} unread</strong> messages.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
          <Check size={14} /> Mark all as read
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* ── Sidebar Filters ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 12 }}>
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 12, padding: '0 8px' }}>
              Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { id: 'all', label: 'All Notifications', icon: <Filter size={14}/> },
                { id: 'email', label: 'Email', icon: <Mail size={14}/> },
                { id: 'workflow', label: 'Workflow', icon: <CheckCircle size={14}/> },
                { id: 'expiry', label: 'Expirations', icon: <AlertTriangle size={14}/> },
                { id: 'sla', label: 'SLA Alerts', icon: <Zap size={14}/> },
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: 'none', 
                    background: filter === f.id ? 'var(--bg-input)' : 'transparent',
                    color: filter === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: filter === f.id ? 600 : 500, fontSize: 13, cursor: 'pointer', transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {f.icon} {f.label}
                  </div>
                  <span style={{ fontSize: 11, background: filter === f.id ? 'var(--bg-card)' : 'var(--bg-input)', padding: '2px 6px', borderRadius: 10, color: 'var(--text-muted)' }}>
                    {f.id === 'all' ? state.length : state.filter(n => n.type === f.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="card" style={{ padding: 12 }}>
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 12, padding: '0 8px' }}>
              Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'read', label: 'Read' },
              ].map(s => (
                <button 
                  key={s.id}
                  onClick={() => setReadStatus(s.id as any)}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: 'none', 
                    background: readStatus === s.id ? 'var(--bg-input)' : 'transparent',
                    color: readStatus === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: readStatus === s.id ? 600 : 500, fontSize: 13, cursor: 'pointer', transition: 'var(--transition)'
                  }}
                >
                  <span>{s.label}</span>
                  <span style={{ fontSize: 11, background: readStatus === s.id ? 'var(--bg-card)' : 'var(--bg-input)', padding: '2px 6px', borderRadius: 10, color: 'var(--text-muted)' }}>
                    {s.id === 'all' ? state.length : state.filter(n => n.status === s.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Notification List ────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <Bell size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p>No notifications found in this category.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map((n, i) => {
                const relatedLink = getRelatedLink(n.relatedModule, n.relatedId);
                return (
                  <div 
                    key={n.id} 
                    style={{ 
                      display: 'flex', padding: 20, gap: 16, borderBottom: i < filtered.length - 1 ? '1px solid var(--border-light)' : 'none',
                      background: n.status === 'read' ? 'var(--bg-card)' : 'rgba(37,99,235,0.03)',
                      transition: 'background 0.2s', position: 'relative'
                    }}
                    className="hover-card"
                    onMouseEnter={() => n.status === 'unread' && handleMarkRead(n.id)}
                  >
                    {/* Unread indicator dot */}
                    {n.status === 'unread' && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />}

                    {/* Icon */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-input)', border: `1px solid ${getTypeColor(n.type)}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getTypeIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <h3 style={{ fontSize: 14, fontWeight: n.status === 'read' ? 600 : 700, margin: 0, color: 'var(--text-primary)' }}>{n.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> {timeAgo(n.createdAt)}
                          </span>
                          <button onClick={() => handleDelete(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span className="badge" style={{ fontSize: 10, textTransform: 'uppercase', background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                          {n.type}
                        </span>
                        <span className={`badge ${getPriorityBadgeColor(n.priority)}`} style={{ fontSize: 10, textTransform: 'uppercase' }}>
                          {n.priority}
                        </span>
                        {relatedLink && (
                          <Link href={relatedLink} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                            View Details &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
