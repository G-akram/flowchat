import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/query-client';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element with id "root" not found in document');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        closeButton
        expand
        visibleToasts={4}
        toastOptions={{
          className: 'border border-gray-200 shadow-xl',
          style: {
            fontFamily: 'inherit',
            fontSize: '14px',
            padding: '14px 16px',
          },
          descriptionClassName: 'text-[13px]',
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
