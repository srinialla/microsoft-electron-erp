import React, { useState, useEffect } from 'react';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import { ConfirmDialog, Modal } from '../../../shared/components';
import { FormInput, FormSelect } from '../../../shared/components';
import SettingsService from '../services/SettingsService';
import type { UnitOfMeasure } from '../../../shared/types/entities';
import { useToastController, useId } from '@fluentui/react-components';

export default function SettingsUnitsOfMeasurePage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; unit: UnitOfMeasure | null }>(
    {
      open: false,
      unit: null,
    },
  );
  const [formData, setFormData] = useState({
    unit_name: '',
    unit_symbol: '',
    unit_type: 'count' as 'weight' | 'volume' | 'length' | 'count',
    conversion_factor: 1,
  });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getUnitsOfMeasure();
      setUnits(data);
    } catch (error) {
      dispatchToast(<div>Failed to load units of measure: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (unit?: UnitOfMeasure) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        unit_name: unit.unit_name,
        unit_symbol: unit.unit_symbol,
        unit_type: unit.unit_type,
        conversion_factor: unit.conversion_factor || 1,
      });
    } else {
      setEditingUnit(null);
      setFormData({
        unit_name: '',
        unit_symbol: '',
        unit_type: 'count',
        conversion_factor: 1,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingUnit) {
        await SettingsService.updateUnitOfMeasure(editingUnit.id, formData);
        dispatchToast(<div>Unit of measure updated successfully</div>, { intent: 'success' });
      } else {
        await SettingsService.createUnitOfMeasure(formData);
        dispatchToast(<div>Unit of measure created successfully</div>, { intent: 'success' });
      }
      setModalOpen(false);
      loadUnits();
    } catch (error) {
      dispatchToast(<div>Failed to save unit of measure: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleDelete = async (unit: UnitOfMeasure) => {
    try {
      await SettingsService.deleteUnitOfMeasure(unit.id);
      dispatchToast(<div>Unit of measure deleted successfully</div>, { intent: 'success' });
      loadUnits();
    } catch (error) {
      dispatchToast(<div>Failed to delete unit of measure: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const columns = [
    {
      key: 'unit_name',
      header: 'Unit Name',
      sortable: true,
    },
    {
      key: 'unit_symbol',
      header: 'Symbol',
      sortable: true,
    },
    {
      key: 'unit_type',
      header: 'Type',
      sortable: true,
      render: (value: string) => <span style={{ textTransform: 'capitalize' }}>{value}</span>,
    },
    {
      key: 'conversion_factor',
      header: 'Conversion Factor',
      sortable: true,
      align: 'right' as const,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1>Units of Measure</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          Add Unit
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={units}
        loading={loading}
        onEdit={(row) => handleOpenModal(row)}
        onDelete={(row) => setDeleteConfirm({ open: true, unit: row })}
        searchable
        exportable
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUnit ? 'Edit Unit of Measure' : 'New Unit of Measure'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingUnit ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <FormInput
            label="Unit Name"
            name="unit_name"
            value={formData.unit_name}
            onChange={(value) => setFormData({ ...formData, unit_name: value })}
            required
            placeholder="e.g., Kilogram"
          />
          <FormInput
            label="Unit Symbol"
            name="unit_symbol"
            value={formData.unit_symbol}
            onChange={(value) => setFormData({ ...formData, unit_symbol: value })}
            required
            placeholder="e.g., kg"
          />
          <FormSelect
            label="Unit Type"
            name="unit_type"
            value={formData.unit_type}
            onChange={(value) => setFormData({ ...formData, unit_type: value as any })}
            options={[
              { value: 'weight', label: 'Weight' },
              { value: 'volume', label: 'Volume' },
              { value: 'length', label: 'Length' },
              { value: 'count', label: 'Count' },
            ]}
            required
          />
          <FormInput
            label="Conversion Factor"
            name="conversion_factor"
            type="number"
            value={formData.conversion_factor.toString()}
            onChange={(value) =>
              setFormData({ ...formData, conversion_factor: parseFloat(value) || 1 })
            }
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, unit: null })}
        onConfirm={() => {
          if (deleteConfirm.unit) {
            handleDelete(deleteConfirm.unit);
            setDeleteConfirm({ open: false, unit: null });
          }
        }}
        title="Delete Unit of Measure"
        message={`Are you sure you want to delete ${deleteConfirm.unit?.unit_name}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
