import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Members } from './pages/Members';

// 아직 구현되지 않은 페이지들을 위한 Placeholder
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-bold text-gray-300">{title}</h2>
    <p className="text-gray-400 mt-2">페이지 준비 중입니다.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="members" element={<Members />} />
          
          {/* 나머지 메뉴들은 일단 Placeholder로 연결 */}
          <Route path="work" element={<Placeholder title="근무" />} />
          <Route path="leaves" element={<Placeholder title="휴가" />} />
          <Route path="payroll" element={<Placeholder title="급여정산" />} />
          <Route path="documents" element={<Placeholder title="문서" />} />
          <Route path="insights" element={<Placeholder title="인사이트" />} />
          <Route path="recruit" element={<Placeholder title="채용" />} />
          <Route path="settings" element={<Placeholder title="설정" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
