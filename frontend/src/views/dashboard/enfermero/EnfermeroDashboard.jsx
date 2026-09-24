import React from 'react';
import { Navbar } from '../../common/Navbar';

export function EnfermeroDashboard() {
  return (
    <div>
      <Navbar title="SIMEB" />
      <main style={{ padding: '2rem', color: '#fff' }}>
        <h1>Dashboard de Enfermería</h1>
        <p>Vista base del módulo Enfermero.</p>
      </main>
    </div>
  );
}
