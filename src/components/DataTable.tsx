import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IndicatorDataPoint, EconomicIndicator } from '../types';
import { ChevronUp, ChevronDown } from 'lucide-react';

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
  //Implementation for EditModal would go here.  This is a placeholder.
  if (!isOpen) return null;
  return (
    <div>
      {/* Modal content to edit point.date, point.value, point.president */}
      <button onClick={onClose}>Close</button>
      <button onClick={() => onSave(point)}>Save</button>
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
        ? a.president.localeCompare(b.president)
        : b.president.localeCompare(a.president);
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

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;

    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline-block ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline-block ml-1" />
    );
  };

  // Format value based on indicator type
  const formatValue = (value: number) => {
    if (indicator.id === 'job-creation') {
      // For job creation, show whole numbers with commas
      return value.toLocaleString();
    } else if (indicator.id === 'monthly-inflation') {
      // For monthly inflation, show the percentage change
      const point = data.find(p => p.value === value);
      if (!point?.percentageChange && point?.percentageChange !== 0) return "N/A";
      return point.percentageChange.toFixed(1);
    } else {
      // For other indicators, use the default formatting with decimals
      return value.toLocaleString();
    }
  };

  const lastApiUpdate = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}last_api_update_${indicator.id}`);
  const dataSource = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}data_source_${indicator.id}`);

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
                Monthly Change (%) {renderSortIcon('value')}
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
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(parseISO(point.date), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {point.percentageChange !== undefined ? point.percentageChange.toFixed(1) + '%' : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {point.president}
              </td>
              {isAdmin && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingPoint(point)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete?.(point)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;