'use client';

import { useState } from 'react';
import {
  Save, Share, Eye, Download, Plus, Trash2, Filter, Settings, Calendar
} from 'lucide-react';

function ReportBuilder() {
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<{field: string, operator: string, value: string}[]>([]);
  const [savedTemplates, setSavedTemplates] = useState([
    { id: 1, name: 'Weekly Contract Summary', module: 'contracts' },
    { id: 2, name: 'Monthly Advisory Stats', module: 'advisory' }
  ]);

  const modules = [
    { id: 'contracts', name: 'Contracts', fields: ['ID', 'Title', 'Status', 'Category', 'Counterparty', 'Requesting Department', 'Start Date', 'Expiry Date', 'Value'] },
    { id: 'advisory', name: 'Legal Advisory', fields: ['ID', 'Subject', 'Status', 'Category', 'Requester', 'Assigned Officer', 'SLA Deadline', 'Priority'] },
    { id: 'knowledge', name: 'Knowledge', fields: ['ID', 'Title', 'Type', 'Category', 'Uploaded By', 'Downloads', 'Uploaded Date'] }
  ];

  const currentModule = modules.find(m => m.id === selectedModule);

  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
  };

  const updateFilter = (index: number, field: string, operator: string, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { field, operator, value };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Report Builder</h1>
          <p className="text-gray-500">Create custom reports</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-ghost flex items-center gap-2">
            <Save size={16} />
            Save
          </button>
          <button className="btn btn-ghost flex items-center gap-2">
            <Share size={16} />
            Share
          </button>
          <button className="btn btn-primary flex items-center gap-2">
            <Eye size={16} />
            Preview Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Saved Templates */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Saved Templates</span>
          </div>
          <div className="space-y-2">
            {savedTemplates.map(template => (
              <div key={template.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{template.module}</p>
                </div>
                <button className="text-gray-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module Selector */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Select Module</span>
            </div>
            <select
              className="form-control"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="">-- Choose a module --</option>
              {modules.map(module => (
                <option key={module.id} value={module.id}>{module.name}</option>
              ))}
            </select>
          </div>

          {currentModule && (
            <>
              {/* Fields Selector */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Select Fields</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {currentModule.fields.map(field => (
                    <label key={field} className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field)}
                        onChange={() => toggleField(field)}
                        className="rounded"
                      />
                      <span className="text-sm">{field}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Filter size={18} />
                    <span className="card-title">Filters</span>
                  </div>
                  <button onClick={addFilter} className="btn btn-ghost btn-sm flex items-center gap-2">
                    <Plus size={14} />
                    Add Filter
                  </button>
                </div>
                <div className="space-y-3">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <select
                        className="form-control flex-1"
                        value={filter.field}
                        onChange={(e) => updateFilter(index, e.target.value, filter.operator, filter.value)}
                      >
                        <option value="">-- Field --</option>
                        {currentModule.fields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                      <select
                        className="form-control w-32"
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, filter.field, e.target.value, filter.value)}
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="gt">Greater Than</option>
                        <option value="lt">Less Than</option>
                      </select>
                      <input
                        type="text"
                        className="form-control flex-1"
                        placeholder="Value"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, filter.field, filter.operator, e.target.value)}
                      />
                      <button onClick={() => removeFilter(index)} className="btn btn-ghost text-red-600 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportBuilder;