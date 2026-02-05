import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Plus, Download, Users, PieChart } from 'lucide-react';

// --- Types ---
interface LeaveType {
  LEAVE_TYPE_ID: string;
  LEAVE_TYPE_NAME: string;
}
interface LeaveHistory {
  DATE: string;
  LEAVE_TYPE_NAME: string;
  LEAVE_LENGTH: number;
}
interface MyLeaveData {
  summary: {
    total_given: number;
    total_used: number;
    remaining: number;
  };
  history: LeaveHistory[];
}
interface EmpLeaveStatus {
  EMP_ID: string;
  NAME: string;
  DEP_NAME: string;
  TOTAL_DAYS: number;
  USED_DAYS: number;
  REMAINING_DAYS: number;
}

const EMP_ID = 'E00002'; // Demo User

// --- Components ---

const MyLeaves = () => {
  const [data, setData] = useState<MyLeaveData | null>(null);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ date: '', type: 'LT001', length: '1.0' });

  const fetchData = () => {
    axios.get(`http://127.0.0.1:8000/api/leaves/my/${EMP_ID}`).then(res => setData(res.data));
  };

  useEffect(() => {
    fetchData();
    axios.get('http://127.0.0.1:8000/api/leaves/types').then(res => setTypes(res.data));
  }, []);

  const handleApply = async () => {
    if (!applyForm.date) return alert('날짜를 선택해주세요.');
    try {
      await axios.post('http://127.0.0.1:8000/api/leaves/apply', {
        emp_id: EMP_ID,
        date: applyForm.date,
        leave_type_id: applyForm.type,
        leave_length: applyForm.length
      });
      alert('휴가가 신청되었습니다.');
      setIsModalOpen(false);
      fetchData();
    } catch (e) { alert('신청 실패'); }
  };

  if (!data) return <div className="p-12 text-center text-gray-400">로딩 중...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <PieChart size={100} />
            </div>
            <p className="text-sm text-gray-500 font-medium">잔여 연차</p>
            <p className="text-4xl font-bold text-indigo-600 mt-2">{data.summary.remaining}<span className="text-lg text-gray-400 font-normal ml-1">일</span></p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">총 부여</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data.summary.total_given}일</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">사용함</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data.summary.total_used}일</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
            <Plus size={20} />
            휴가 신청하기
        </button>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">휴가 사용 내역</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                        <th className="px-6 py-4">날짜</th>
                        <th className="px-6 py-4">종류</th>
                        <th className="px-6 py-4">사용 일수</th>
                        <th className="px-6 py-4 text-center">상태</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.history.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">사용 기록이 없습니다.</td></tr>
                    ) : data.history.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{item.DATE}</td>
                            <td className="px-6 py-4 text-gray-600">{item.LEAVE_TYPE_NAME}</td>
                            <td className="px-6 py-4 text-gray-900 font-bold">{item.LEAVE_LENGTH}일</td>
                            <td className="px-6 py-4 text-center">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">승인됨</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Apply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-xl font-bold mb-6">휴가 신청</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                        <input type="date" className="w-full p-3 border border-gray-200 rounded-lg" 
                            value={applyForm.date} onChange={e => setApplyForm({...applyForm, date: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">종류</label>
                        <select className="w-full p-3 border border-gray-200 rounded-lg"
                            value={applyForm.type} onChange={e => setApplyForm({...applyForm, type: e.target.value})}>
                            {types.map(t => <option key={t.LEAVE_TYPE_ID} value={t.LEAVE_TYPE_ID}>{t.LEAVE_TYPE_NAME}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">사용 기간</label>
                        <select className="w-full p-3 border border-gray-200 rounded-lg"
                            value={applyForm.length} onChange={e => setApplyForm({...applyForm, length: e.target.value})}>
                            <option value="1.0">1일 (종일)</option>
                            <option value="0.5">0.5일 (반차)</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl">취소</button>
                    <button onClick={handleApply} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">신청하기</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const LeaveManagement = () => {
    const [employees, setEmployees] = useState<EmpLeaveStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(2025);

    useEffect(() => {
        setLoading(true);
        axios.get(`http://127.0.0.1:8000/api/leaves/admin/status?year=${year}`)
            .then(res => { setEmployees(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [year]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <select 
                        value={year} 
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="appearance-none pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm cursor-pointer"
                    >
                        <option value={2025}>2025년</option>
                        <option value={2024}>2024년</option>
                        <option value={2023}>2023년</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
                    <Download size={18} />
                    <span>현황 다운로드</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">{year}년 전사 연차 사용 현황</h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">총 {employees.length}명</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                                <th className="px-6 py-4">구성원</th>
                                <th className="px-6 py-4">소속</th>
                                <th className="px-6 py-4 text-right">총 부여</th>
                                <th className="px-6 py-4 text-right">사용</th>
                                <th className="px-6 py-4 text-right">잔여</th>
                                <th className="px-6 py-4 text-center">사용률</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>) : 
                             employees.map((emp) => {
                                 const usageRate = (emp.USED_DAYS / emp.TOTAL_DAYS) * 100;
                                 return (
                                    <tr key={emp.EMP_ID} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">{emp.NAME[0]}</div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{emp.NAME}</div>
                                                    <div className="text-xs text-gray-400">{emp.EMP_ID}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{emp.DEP_NAME}</td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-900">{emp.TOTAL_DAYS}</td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-600">{emp.USED_DAYS}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-indigo-600">{emp.REMAINING_DAYS}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(usageRate, 100)}%` }}></div>
                                                </div>
                                                <span className="text-xs text-gray-500 w-8 text-right">{Math.round(usageRate)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                 );
                             })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export function Leaves() {
  const [activeTab, setActiveTab] = useState<'my' | 'manage'>('my');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">휴가</h1>
          <p className="text-gray-500 text-sm mt-1">휴가를 신청하고 관리하세요.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
            <button 
                onClick={() => setActiveTab('my')}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'my' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                내 휴가
                {activeTab === 'my' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('manage')}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'manage' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <div className="flex items-center gap-2">
                    <Users size={16} />
                    휴가 관리
                </div>
                {activeTab === 'manage' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
            </button>
        </div>
      </div>

      {activeTab === 'my' ? <MyLeaves /> : <LeaveManagement />}
    </div>
  );
}
