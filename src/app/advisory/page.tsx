'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { advisoryRequests } from '@/data/store';
import { 
  ADVISORY_STATUS_COLORS, 
  ADVISORY_STATUS_LABELS, 
  ADVISORY_CATEGORY_LABELS, 
  formatDate, 
  URGENCY_COLORS 
} from '@/utils/formatters';
import { 
  Search, Plus, Filter, Download, ArrowUpDown, 
  ChevronLeft, ChevronRight, CheckSquare, Square, MoreHorizontal, Clock
} from 'lucide-react';
import type { AdvisoryRequest } from '@/types';

export default function AdvisoryListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [sortColumn, setSortColumn] = useState<string>('slaDeadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  const departments = useMemo(() => {
    const deptSet = new Set<string>(advisoryRequests.map(r => r.requestingDepartment));
    return Array.from(deptSet);
  }, []);

  const filtered = useMemo(() => {
    return advisoryRequests.filter(r => {
      const matchesSearch = 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
      const matchesUrgency = selectedUrgency === 'all' || r.urgency === selectedUrgency;
      const matchesDepartment = selectedDepartment === 'all' || r.requestingDepartment === selectedDepartment;
      return matchesSearch && matchesStatus && matchesUrgency && matchesDepartment;
    });
  }, [searchTerm, selectedStatus, selectedUrgency, selectedDepartment]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal, bVal;
      switch(sortColumn) {
        case 'id': aVal = a.id; bVal = b.id; break;
        case 'title': aVal = a.title; bVal = b.title; break;
        case 'department': aVal = a.requestingDepartment; bVal = b.requestingDepartment; break;
        case 'category': aVal = a.category; bVal = b.category; break;
        case 'status': aVal = a.status; bVal = b.status; break;
        case 'priority': aVal = a.urgency; bVal = b.urgency; break;
        case 'slaDeadline': 
          aVal = new Date(a.slaDeadline).getTime();
          bVal = new Date(b.slaDeadline).getTime();
          break;
        default: aVal = a.id; bVal = b.id;
      }
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [filtered, sortColumn, sortDirection]);

  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const exportCSV = () => {
    const dataToExport = selectedIds.length > 0 
      ? advisoryRequests.filter(r => selectedIds.includes(r.id))
      : filtered;
      
    const headers = ['Request ID', 'Subject', 'Department', 'Category', 'Status', 'Priority', 'SLA Deadline', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(r => [
        r.id,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.requestingDepartment.replace(/"/g, '""')}"`,
        `"${ADVISORY_CATEGORY_LABELS[r.category]}"`,
        `"${ADVISORY_STATUS_LABELS[r.status]}"`,
        `"${r.urgency}"`,
        r.slaDeadline ? formatDate(r.slaDeadline) : '',
        r.createdAt ? formatDate(r.createdAt) : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nib-legal-requests.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    alert('PDF export would be implemented with a library like jsPDF or react-pdf. For now, this is a placeholder.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Legal Advisory (LAHD)</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>Manage legal advice requests, advisory opinions, and legal support.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} style={{ marginRight: 6 }} /> Filters
          </button>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary">
              <Download size={16} style={{ marginRight: 6 }} /> Export
            </button>
            <div style={{ 
              position: 'absolute', right: 0, top: '100%', marginTop: 8,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)',
              padding: 4, minWidth: 180, zIndex: 10
            }}>
              <button 
                style={{ 
                  width: '100%', textAlign: 'left', padding: '8px 12px',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)'
                }}
                className="hover-card"
                onClick={exportCSV}
              >
                Export Excel / CSV
              </button>
              <button 
                style={{ 
                  width: '100%', textAlign: 'left', padding: '8px 12px',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)'
                }}
                className="hover-card"
                onClick={exportPDF}
              >
                Export PDF
              </button>
            </div>
          </div>
          <Link href="/advisory/new" className="btn btn-primary">
            <Plus size={16} /> New Request
          </Link>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 16, 
          padding: '12px 16px', background: 'var(--bg-input)', 
          borderRadius: 'var(--radius)', border: '1px solid var(--border)' 
        }}>
          <span style={{ fontWeight: 600 }}>{selectedIds.length} requests selected</span>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button className="btn btn-secondary btn-sm">Bulk Update Status</button>
            <button className="btn btn-secondary btn-sm">Bulk Export</button>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {showFilters && (
          <div style={{ 
            display: 'flex', gap: 12, marginBottom: 20, 
            paddingBottom: 20, borderBottom: '1px solid var(--border-light)',
            flexWrap: 'wrap' 
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 400 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by ID or subject..." 
                style={{ paddingLeft: 36 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-control" 
              style={{ width: 180 }}
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {Object.entries(ADVISORY_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v as string}</option>
              ))}
            </select>
            <select 
              className="form-control" 
              style={{ width: 180 }}
              value={selectedUrgency}
              onChange={e => setSelectedUrgency(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select 
              className="form-control" 
              style={{ width: 180 }}
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <button 
                    onClick={toggleSelectAll} 
                    style={{ 
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 4
                    }}
                  >
                    {selectedIds.length === paginated.length && paginated.length > 0 
                      ? <CheckSquare size={18} color="var(--accent)" /> 
                      : <Square size={18} color="var(--text-muted)" />}
                  </button>
                </th>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Request ID {sortColumn === 'id' && <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Subject {sortColumn === 'title' && <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Department {sortColumn === 'department' && <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Category {sortColumn === 'category' && <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Status {sortColumn === 'status' && <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Priority {sortColumn === 'priority' && <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th onClick={() => handleSort('slaDeadline')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    SLA Deadline {sortColumn === 'slaDeadline' && <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(request => {
                const isSlaBreached = new Date(request.slaDeadline) < new Date() && 
                  !['dispatched', 'closed'].includes(request.status);
                
                return (
                  <tr key={request.id}>
                    <td>
                      <button 
                        onClick={() => toggleSelect(request.id)}
                        style={{ 
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 4
                        }}
                      >
                        {selectedIds.includes(request.id) 
                          ? <CheckSquare size={18} color="var(--accent)" /> 
                          : <Square size={18} color="var(--text-muted)" />}
                      </button>
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      <Link href={`/advisory/opinion/${request.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{request.id}</Link>
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{request.title}</td>
                    <td style={{ fontSize: 13 }}>{request.requestingDepartment}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ADVISORY_CATEGORY_LABELS[request.category]}</td>
                    <td>
                      <span className={`badge ${(ADVISORY_STATUS_COLORS as any)[request.status]}`}>{(ADVISORY_STATUS_LABELS as any)[request.status]}</span>
                    </td>
                    <td>
                      <span className={`badge ${URGENCY_COLORS[request.urgency]}`}>{request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}</span>
                    </td>
                    <td style={{ fontSize: 12, color: isSlaBreached ? 'var(--danger)' : 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isSlaBreached && <Clock size={14} />}
                        {formatDate(request.slaDeadline)}
                      </div>
                    </td>
                    <td>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <MoreHorizontal size={16} color="var(--text-muted)" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No legal requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing {((currentPage - 1) * itemsPerPage + 1)} to {Math.min(currentPage * itemsPerPage, sorted.length)} of {sorted.length} requests
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button 
                className="btn btn-ghost btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={currentPage === page ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                  onClick={() => setCurrentPage(page)}
                  style={{ minWidth: 32 }}
                >
                  {page}
                </button>
              ))}
              <button 
                className="btn btn-ghost btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
