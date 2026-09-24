import React from 'react';
import { Navbar } from '../../common/Navbar';

export function AdminDashboard() {
  return (
    <div>
      <Navbar title="SIMEB" />
      <main style={{ padding: '2rem', color: '#fff' }}>
        <h1>Dashboard de Administración</h1>
        <p>Vista base del módulo Admin.</p>
      </main>
    </div>
  );
}
