import { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Search, Filter, MoreVertical, Download } from 'lucide-react';
import { MemberModal } from '../components/MemberModal';

interface Employee {
  EMP_ID: string;
  NAME: string;
  EMAIL: string;
  DEPT_NAME?: string;
  POSITION_NAME?: string;
  PHONE_NUM?: string;
  CURRENT_EMP_YN?: string;
}

export function Members() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 모달 상태
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/employees?limit=200')
      .then(res => {
        setEmployees(res.data);
        setFilteredEmployees(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // 검색 기능 (이름, 사번, 부서 검색)
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = employees.filter(emp => 
        emp.NAME.toLowerCase().includes(term) || 
        emp.EMP_ID.toLowerCase().includes(term) ||
        (emp.DEPT_NAME && emp.DEPT_NAME.toLowerCase().includes(term))
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const handleRowClick = (emp: Employee) => {
    setSelectedMember(emp);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">구성원</h1>
            <p className="text-gray-500 text-sm mt-1">총 {filteredEmployees.length}명의 구성원이 있습니다.</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm transition-all">
                <Download size={18} />
                <span>엑셀 다운로드</span>
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                구성원 추가
            </button>
        </div>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="이름, 사번, 부서 검색" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Filter size={18} />
          <span>필터</span>
        </button>
      </div>

      {/* 구성원 리스트 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="w-12 px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">구성원</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">부서 / 직위</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">이메일</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">상태</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">데이터 로딩 중...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">검색 결과가 없습니다.</td></tr>
                ) : filteredEmployees.map((emp) => (
                <tr 
                    key={emp.EMP_ID} 
                    onClick={() => handleRowClick(emp)}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-white rounded-xl flex items-center justify-center text-indigo-600 mr-3 border border-indigo-50 group-hover:scale-110 transition-transform shadow-sm">
                            {emp.NAME[0]}
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 block">{emp.NAME}</span>
                            <span className="text-xs text-gray-400">{emp.EMP_ID}</span>
                        </div>
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 font-medium block">{emp.DEPT_NAME || '-'}</span>
                        <span className="text-xs text-gray-400">{emp.POSITION_NAME || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.EMAIL}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            emp.CURRENT_EMP_YN === 'Y' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                            {emp.CURRENT_EMP_YN === 'Y' ? '재직' : '퇴사'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button className="text-gray-300 hover:text-gray-600 p-1">
                            <MoreVertical size={18} />
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* 상세 모달 */}
      <MemberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        member={selectedMember} 
      />
    </div>
  );
}