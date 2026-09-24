import React from 'react';
import './common.css';

export function LoadingSpinner({ label = 'Cargando...' }) {
  return (
    <div className="loading-shell" role="status" aria-live="polite">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}
