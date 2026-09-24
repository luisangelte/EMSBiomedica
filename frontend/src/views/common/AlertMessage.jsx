import React from 'react';
import './common.css';

export function AlertMessage({ type = 'error', message }) {
  if (!message) return null;

  return <div className={`alert-message alert-${type}`}>{message}</div>;
}
