import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#fff',
          color: '#4D3427',
          border: '1px solid #E0CDBA',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
        },
      }}
    />
  </StrictMode>,
);
