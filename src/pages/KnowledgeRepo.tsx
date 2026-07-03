import { useState } from 'react';
import { knowledgeItems, addKnowledgeItem, generateKnowledgeId } from '../data/store';
import { KNOWLEDGE_TYPE_LABELS, KNOWLEDGE_TYPE_ICONS, formatDate } from '../utils/formatters';
import { Search, Plus, Download } from 'lucide-react';
import type { User, KnowledgeItem, KnowledgeItemType } from '../types';

interface Props { currentUser: User; }

export default function KnowledgeRepo({ currentUser }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<KnowledgeItemType | ''>('');
  const [showAdd, setShowAdd] = useState(false);
  const [items, setItems] = useState(knowledgeItems);
  const [form, setForm] = useState({ title: '', type: 'template' as KnowledgeItemType, category: '', description: '', tags: '' });

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.tags.some(t => t.includes(q));
    const matchType = !typeFilter || item.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const item: KnowledgeItem = {
      id: generateKnowledgeId(), title: form.title, type: form.type,
      category: form.category, description: form.description,
      uploadedBy: currentUser.name, uploadedAt: new Date().toISOString(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), downloads: 0,
    };
    addKnowledgeItem(item);
    setItems([item, ...items]);
    setShowAdd(false);
    setForm({ title: '', type: 'template', category: '', description: '', tags: '' });
  };

  return (
    <div>
      <div className="filters-bar">
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <Search size={16} />
          <input className="form-control" placeholder="Search knowledge repository..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
          <option value="">All Types</option>
          {(Object.keys(KNOWLEDGE_TYPE_LABELS) as KnowledgeItemType[]).map(t => <option key={t} value={t}>{KNOWLEDGE_TYPE_LABELS[t]}</option>)}
        </select>
        {(currentUser.role === 'legal_officer' || currentUser.role === 'manager' || currentUser.role === 'admin_assistant') && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Item</button>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add to Knowledge Repository</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group"><label className="form-label">Title *</label><input className="form-control" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-control" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as KnowledgeItemType }))}>
                      {(Object.keys(KNOWLEDGE_TYPE_LABELS) as KnowledgeItemType[]).map(t => <option key={t} value={t}>{KNOWLEDGE_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Category *</label><input className="form-control" required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} /></div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Tags</label><input className="form-control" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Item</button></div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(item => (
          <div key={item.id} className="card" style={{ cursor: 'default', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{KNOWLEDGE_TYPE_ICONS[item.type]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{item.id} · {KNOWLEDGE_TYPE_LABELS[item.type]}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>{item.description}</p>
            <div className="tags-list" style={{ marginBottom: 14 }}>
              {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                By {item.uploadedBy} · {formatDate(item.uploadedAt)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Download size={12} /> {item.downloads}
                </span>
                <button className="btn btn-secondary btn-sm"><Download size={12} /> Download</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <Search size={40} />
            <p>No items found</p>
          </div>
        )}
      </div>
    </div>
  );
}
