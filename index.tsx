import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

window.addEventListener('error', (event) => {
  document.body.innerHTML = `<div style="padding: 20px; background: #fee2e2; color: #991b1b;"><h1>Global Error</h1><pre>${event.error?.stack || event.message}</pre></div>`;
});

window.addEventListener('unhandledrejection', (event) => {
  document.body.innerHTML = `<div style="padding: 20px; background: #fee2e2; color: #991b1b;"><h1>Unhandled Promise Rejection</h1><pre>${event.reason?.stack || event.reason}</pre></div>`;
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);