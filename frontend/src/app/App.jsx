import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginScreen } from '../features/auth/LoginScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/admin" element={<div style={{ color: 'white', padding: '2rem' }}>Panel Admin</div>} />
        <Route path="/enfermero" element={<div style={{ color: 'white', padding: '2rem' }}>Panel Enfermero</div>} />
        <Route path="/tecnico" element={<div style={{ color: 'white', padding: '2rem' }}>Panel Técnico</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;