'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, Zap, CheckCircle, Clock, Trash2, Filter, Mail, Check, Megaphone, Inbox, Send, Edit, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type NotificationTab = 'notifications' | 'messages' | 'announcements';

type NotificationCenterProps = {
  initialTab?: NotificationTab;
  initialFilter?: string;
  initialStatus?: string;
  initialPriority?: string;
};

type Mailbox = 'inbox' | 'sent';

type MessageUser = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roleName?: string;
  departmentName?: string | null;
  role?: { name: string };
};

type MessageItem = {
  id: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  thread: { id: string; subject: string };
  sender: MessageUser;
  recipient: MessageUser;
};

export default function NotificationCenter({
  initialTab = 'notifications',
  initialFilter = 'ALL',
  initialStatus = 'ALL',
  initialPriority = 'ALL',
}: NotificationCenterProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<NotificationTab>(initialTab);
  const [filter, setFilter] = useState(initialFilter);
  const [status, setStatus] = useState(initialStatus);
  const [priority] = useState(initialPriority);
  const [mailbox, setMailbox] = useState<Mailbox>('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipientId: '', subject: '', body: '' });
  const [composeError, setComposeError] = useState<string | null>(null);

  // ─── Queries ────────────────────────────────────────────────────────
  const { data: notifData, isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications', filter, status, priority],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?type=${filter}&status=${status}&priority=${priority}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    }
  });

  const { data: messageData, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', mailbox],
    queryFn: async () => {
      const res = await fetch(`/api/messages?type=${mailbox}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    }
  });

  const { data: usersData } = useQuery({
    queryKey: ['message-users'],
    queryFn: async () => {
      const res = await fetch('/api/messages/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: composeOpen,
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

  const sendMessage = useMutation({
    mutationFn: async () => {
      setComposeError(null);
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeForm),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to send message');
      return json;
    },
    onSuccess: () => {
      setComposeOpen(false);
      setComposeForm({ recipientId: '', subject: '', body: '' });
      setMailbox('sent');
      setActiveTab('messages');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => setComposeError(error instanceof Error ? error.message : 'Failed to send message'),
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
  const messages: MessageItem[] = messageData?.messages || [];
  const users: MessageUser[] = usersData?.users || [];

  const formatPerson = (person?: MessageUser) => {
    if (!person) return 'Unknown user';
    if (person.name) return person.name;
    return `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || person.email || 'Unknown user';
  };

  const submitCompose = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage.mutate();
  };

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
          <button className="btn btn-secondary" onClick={() => { setActiveTab('messages'); setComposeOpen(true); }}>
            <Edit size={16} /> Compose
          </button>
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
            {!!t.badge && t.badge > 0 && <span className="tab-count bg-danger text-white">{t.badge}</span>}
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
                <button
                  onClick={() => setMailbox('inbox')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${mailbox === 'inbox' ? 'bg-accent/10 text-accent' : 'text-secondary hover:bg-card-hover'}`}
                >
                  <Inbox size={14}/> Inbox
                </button>
                <button
                  onClick={() => setMailbox('sent')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${mailbox === 'sent' ? 'bg-accent/10 text-accent' : 'text-secondary hover:bg-card-hover'}`}
                >
                  <Send size={14}/> Sent
                </button>
                <button
                  onClick={() => setComposeOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-secondary hover:bg-card-hover"
                >
                  <Edit size={14}/> Compose
                </button>
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
            messages.length === 0 ? <div className="p-20 text-center text-muted flex flex-col items-center gap-3">
              <Mail size={48} className="opacity-20" />
              <p>{mailbox === 'inbox' ? 'Inbox is empty.' : 'No sent messages yet.'}</p>
              <button className="btn btn-primary btn-sm mt-2" onClick={() => setComposeOpen(true)}><Edit size={14}/> Compose Message</button>
            </div> :
            <div className="flex flex-col divide-y divide-border">
              {messages.map((message) => (
                <div key={message.id} className={`p-5 hover:bg-card-hover transition-colors ${!message.isRead && mailbox === 'inbox' ? 'bg-accent/5' : ''}`}>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h3 className="text-sm font-bold m-0 text-primary">{message.thread.subject}</h3>
                      <div className="text-xs text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span><strong>From:</strong> {formatPerson(message.sender)}{message.sender.email ? ` (${message.sender.email})` : ''}</span>
                        <span><strong>To:</strong> {formatPerson(message.recipient)}{message.recipient.email ? ` (${message.recipient.email})` : ''}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted flex items-center gap-1 shrink-0">
                      <Clock size={12}/> {formatDistanceToNow(new Date(message.createdAt))} ago
                    </span>
                  </div>
                  <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{message.body}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="badge bg-bg-input text-muted">{mailbox === 'inbox' ? 'Received' : 'Sent'}</span>
                    {message.sender.role?.name && <span className="badge bg-bg-input text-muted">Sender: {message.sender.role.name}</span>}
                    {message.recipient.role?.name && <span className="badge bg-bg-input text-muted">Receiver: {message.recipient.role.name}</span>}
                  </div>
                </div>
              ))}
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

      {composeOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setComposeOpen(false)}>
          <form className="card w-full max-w-[560px]" onSubmit={submitCompose} onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h2 className="text-lg font-bold m-0 flex items-center gap-2"><Edit size={18} className="text-accent" /> New Message</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setComposeOpen(false)}>Close</button>
            </div>

            {composeError && <div className="alert alert-danger">{composeError}</div>}

            <div className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Receiver</label>
                <select
                  className="form-control"
                  value={composeForm.recipientId}
                  onChange={(event) => setComposeForm((prev) => ({ ...prev, recipientId: event.target.value }))}
                  required
                >
                  <option value="">Select user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {formatPerson(user)} - {user.roleName}{user.departmentName ? `, ${user.departmentName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  className="form-control"
                  value={composeForm.subject}
                  onChange={(event) => setComposeForm((prev) => ({ ...prev, subject: event.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={composeForm.body}
                  onChange={(event) => setComposeForm((prev) => ({ ...prev, body: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
              <button type="button" className="btn btn-ghost" onClick={() => setComposeOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={sendMessage.isPending}>
                <Send size={16}/> {sendMessage.isPending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
