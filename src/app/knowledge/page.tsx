'use client';

import { useState } from 'react';
import Link from 'next/link';
import { knowledgeItems, updateKnowledgeItem } from '@/data/store';
import { KNOWLEDGE_TYPE_LABELS, KNOWLEDGE_TYPE_ICONS, formatDate } from '@/utils/formatters';
import { Search, Plus, Filter, Download, BookOpen, Tag, FileText, FileSpreadsheet, File, Gavel, Book, FileCheck, ChevronRight } from 'lucide-react';
import type { KnowledgeItemCategory } from '@/types';

const CATEGORIES: KnowledgeItemCategory[] = [
  'Contract Templates',
  'Legal Opinions',
  'Policies',
  'NBE Directives',
  'Research',
  'Articles'
];

const getCategoryIcon = (category: KnowledgeItemCategory) => {
  switch (category) {
    case 'Contract Templates':
      return <FileText size={24} />;
    case 'Legal Opinions':
      return <Gavel size={24} />;
    case 'Policies':
      return <FileCheck size={24} />;
    case 'NBE Directives':
      return <FileSpreadsheet size={24} />;
    case 'Research':
      return <Book size={24} />;
    case 'Articles':
      return <File size={24} />;
    default:
      return <BookOpen size={24} />;
  }
};

export default function KnowledgeDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeItemCategory | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<KnowledgeItemCategory | 'all'>('all');

  const filtered = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesCategory = (selectedCategory === 'all' && activeCategory === 'all') || 
                            item.category === selectedCategory || 
                            item.category === activeCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleDownload = (item: any) => {
    // Increment download count
    updateKnowledgeItem(item.id, { downloads: item.downloads + 1 });
    
    // Create a simple text file for demonstration
    const content = `${item.title}\n\n${item.description}\n\nTags: ${item.tags.join(', ')}\nUploaded by: ${item.uploadedBy}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${item.title.replace(/\s+/g, '-')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={24} color="var(--accent)" /> Knowledge Repository
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>Search templates, past opinions, and legal references.</p>
        </div>
        <Link href="/knowledge/new" className="btn btn-primary">
          <Plus size={16} /> Upload Item
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* ── Sidebar Categories ───────────────────────────────── */}
        <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 20 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Categories
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSelectedCategory('all');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: activeCategory === 'all' ? 'var(--accent)' : 'transparent',
                color: activeCategory === 'all' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'var(--transition)',
                fontSize: 14,
                fontWeight: 500
              }}
              className={activeCategory === 'all' ? '' : 'hover-card'}
            >
              <BookOpen size={18} />
              <span>All Categories</span>
              <span style={{ marginLeft: 'auto', background: activeCategory === 'all' ? 'rgba(255,255,255,0.2)' : 'var(--bg-input)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                {knowledgeItems.length}
              </span>
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSelectedCategory(category);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  background: activeCategory === category ? 'var(--accent)' : 'transparent',
                  color: activeCategory === category ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)',
                  fontSize: 14,
                  fontWeight: 500
                }}
                className={activeCategory === category ? '' : 'hover-card'}
              >
                {getCategoryIcon(category)}
                <span>{category}</span>
                <span style={{ marginLeft: 'auto', background: activeCategory === category ? 'rgba(255,255,255,0.2)' : 'var(--bg-input)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                  {knowledgeItems.filter(i => i.category === category).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Content ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            {/* ── Search and Filters ──────────────────────────────── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by title, description, or tags..." 
                  style={{ paddingLeft: 36 }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select 
                className="form-control" 
                style={{ width: 220 }}
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                {Object.entries(KNOWLEDGE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v as string}</option>
                ))}
              </select>
            </div>

            {/* ── Grid View ───────────────────────────────────────── */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <BookOpen size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>No knowledge items found matching your search.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {filtered.map(item => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', padding: 20, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-input)', transition: 'var(--transition)', cursor: 'pointer' }} className="hover-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontSize: 24, color: 'var(--accent)' }} title={(KNOWLEDGE_TYPE_LABELS as any)[item.type]}>
                        {(KNOWLEDGE_TYPE_ICONS as any)[item.type] || '📄'}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ padding: 6, color: 'var(--accent)' }} title="Download" onClick={() => handleDownload(item)}>
                        <Download size={16} />
                      </button>
                    </div>
                    
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.4, color: 'var(--text-primary)' }}>{item.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </p>
                    
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--accent)', color: 'white', borderRadius: 12, fontWeight: 600 }}>
                        {item.category}
                      </span>
                      {item.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                      <span>Uploaded by {item.uploadedBy}</span>
                      <span>{formatDate(item.uploadedAt)} • {item.downloads} dl</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
