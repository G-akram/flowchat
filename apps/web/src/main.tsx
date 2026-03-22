import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/query-client';
import { App } from './App';
import { ErrorBoundary } from './components/error-boundary';
import { ColorCustomizer } from './components/color-customizer';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element with id "root" not found in document');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">FlowChat encountered an error</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page to try again.
            </p>
            <button
              type="button"
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </div>
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.DEV && <ColorCustomizer />}
        <Toaster
          position="bottom-right"
          closeButton
          expand
          visibleToasts={4}
          toastOptions={{
            className: 'border border-border shadow-xl',
            style: {
              fontFamily: 'inherit',
              fontSize: '14px',
              padding: '14px 16px',
            },
            descriptionClassName: 'text-[13px]',
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
