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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Edit Data Point</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={editedPoint.date}
              onChange={(e) => setEditedPoint({ ...editedPoint, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Value</label>
            <input
              type="number"
              step="0.01"
              value={editedPoint.value}
              onChange={(e) => setEditedPoint({ ...editedPoint, value: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">President</label>
            <input
              type="text"
              value={editedPoint.president || ''}
              onChange={(e) => setEditedPoint({ ...editedPoint, president: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
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
      <div className="mb-4 text-sm text-gray-600">
        <p>Data Source: {dataSource || 'Uploaded Data'}</p>
        {lastApiUpdate && <p>Last API Update: {new Date(parseInt(lastApiUpdate)).toLocaleDateString()}</p>}
      </div>
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('date')}
            >
              <span className="flex items-center">
                Date {renderSortIcon('date')}
              </span>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('value')}
            >
              <span className="flex items-center">
                Value {renderSortIcon('value')}
              </span>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('president')}
            >
              <span className="flex items-center">
                President {renderSortIcon('president')}
              </span>
            </th>
            {isAdmin && (
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.map((point, index) => (
            <tr key={point.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(point.date), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatValue(point.value)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {point.president || 'N/A'}
              </td>
              {isAdmin && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(point)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4 inline" />
                  </button>
                  <button
                    onClick={() => onDelete?.(point)}
                    className="text-red-600 hover:text-red-900"
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
        <div className="flex justify-center mt-4">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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