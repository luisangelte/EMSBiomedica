import React from 'react';
import './Navbar.css';

export function Navbar({ title = 'SIMEB', actions = null }) {
  return (
    <header className="navbar-shell">
      <div className="navbar-brand">{title}</div>
      <div className="navbar-actions">{actions}</div>
    </header>
  );
}
