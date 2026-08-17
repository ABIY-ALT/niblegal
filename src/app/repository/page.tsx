'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Eye,
  Download,
  History,
  FileText,
  Calendar,
  Users,
  Building,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import {
  contracts as storeContracts,
  currentUser
} from '@/data/store';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_CATEGORY_LABELS,
  formatDate,
  formatDateTime,
  timeAgo
} from '@/utils/formatters';
import type { Contract } from '@/types';

export default function ContractRepositoryPage() {
  const [contracts, setContracts] = useState(storeContracts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '' as string,
    category: '' as string,
    department: '' as string
  });

  // Filter and Search
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.counterparty.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !filters.status || c.status === filters.status;
    const matchesCategory = !filters.category || c.category === filters.category;
    const matchesDepartment = !filters.department || c.requestingDepartment === filters.department;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment;
  });

  const statuses = Array.from(new Set(contracts.map(c => c.status)));
  const categories = Array.from(new Set(contracts.map(c => c.category)));
  const departments = Array.from(new Set(contracts.map(c => c.requestingDepartment)));

  const handleResetFilters = () => {
    setFilters({ status: '', category: '', department: '' });
    setSearchQuery('');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Contract Repository</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Manage and access all your contract documents
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} /> Filters
            {filters.status || filters.category || filters.department ? <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 999, fontSize: 10, background: 'var(--danger)', color: 'white' }}>•</span> : null}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: 18, height: 18 }} />
          <input 
            className="form-control" 
            placeholder="Search contracts by ID, title, counterparty..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            style={{ paddingLeft: 42 }}
          />
        </div>

        {showFilters && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Filter Contracts</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={handleResetFilters}>Reset</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-control" 
                  value={filters.status} 
                  onChange={e => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{CONTRACT_STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-control" 
                  value={filters.category} 
                  onChange={e => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{CONTRACT_CATEGORY_LABELS[category]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  className="form-control" 
                  value={filters.department} 
                  onChange={e => setFilters({ ...filters, department: e.target.value })}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedContract ? '1fr 480px' : '1fr', gap: 24, transition: 'all 0.3s ease' }}>
        {/* Contracts List */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <span className="card-title" style={{ fontSize: 13, fontWeight: 600 }}>
              {filteredContracts.length} {filteredContracts.length === 1 ? 'Contract' : 'Contracts'}
            </span>
          </div>
          <div style={{ maxHeight: 650, overflowY: 'auto' }}>
            {filteredContracts.map(contract => (
              <div 
                key={contract.id} 
                style={{ 
                  padding: 16, 
                  borderBottom: '1px solid var(--border-light)', 
                  cursor: 'pointer',
                  background: selectedContract?.id === contract.id ? 'color-mix(in srgb, var(--gold) 12%, transparent)' : 'transparent',
                  borderLeft: selectedContract?.id === contract.id ? '3px solid var(--gold)' : '3px solid transparent'
                }} 
                onClick={() => setSelectedContract(contract)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedContract(contract); }}
                tabIndex={0}
                role="button"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 8, 
                    background: 'linear-gradient(135deg, var(--gold), var(--accent))', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', flexShrink: 0
                  }}>
                    <FileText size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <h3 style={{ 
                            fontSize: 14, fontWeight: 600, margin: 0, 
                            color: selectedContract?.id === contract.id ? 'var(--gold)' : 'var(--text-primary)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {contract.title}
                          </h3>
                          <span className={`badge badge-sm ${CONTRACT_STATUS_COLORS[contract.status]}`} style={{ flexShrink: 0 }}>
                            {CONTRACT_STATUS_LABELS[contract.status]}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{contract.id}</div>
                      </div>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={(e) => { e.stopPropagation(); alert('Downloading contract...'); }}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: 16, 
                      marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Building size={12} />
                        <span>{contract.counterparty}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        <span>{contract.startDate ? formatDate(contract.startDate) : '—'} → {contract.expiryDate ? formatDate(contract.expiryDate) : '—'}</span>
                      </div>
                    </div>
                    {contract.tags.length > 0 && (
                      <div className="tags-list" style={{ marginTop: 8, gap: 4 }}>
                        {contract.tags.map(tag => (
                          <span key={tag} className="tag" style={{ fontSize: 10, padding: '2px 8px' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredContracts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
                <Search size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p>No contracts found</p>
              </div>
            )}
          </div>
        </div>

        {/* Contract Details Panel */}
        {selectedContract && (
          <div className="card" style={{ 
            position: 'sticky', top: 20, 
            maxHeight: 'calc(100vh - 120px)', 
            overflowY: 'auto', 
            animation: 'slideIn 0.3s ease'
          }}>
            <style>{`
              @keyframes slideIn {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            
            {/* Panel Header */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
              padding: '16px 20px', borderBottom: '1px solid var(--border-light)', 
              position: 'sticky', top: 0, background: 'white', zIndex: 10 
            }}>
              <div>
                <span className={`badge badge-sm ${CONTRACT_STATUS_COLORS[selectedContract.status]}`} style={{ marginBottom: 8 }}>
                  {CONTRACT_STATUS_LABELS[selectedContract.status]}
                </span>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{selectedContract.title}</h3>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                  {selectedContract.id}
                </div>
              </div>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setSelectedContract(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel Content */}
            <div style={{ padding: '20px' }}>
              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                <button className="btn btn-primary btn-sm">
                  <Eye size={14} /> Preview
                </button>
                <button className="btn btn-secondary btn-sm">
                  <Download size={14} /> Download
                </button>
              </div>

              {/* Metadata */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Metadata</h4>
                <div className="detail-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="detail-field">
                    <label>Category</label>
                    <span>{CONTRACT_CATEGORY_LABELS[selectedContract.category]}</span>
                  </div>
                  <div className="detail-field">
                    <label>Counterparty</label>
                    <span>{selectedContract.counterparty}</span>
                  </div>
                  <div className="detail-field">
                    <label>Requesting Department</label>
                    <span>{selectedContract.requestingDepartment}</span>
                  </div>
                  <div className="detail-field">
                    <label>Requested By</label>
                    <span>{selectedContract.requestedBy}</span>
                  </div>
                  {selectedContract.assignedOfficer && (
                    <div className="detail-field">
                      <label>Legal Officer</label>
                      <span>{selectedContract.assignedOfficer}</span>
                    </div>
                  )}
                  {selectedContract.value != null && selectedContract.value > 0 && (
                    <div className="detail-field">
                      <label>Contract Value</label>
                      <span>{selectedContract.value.toLocaleString()} {selectedContract.currency}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Duration</h4>
                <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="detail-field">
                    <label>Start Date</label>
                    <span>{selectedContract.startDate ? formatDate(selectedContract.startDate) : '—'}</span>
                  </div>
                  <div className="detail-field">
                    <label>Expiry Date</label>
                    <span style={{ color: selectedContract.status === 'expired' ? 'var(--danger)' : 'inherit' }}>
                      {selectedContract.expiryDate ? formatDate(selectedContract.expiryDate) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Version History */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>
                    <History size={12} style={{ display: 'inline', marginRight: 6 }} />
                    Version History
                  </h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {selectedContract.versions.length} {selectedContract.versions.length === 1 ? 'Version' : 'Versions'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedContract.versions.map((version, idx) => (
                    <div key={version.version} style={{ 
                      padding: 10, borderRadius: 8, border: '1px solid var(--border-light)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ 
                            fontSize: 12, fontWeight: 600, width: 24, height: 24, borderRadius: '50%',
                            background: idx === 0 ? 'var(--gold)' : 'var(--border-light)',
                            color: idx === 0 ? 'white' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            v{version.version}
                          </span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{version.notes}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {version.uploadedBy} • {timeAgo(version.uploadedAt)} • {version.fileSize}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm">
                        <Download size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {selectedContract.description && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Description</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    {selectedContract.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {selectedContract.tags.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Tags</h4>
                  <div className="tags-list">
                    {selectedContract.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                  </div>
                </div>
              )}

              {/* Link to Full Detail */}
              <Link 
                href={`/contracts/${selectedContract.id}`} 
                className="btn btn-primary" 
                style={{ width: '100%' }}
              >
                View Full Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
