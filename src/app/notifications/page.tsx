'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, Zap, CheckCircle, Clock, Trash2, Filter, Mail, Pin, Star, Check, Megaphone, Inbox, Send, Edit, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages' | 'announcements'>('notifications');
  const [filter, setFilter] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  // ─── Queries ────────────────────────────────────────────────────────
  const { data: notifData, isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications', filter, status],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?type=${filter}&status=${status}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    }
  });

  const { data: messageData, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    }
  });

  // ─── Mutations ──────────────────────────────────────────────────────
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'read' }) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications', { method: 'PUT' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const deleteNotif = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  // ─── Helpers ────────────────────────────────────────────────────────
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'EXPIRY_ALERT': return <AlertTriangle size={18} color="var(--warning)" />;
      case 'SLA_ALERT': return <Zap size={18} color="var(--danger)" />;
      case 'WORKFLOW': return <CheckCircle size={18} color="var(--success)" />;
      case 'ANNOUNCEMENT': return <Megaphone size={18} color="var(--info)" />;
      default: return <Bell size={18} color="var(--text-muted)" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-danger/10 text-danger border border-danger/20';
      case 'HIGH': return 'bg-warning/10 text-warning border border-warning/20';
      case 'MEDIUM': return 'bg-info/10 text-info border border-info/20';
      case 'LOW': return 'bg-success/10 text-success border border-success/20';
      default: return 'bg-border text-muted';
    }
  };

  const unreadCount = notifData?.stats?.unreadNotifications || 0;
  const unreadMsgCount = notifData?.stats?.unreadMessages || 0;
  const notifications = notifData?.notifications || [];
  const announcements = notifData?.announcements || [];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold m-0">Communication Center</h1>
            <p className="text-sm text-muted m-0 flex gap-4 mt-1">
              <span><strong className="text-accent">{unreadCount}</strong> unread alerts</span>
              <span><strong className="text-accent">{unreadMsgCount}</strong> unread messages</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><Edit size={16} /> Compose</button>
          <button className="btn btn-primary" onClick={() => markAllRead.mutate()} disabled={unreadCount === 0 || markAllRead.isPending}>
            <Check size={16} /> Mark All Read
          </button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="tabs">
        {[
          { id: 'notifications', label: 'Alerts & Notifications', icon: <Bell size={16}/>, badge: unreadCount },
          { id: 'messages', label: 'Message Center', icon: <Mail size={16}/>, badge: unreadMsgCount },
          { id: 'announcements', label: 'Announcements', icon: <Megaphone size={16}/> }
        ].map(t => (
          <button 
            key={t.id} 
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id as any)}
          >
            {t.icon} {t.label} 
            {t.badge > 0 && <span className="tab-count bg-danger text-white">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── Content Area ─────────────────────────────────────── */}
      <div className="grid grid-cols-[240px_1fr] gap-6 items-start">
        
        {/* Sidebar Filters */}
        <div className="flex flex-col gap-4">
          {activeTab === 'notifications' && (
            <>
              <div className="card card-sm">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Categories</h3>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'ALL', label: 'All Alerts', icon: <Filter size={14}/> },
                    { id: 'WORKFLOW', label: 'Workflow', icon: <CheckCircle size={14}/> },
                    { id: 'EXPIRY_ALERT', label: 'Expirations', icon: <AlertTriangle size={14}/> },
                    { id: 'SLA_ALERT', label: 'SLA Breaches', icon: <Zap size={14}/> },
                  ].map(f => (
                    <button 
                      key={f.id} onClick={() => setFilter(f.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${filter === f.id ? 'bg-accent/10 text-accent' : 'text-secondary hover:bg-card-hover'}`}
                    >
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card card-sm">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Status</h3>
                <div className="flex flex-col gap-1">
                  {['ALL', 'UNREAD', 'READ'].map(s => (
                    <button 
                      key={s} onClick={() => setStatus(s)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize ${status === s ? 'bg-accent/10 text-accent' : 'text-secondary hover:bg-card-hover'}`}
                    >
                      {s.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'messages' && (
            <div className="card card-sm">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Mailbox</h3>
              <div className="flex flex-col gap-1">
                <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-accent/10 text-accent"><Inbox size={14}/> Inbox</button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-secondary hover:bg-card-hover"><Send size={14}/> Sent</button>
              </div>
            </div>
          )}
        </div>

        {/* Main List */}
        <div className="card p-0 overflow-hidden min-h-[500px]">
          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            loadingNotifs ? <div className="p-12 text-center text-muted flex items-center justify-center gap-2"><RefreshCw className="animate-spin" size={16}/> Loading...</div> :
            notifications.length === 0 ? <div className="p-20 text-center text-muted">No notifications found.</div> :
            <div className="flex flex-col divide-y divide-border">
              {notifications.map((n: any) => (
                <div 
                  key={n.id} 
                  className={`flex p-5 gap-4 hover:bg-card-hover transition-colors relative ${n.status === 'UNREAD' ? 'bg-accent/5' : ''}`}
                  onMouseEnter={() => n.status === 'UNREAD' && markRead.mutate(n.id)}
                >
                  {n.status === 'UNREAD' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />}
                  
                  <div className="w-10 h-10 rounded-full bg-input border border-border flex items-center justify-center shrink-0">
                    {getTypeIcon(n.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-sm m-0 ${n.status === 'UNREAD' ? 'font-bold text-primary' : 'font-semibold text-primary/80'}`}>{n.title}</h3>
                      <div className="flex items-center gap-3 shrink-0 ml-4 text-muted">
                        <span className="text-xs flex items-center gap-1"><Clock size={12}/> {formatDistanceToNow(new Date(n.createdAt))} ago</span>
                        <button onClick={() => deleteNotif.mutate(n.id)} className="hover:text-danger transition-colors p-1"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <p className="text-sm text-secondary mb-3 leading-relaxed">{n.body}</p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(n.priority)}`}>{n.priority}</span>
                      {n.module && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-input text-muted border border-border">{n.module}</span>}
                      {n.actionUrl && (
                        <Link href={n.actionUrl} className="text-xs font-semibold text-accent hover:underline ml-2">
                          View Details &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            loadingMessages ? <div className="p-12 text-center text-muted">Loading messages...</div> :
            <div className="p-20 text-center text-muted flex flex-col items-center gap-3">
              <Mail size={48} className="opacity-20" />
              <p>Inbox is empty.</p>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Megaphone size={20} className="text-info"/> System Announcements</h2>
              {announcements.length === 0 ? <p className="text-muted text-sm">No active announcements at this time.</p> : (
                <div className="flex flex-col gap-4">
                  {announcements.map((a: any) => (
                    <div key={a.id} className="border border-info/30 bg-info/5 rounded-lg p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-info m-0">{a.title}</h3>
                        <span className="text-xs text-muted">{formatDistanceToNow(new Date(a.createdAt))} ago</span>
                      </div>
                      <p className="text-sm text-secondary m-0 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                      <div className="mt-4 pt-3 border-t border-info/10 text-xs text-muted flex items-center gap-2">
                        <span>Published by {a.author?.firstName} {a.author?.lastName}</span>
                        {a.expiresAt && <span>· Expires {new Date(a.expiresAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
