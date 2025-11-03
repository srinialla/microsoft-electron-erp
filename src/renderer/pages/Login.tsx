import React from 'react';
import {
  Button,
  Field,
  Input,
  Checkbox,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Spinner,
} from '@fluentui/react-components';
import { MessageBar } from '@fluentui/react-message-bar';
import { loginSchema } from '@shared/utils/validation';
import { useAuthStore } from '../stores/auth';
import { useLocation, useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/';
  const [form, setForm] = React.useState({ username: '', password: '', remember: true });
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginSchema.safeParse(form);
    if (!res.success) {
      setError(res.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setSubmitting(true);
    Promise.resolve(login(res.data.username, res.data.remember))
      .then(() => navigate(from, { replace: true }))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <div className="login-hero-inner">
          <Text size={900} weight="semibold">
            Welcome to Fluent ERP
          </Text>
          <div style={{ height: 12 }} />
          <Text size={400}>
            Manage inventory, sales, purchases, customers, and reports in one place.
          </Text>
        </div>
      </div>
      <div className="login-card">
        <Card style={{ width: 460 }}>
          <CardHeader header={<Text weight="semibold">Sign in to your account</Text>} />
          <CardPreview className="card-body">
            <form onSubmit={onSubmit}>
              <div className="stack">
                {error && <MessageBar intent="error">{error}</MessageBar>}
                <Field label="Username">
                  <Input
                    value={form.username}
                    onChange={(_, d) => setForm({ ...form, username: d.value })}
                    size="large"
                    required
                  />
                </Field>
                <Field label="Password">
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(_, d) => setForm({ ...form, password: d.value })}
                    size="large"
                    required
                  />
                </Field>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Checkbox
                    checked={form.remember}
                    label="Remember me"
                    onChange={(_, d) => setForm({ ...form, remember: d.checked })}
                  />
                  <Button appearance="transparent">Forgot password?</Button>
                </div>
                <Button appearance="primary" type="submit" size="large" disabled={submitting}>
                  {submitting ? <Spinner size="tiny" /> : 'Sign in'}
                </Button>
              </div>
            </form>
          </CardPreview>
        </Card>
      </div>
    </div>
  );
};
