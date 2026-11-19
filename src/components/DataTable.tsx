import React, { useState } from 'react';
import { format } from 'date-fns';
import { IndicatorDataPoint, EconomicIndicator } from '../types';
import { ChevronUp, ChevronDown, Edit2, Trash2, X, Save } from 'lucide-react';

interface DataTableProps {
  data: IndicatorDataPoint[];
  indicator: EconomicIndicator;
  onDelete?: (point: IndicatorDataPoint) => void;
  onEdit?: (point: IndicatorDataPoint) => void;
  isAdmin?: boolean;
}

type SortField = 'date' | 'value' | 'president';
type SortDirection = 'asc' | 'desc';

const EditModal: React.FC<{
  point: IndicatorDataPoint;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPoint: IndicatorDataPoint) => void;
}> = ({ point, isOpen, onClose, onSave }) => {
  const [editedPoint, setEditedPoint] = useState<IndicatorDataPoint>({ ...point });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(editedPoint);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/70 flex items-center justify-center z-50">
      <div className="bg-paper border-t-[3px] border-ink p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-extrabold text-2xl">Edit Data Point</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-accent">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block eyebrow">Date</label>
            <input
              type="date"
              value={editedPoint.date}
              onChange={(e) => setEditedPoint({ ...editedPoint, date: e.target.value })}
              className="mt-1 block w-full bg-paper border border-ink px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          
          <div>
            <label className="block eyebrow">Value</label>
            <input
              type="number"
              step="0.01"
              value={editedPoint.value}
              onChange={(e) => setEditedPoint({ ...editedPoint, value: parseFloat(e.target.value) })}
              className="mt-1 block w-full bg-paper border border-ink px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          
          <div>
            <label className="block eyebrow">President</label>
            <input
              type="text"
              value={editedPoint.president || ''}
              onChange={(e) => setEditedPoint({ ...editedPoint, president: e.target.value })}
              className="mt-1 block w-full bg-paper border border-ink px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-sm uppercase tracking-wider border border-ink hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 font-mono text-sm uppercase tracking-wider bg-ink text-paper hover:bg-accent flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const DataTable: React.FC<DataTableProps> = ({ data, indicator, onDelete, onEdit, isAdmin = false }) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPoint, setEditingPoint] = useState<IndicatorDataPoint | null>(null);
  const itemsPerPage = 20;
  const LOCAL_STORAGE_PREFIX = 'economic_indicator_';

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortField === 'value') {
      return sortDirection === 'asc' ? a.value - b.value : b.value - a.value;
    } else {
      return sortDirection === 'asc'
        ? (a.president || '').localeCompare(b.president || '')
        : (b.president || '').localeCompare(a.president || '');
    }
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sort
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Format value based on indicator type
  const formatValue = (value: number) => {
    switch (indicator.id) {
      case 'monthly-inflation':
      case 'unemployment-rate':
      case 'gdp-growth':
        return `${value.toFixed(2)}%`;
      case 'median-income':
      case 'gas-price':
      case 'sp500':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);
      default:
        return value.toLocaleString();
    }
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline-block ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline-block ml-1" />
    );
  };

  const lastApiUpdate = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}last_api_update_${indicator.id}`);
  const dataSource = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}data_source_${indicator.id}`);

  const handleEdit = (point: IndicatorDataPoint) => {
    setEditingPoint(point);
  };

  const handleSaveEdit = (updatedPoint: IndicatorDataPoint) => {
    if (onEdit) {
      onEdit(updatedPoint);
    }
    setEditingPoint(null);
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 font-mono text-sm text-ink-soft">
        <p>Data Source: {dataSource || 'Uploaded Data'}</p>
        {lastApiUpdate && <p>Last API Update: {new Date(parseInt(lastApiUpdate)).toLocaleDateString()}</p>}
      </div>
      <table className="min-w-full">
        <thead className="border-b-2 border-ink">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left eyebrow cursor-pointer hover:text-accent"
              onClick={() => handleSort('date')}
            >
              <span className="flex items-center">
                Date {renderSortIcon('date')}
              </span>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left eyebrow cursor-pointer hover:text-accent"
              onClick={() => handleSort('value')}
            >
              <span className="flex items-center">
                Value {renderSortIcon('value')}
              </span>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left eyebrow cursor-pointer hover:text-accent"
              onClick={() => handleSort('president')}
            >
              <span className="flex items-center">
                President {renderSortIcon('president')}
              </span>
            </th>
            {isAdmin && (
              <th scope="col" className="px-4 py-3 text-right eyebrow">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {paginatedData.map((point, index) => (
            <tr key={point.date} className={index % 2 === 0 ? '' : 'bg-white/[0.04]'}>
              <td className="px-4 py-3 whitespace-nowrap">
                {format(new Date(point.date), 'MMM d, yyyy')}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatValue(point.value)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {point.president || 'N/A'}
              </td>
              {isAdmin && (
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEdit(point)}
                    className="text-ink hover:text-accent mr-3"
                  >
                    <Edit2 className="h-4 w-4 inline" />
                  </button>
                  <button
                    onClick={() => onDelete?.(point)}
                    className="text-accent hover:text-ink"
                  >
                    <Trash2 className="h-4 w-4 inline" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editingPoint && (
        <EditModal
          point={editingPoint}
          isOpen={true}
          onClose={() => setEditingPoint(null)}
          onSave={handleSaveEdit}
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="relative z-0 inline-flex -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 border border-ink font-mono text-sm uppercase tracking-wider hover:bg-white/5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-ink bg-ink text-paper font-mono text-sm uppercase tracking-wider">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 border border-ink font-mono text-sm uppercase tracking-wider hover:bg-white/5 disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default DataTable;