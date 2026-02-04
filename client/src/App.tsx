import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Survey } from '@/pages/Survey';
import { Edit } from '@/pages/Edit';
import { Admin } from '@/pages/Admin';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/survey/:code" element={<Survey />} />
        <Route path="/edit/:token" element={<Edit />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
