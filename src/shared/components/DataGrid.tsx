import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Checkbox } from '@fluentui/react-components';
import { Search24Regular, ArrowUp24Regular, ArrowDown24Regular } from '@fluentui/react-icons';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { Button } from '../../renderer/components/ui/Button';
import './DataGrid.css';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  onBulkDelete?: (rows: T[]) => void;
  searchable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
  rowKey?: (row: T) => string | number;
}

export function DataGrid<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  onBulkDelete,
  searchable = true,
  exportable = false,
  selectable = false,
  rowKey = (row: T) => (row as any).id,
}: DataGridProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key as keyof T];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Sort
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn as keyof T];
        const bVal = b[sortColumn as keyof T];
        const compare = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortDirection === 'asc' ? compare : -compare;
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection, columns]);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredData.map((row) => rowKey(row))));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const key = rowKey(row);
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }
    setSelectedRows(newSelected);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedRows.size > 0) {
      const rowsToDelete = filteredData.filter((row) =>
        selectedRows.has(rowKey(row))
      );
      onBulkDelete(rowsToDelete);
      setSelectedRows(new Set());
    }
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = columns.map((col) => col.header).join(',');
    const rows = filteredData.map((row) =>
      columns.map((col) => {
        const value = row[col.key as keyof T];
        return `"${value?.toString().replace(/"/g, '""') || ''}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div className="data-grid">
      {/* Toolbar */}
      <div className="data-grid-toolbar">
        {searchable && (
          <div className="data-grid-search">
            <Search24Regular />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="data-grid-search-input"
            />
          </div>
        )}
        <div className="data-grid-actions">
          {selectable && selectedRows.size > 0 && (
            <Button variant="outline" onClick={handleBulkDelete}>
              Delete Selected ({selectedRows.size})
            </Button>
          )}
          {exportable && (
            <Button variant="outline" onClick={handleExport}>
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredData.length === 0 ? (
        <EmptyState
          title="No data found"
          description={searchQuery ? 'Try adjusting your search query' : 'No records to display'}
        />
      ) : (
        <div className="data-grid-table-wrapper">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHeaderCell>
                    <Checkbox
                      checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                      onChange={(_, data) => handleSelectAll(data.checked === true)}
                    />
                  </TableHeaderCell>
                )}
                {columns.map((column) => (
                  <TableHeaderCell
                    key={String(column.key)}
                    style={{ width: column.width, textAlign: column.align }}
                    className={column.sortable ? 'sortable' : ''}
                    onClick={() => handleSort(column)}
                  >
                    <div className="table-header-content">
                      {column.header}
                      {column.sortable && sortColumn === column.key && (
                        <span className="sort-icon">
                          {sortDirection === 'asc' ? <ArrowUp24Regular /> : <ArrowDown24Regular />}
                        </span>
                      )}
                    </div>
                  </TableHeaderCell>
                ))}
                {(onView || onEdit || onDelete) && <TableHeaderCell>Actions</TableHeaderCell>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'clickable-row' : ''}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(rowKey(row))}
                        onChange={(_, data) => {
                          handleSelectRow(row, data.checked === true);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      style={{ textAlign: column.align }}
                    >
                      {column.render
                        ? column.render(row[column.key as keyof T], row)
                        : String(row[column.key as keyof T] ?? '')}
                    </TableCell>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="data-grid-actions-cell">
                        {onView && (
                          <Button variant="subtle" size="small" onClick={() => onView(row)}>
                            View
                          </Button>
                        )}
                        {onEdit && (
                          <Button variant="subtle" size="small" onClick={() => onEdit(row)}>
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="subtle" size="small" onClick={() => onDelete(row)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

