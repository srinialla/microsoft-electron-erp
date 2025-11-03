import React from 'react';
import { MessageBar } from '@fluentui/react-message-bar';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: String(error) };
  }

  componentDidCatch(error: any) {
    console.error('Renderer error', error);
  }

  render() {
    if (this.state.hasError) {
      return <MessageBar intent="error">Something went wrong: {this.state.message}</MessageBar>;
    }
    return this.props.children as any;
  }
}
