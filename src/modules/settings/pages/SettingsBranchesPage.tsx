import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import { ConfirmDialog } from '../../../shared/components';
import SettingsService from '../services/SettingsService';
import type { Branch } from '../../../shared/types/entities';
import { StatusBadge } from '../../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';
import { Modal } from '../../../shared/components';
import { FormInput, FormCheckbox, FormSelect } from '../../../shared/components';

export default function SettingsBranchesPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; branch: Branch | null }>({
    open: false,
    branch: null,
  });
  const [formData, setFormData] = useState({
    branch_code: '',
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    is_main_branch: false,
    allow_negative_stock: false,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getBranches();
      setBranches(data);
    } catch (error) {
      dispatchToast(<div>Failed to load branches: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        branch_code: branch.branch_code,
        name: branch.name,
        contact_person: branch.contact_person || '',
        email: branch.email || '',
        phone: branch.phone || '',
        address_line1: branch.address_line1 || '',
        address_line2: branch.address_line2 || '',
        city: branch.city || '',
        state: branch.state || '',
        country: branch.country || '',
        postal_code: branch.postal_code || '',
        is_main_branch: branch.is_main_branch,
        allow_negative_stock: branch.allow_negative_stock,
        status: branch.status,
      });
    } else {
      setEditingBranch(null);
      setFormData({
        branch_code: '',
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        is_main_branch: false,
        allow_negative_stock: false,
        status: 'active',
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingBranch) {
        await SettingsService.updateBranch(editingBranch.id, formData);
        dispatchToast(<div>Branch updated successfully</div>, { intent: 'success' });
      } else {
        await SettingsService.createBranch({
          ...formData,
          company_id: 1, // Would get from company settings
        } as any);
        dispatchToast(<div>Branch created successfully</div>, { intent: 'success' });
      }
      setModalOpen(false);
      loadBranches();
    } catch (error) {
      dispatchToast(<div>Failed to save branch: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleDelete = async (branch: Branch) => {
    try {
      await SettingsService.deleteBranch(branch.id);
      dispatchToast(<div>Branch deleted successfully</div>, { intent: 'success' });
      loadBranches();
    } catch (error) {
      dispatchToast(<div>Failed to delete branch: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const columns = [
    {
      key: 'branch_code',
      header: 'Code',
      sortable: true,
      width: '120px',
    },
    {
      key: 'name',
      header: 'Branch Name',
      sortable: true,
    },
    {
      key: 'city',
      header: 'City',
      sortable: true,
    },
    {
      key: 'is_main_branch',
      header: 'Main Branch',
      sortable: true,
      render: (value: boolean) => (value ? 'Yes' : 'No'),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value as any} />,
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
        <h1>Branches</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          Add Branch
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={branches}
        loading={loading}
        onEdit={(row) => handleOpenModal(row)}
        onDelete={(row) => setDeleteConfirm({ open: true, branch: row })}
        searchable
        exportable
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBranch ? 'Edit Branch' : 'New Branch'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingBranch ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormInput
            label="Branch Code"
            name="branch_code"
            value={formData.branch_code}
            onChange={(value) => setFormData({ ...formData, branch_code: value })}
            required
          />
          <FormInput
            label="Branch Name"
            name="name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            required
          />
          <FormInput
            label="Contact Person"
            name="contact_person"
            value={formData.contact_person}
            onChange={(value) => setFormData({ ...formData, contact_person: value })}
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
          />
          <FormInput
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(value) => setFormData({ ...formData, phone: value })}
          />
          <FormInput
            label="Address Line 1"
            name="address_line1"
            value={formData.address_line1}
            onChange={(value) => setFormData({ ...formData, address_line1: value })}
          />
          <FormInput
            label="City"
            name="city"
            value={formData.city}
            onChange={(value) => setFormData({ ...formData, city: value })}
          />
          <FormInput
            label="State"
            name="state"
            value={formData.state}
            onChange={(value) => setFormData({ ...formData, state: value })}
          />
          <FormInput
            label="Country"
            name="country"
            value={formData.country}
            onChange={(value) => setFormData({ ...formData, country: value })}
          />
          <FormInput
            label="Postal Code"
            name="postal_code"
            value={formData.postal_code}
            onChange={(value) => setFormData({ ...formData, postal_code: value })}
          />
          <FormCheckbox
            label="Main Branch"
            name="is_main_branch"
            checked={formData.is_main_branch}
            onChange={(checked) => setFormData({ ...formData, is_main_branch: checked })}
          />
          <FormCheckbox
            label="Allow Negative Stock"
            name="allow_negative_stock"
            checked={formData.allow_negative_stock}
            onChange={(checked) => setFormData({ ...formData, allow_negative_stock: checked })}
          />
          <FormSelect
            label="Status"
            name="status"
            value={formData.status}
            onChange={(value) =>
              setFormData({ ...formData, status: value as 'active' | 'inactive' })
            }
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, branch: null })}
        onConfirm={() => {
          if (deleteConfirm.branch) {
            handleDelete(deleteConfirm.branch);
            setDeleteConfirm({ open: false, branch: null });
          }
        }}
        title="Delete Branch"
        message={`Are you sure you want to delete ${deleteConfirm.branch?.name}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
