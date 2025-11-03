import React from 'react';
import { Button, Text } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 12 }}>
      <Text size={600} weight="semibold">404 - Not Found</Text>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
};
