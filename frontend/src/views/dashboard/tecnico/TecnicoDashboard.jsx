import React from 'react';
import { Navbar } from '../../common/Navbar';

export function TecnicoDashboard() {
  return (
    <div>
      <Navbar title="SIMEB" />
      <main style={{ padding: '2rem', color: '#fff' }}>
        <h1>Dashboard de Técnico</h1>
        <p>Vista base del módulo Técnico.</p>
      </main>
    </div>
  );
}
