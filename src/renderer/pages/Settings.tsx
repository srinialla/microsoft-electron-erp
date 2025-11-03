import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
  Field,
  Input,
  Radio,
  RadioGroup,
  Switch,
  Text,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { useSettingsStore } from '../stores/settings';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const [autoUpdate, setAutoUpdate] = React.useState(true);
  const [dbBackup, setDbBackup] = React.useState('');
  const [company, setCompany] = React.useState({ name: '', email: '', phone: '', address: '' });

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/settings' || path === '/settings/') return 'company-profile';
    if (path.includes('/company-profile')) return 'company-profile';
    if (path.includes('/branches')) return 'branches';
    if (path.includes('/tax-settings')) return 'tax-settings';
    if (path.includes('/currency')) return 'currency';
    if (path.includes('/users-roles')) return 'users-roles';
    if (path.includes('/units-of-measure')) return 'units-of-measure';
    return 'company-profile'; // default
  };

  const handleTabSelect = (tabId: string) => {
    navigate(`/settings/${tabId}`);
  };

  // Show cards only on default settings page or company-profile route
  // Hide cards on other nested routes like tax-settings, currency, etc.
  const shouldShowCards =
    location.pathname === '/settings' ||
    location.pathname === '/settings/' ||
    location.pathname === '/settings/company-profile';

  return (
    <div className="stack" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '16px' }}>Settings</h1>
        <TabList
          selectedValue={getActiveTab()}
          onTabSelect={(_, data) => handleTabSelect(data.value as string)}
        >
          <Tab value="company-profile">Company Profile</Tab>
          <Tab value="branches">Branches</Tab>
          <Tab value="tax-settings">Tax Settings</Tab>
          <Tab value="currency">Currency</Tab>
          <Tab value="users-roles">Users & Roles</Tab>
          <Tab value="units-of-measure">Units of Measure</Tab>
        </TabList>
      </div>

      {/* Nested settings pages render here */}
      <Outlet />

      {/* Only show these cards on the default settings page or company-profile route */}
      {shouldShowCards && (
        <>
          <Card>
            <CardHeader header={<Text weight="semibold">Appearance</Text>} />
            <CardPreview className="card-body">
              <RadioGroup
                layout="horizontal"
                value={theme}
                onChange={(_, d) => setTheme(d.value as 'light' | 'dark')}
              >
                <Radio value="light" label="Light" />
                <Radio value="dark" label="Dark" />
              </RadioGroup>
            </CardPreview>
          </Card>

          <Card>
            <CardHeader header={<Text weight="semibold">Updates</Text>} />
            <CardPreview className="card-body">
              <Switch
                label="Enable automatic updates"
                checked={autoUpdate}
                onChange={(_, d) => setAutoUpdate(d.checked)}
              />
              <div style={{ marginTop: 12 }}>
                <Button onClick={() => window.api?.updates?.check?.()}>Check for updates</Button>
              </div>
            </CardPreview>
          </Card>

          <Card>
            <CardHeader header={<Text weight="semibold">Database</Text>} />
            <CardPreview className="card-body">
              <Field label="Backup location">
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input
                    value={dbBackup}
                    onChange={(_, d) => setDbBackup(d.value)}
                    style={{ width: 420 }}
                  />
                  <Button
                    onClick={async () => {
                      const res = await window.api.fs({ type: 'selectDirectory' });
                      if (res.ok && res.path) setDbBackup(res.path);
                    }}
                  >
                    Browse...
                  </Button>
                </div>
              </Field>
            </CardPreview>
          </Card>

          <Card>
            <CardHeader header={<Text weight="semibold">Company Information</Text>} />
            <CardPreview className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Name">
                  <Input
                    value={company.name}
                    onChange={(_, d) => setCompany({ ...company, name: d.value })}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={company.email}
                    onChange={(_, d) => setCompany({ ...company, email: d.value })}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={company.phone}
                    onChange={(_, d) => setCompany({ ...company, phone: d.value })}
                  />
                </Field>
                <Field label="Address">
                  <Input
                    value={company.address}
                    onChange={(_, d) => setCompany({ ...company, address: d.value })}
                  />
                </Field>
              </div>
              <div style={{ marginTop: 12 }}>
                <Button appearance="primary">Save</Button>
              </div>
            </CardPreview>
          </Card>

          <VersionInfo />
        </>
      )}
    </div>
  );
};

const VersionInfo: React.FC = () => {
  const [ver, setVer] = React.useState('');
  React.useEffect(() => {
    window.api.app
      .getVersion()
      .then(setVer)
      .catch(() => setVer('unknown'));
  }, []);
  return <Text size={200}>Version: {ver}</Text>;
};
