import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Standard resolution

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log("Mounting React App...");

try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React App Mounted Successfully");
} catch (e) {
    console.error("React Mount Failed:", e);
    document.body.innerHTML += `<div style="color:red; padding:20px;">CRITICAL ERROR: ${e instanceof Error ? e.message : String(e)}</div>`;
}