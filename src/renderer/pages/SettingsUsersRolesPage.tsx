import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { FormInput, FormSelect, DataGrid } from '../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../shared/components';

interface User {
  id?: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  is_active: boolean;
  created_at?: string;
}

export default function SettingsUsersRolesPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([
    // Sample data - in real app, this would come from API/database
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [formData, setFormData] = useState<User>({
    username: '',
    email: '',
    role: 'user',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (editingId) {
        setUsers(users.map((u) => (u.id === editingId ? { ...formData, id: editingId } : u)));
        dispatchToast(<div>User updated successfully</div>, { intent: 'success' });
      } else {
        const newUser = {
          ...formData,
          id: users.length + 1,
          created_at: new Date().toISOString(),
        };
        setUsers([...users, newUser]);
        dispatchToast(<div>User created successfully</div>, { intent: 'success' });
      }
      handleCancel();
    } catch (error) {
      dispatchToast(<div>Failed to save user: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleEdit = (user: User) => {
    setFormData(user);
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setUsers(users.filter((u) => u.id !== id));
    dispatchToast(<div>User deleted successfully</div>, { intent: 'success' });
  };

  const handleCancel = () => {
    setFormData({
      username: '',
      email: '',
      role: 'user',
      is_active: true,
    });
    setEditingId(undefined);
    setShowForm(false);
    setErrors({});
  };

  const updateField = <K extends keyof User>(field: K, value: User[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const columns = [
    {
      key: 'username',
      header: 'Username',
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span style={{ color: value ? '#107c10' : '#d13438' }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: User) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" variant="outline" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button
            size="small"
            variant="outline"
            onClick={() => handleDelete(row.id!)}
            style={{ color: '#d13438' }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1>Users & Roles</h1>
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Add User
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#f5f5f5',
              padding: '24px',
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <FormInput
              label="Username"
              name="username"
              value={formData.username}
              onChange={(value) => updateField('username', value)}
              required
              error={errors.username}
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(value) => updateField('email', value)}
              required
              error={errors.email}
            />
            <FormSelect
              label="Role"
              name="role"
              value={formData.role}
              onChange={(value) => updateField('role', value as User['role'])}
              options={[
                { value: 'admin', label: 'Admin - Full Access' },
                { value: 'manager', label: 'Manager - Manage Operations' },
                { value: 'user', label: 'User - Standard Access' },
                { value: 'viewer', label: 'Viewer - Read Only' },
              ]}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                />
                Active User
              </label>
            </div>
          </div>
          <div
            style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingId ? 'Update' : 'Create'} User
            </Button>
          </div>
        </form>
      )}

      <DataGrid columns={columns} data={users} searchable />

      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          background: '#e7f3ff',
          borderRadius: '4px',
          border: '1px solid #0078d4',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Role Permissions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <strong>Admin:</strong> Full access to all features and settings
          </div>
          <div>
            <strong>Manager:</strong> Can manage operations, reports, and inventory
          </div>
          <div>
            <strong>User:</strong> Can create and edit transactions, view reports
          </div>
          <div>
            <strong>Viewer:</strong> Read-only access to view data and reports
          </div>
        </div>
      </div>
    </div>
  );
}
