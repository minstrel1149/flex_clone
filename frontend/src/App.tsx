import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Members } from './pages/Members';
import { Work } from './pages/Work';
import { Leaves } from './pages/Leaves';
import { Payroll } from './pages/Payroll';
import { Documents } from './pages/Documents';
import { Insight } from './pages/Insight';
import { Recruitment } from './pages/Recruitment';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="members" element={<Members />} />
          <Route path="work" element={<Work />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="documents" element={<Documents />} />
          <Route path="insights" element={<Insight />} />
          
          {/* 나머지 메뉴들은 실제 컴포넌트로 연결 */}
          <Route path="recruit" element={<Recruitment />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
