import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './app/store';
import { setupAxiosInterceptors } from './app/axios';
import './index.css';

// Configurer les intercepteurs Axios avec le store
setupAxiosInterceptors(store);

// Vérifier que le nœud root existe
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element with id "root" not found in HTML');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 16px',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            maxWidth: '380px',
            lineHeight: '1.5',
          },
          success: {
            duration: 3000,
            style: {
              borderLeft: '4px solid #10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            duration: 5000,
            style: {
              borderLeft: '4px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </Provider>
  </React.StrictMode>
);

