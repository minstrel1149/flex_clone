import { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  Download,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { PayrollModal } from '../components/PayrollModal';

export function Payroll() {
  const [activeTab, setActiveTab] = useState<'my' | 'admin'>('my');
  const [loading, setLoading] = useState(false);

  // My Salary State
  const [myYears, setMyYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [myPayrolls, setMyPayrolls] = useState<any[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Admin State
  const [adminView, setAdminView] = useState<'monthly' | 'yearly'>('monthly');
  const [adminMonth, setAdminMonth] = useState('2025-12');
  const [adminYear, setAdminYear] = useState('2025');
  const [adminList, setAdminList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Category Selection State
  const [showBasic, setShowBasic] = useState(true);
  const [showRegular, setShowRegular] = useState(true);
  const [showVariable, setShowVariable] = useState(true);

  const CURRENT_USER_ID = "E00002"; // Hardcoded for prototype

  // Initial Load
  useEffect(() => {
    fetchYears();
  }, []);

  // Fetch Years
  const fetchYears = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/payroll/years/${CURRENT_USER_ID}`);
      const data = await res.json();
      setMyYears(data);
      if (data.length > 0) {
        setSelectedYear(data[0]);
      } else {
        setSelectedYear('2025'); 
      }
    } catch (e) {
      console.error(e);
      setMyYears(['2025']);
      setSelectedYear('2025');
    }
  };

  // Fetch My Payrolls when year changes
  useEffect(() => {
    if (activeTab === 'my' && selectedYear) {
      fetchMyPayrolls(selectedYear);
    }
  }, [activeTab, selectedYear]);

  // Fetch Admin List when month/year changes
  useEffect(() => {
    if (activeTab === 'admin') {
      if (adminView === 'monthly') {
        fetchAdminPayrolls(adminMonth);
      } else {
        fetchAdminYearlyPayrolls(adminYear);
      }
    }
  }, [activeTab, adminView, adminMonth, adminYear]);

  const fetchMyPayrolls = async (year: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/payroll/my/monthly/${CURRENT_USER_ID}?year=${year}`);
      const data = await res.json();
      setMyPayrolls(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollDetail = async (period: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/payroll/my/detail/${CURRENT_USER_ID}?pay_period=${period}`);
      const data = await res.json();
      setSelectedPayroll(data);
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminPayrolls = async (period: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/payroll/admin/monthly?pay_period=${period}`);
      const data = await res.json();
      setAdminList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminYearlyPayrolls = async (year: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/payroll/admin/yearly?year=${year}`);
      const data = await res.json();
      setAdminList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filter Admin List
  const filteredAdminList = adminList.filter(item => 
    item.NAME.includes(searchTerm) || 
    item.EMP_ID.includes(searchTerm) ||
    (item.DEP_NAME && item.DEP_NAME.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">급여정산</h1>
          <p className="text-gray-500 text-sm mt-1">급여 명세서를 확인하고 관리할 수 있습니다.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
            <button 
                onClick={() => setActiveTab('my')}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'my' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                내 급여
                {activeTab === 'my' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('admin')}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'admin' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <div className="flex items-center gap-2">
                    <Briefcase size={16} />
                    급여 관리
                </div>
                {activeTab === 'admin' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
            </button>
        </div>
      </div>

      {activeTab === 'my' ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
           {/* Year Filter */}
           <div className="flex justify-end">
             <div className="relative">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 pl-4 pr-10 py-2 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-sm"
                >
                  {myYears.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
             </div>
           </div>

           {/* Pay Stubs Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {loading ? (
                <div className="col-span-full py-12 text-center text-gray-500">로딩 중...</div>
             ) : myPayrolls.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                  조회된 급여 내역이 없습니다.
                </div>
             ) : (
                myPayrolls.map((payroll) => (
                  <div 
                    key={payroll.pay_period}
                    onClick={() => fetchPayrollDetail(payroll.pay_period)}
                    className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <CreditCard size={24} />
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                        지급완료
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {payroll.pay_period} 급여
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      지급일: {payroll.pay_date}
                    </p>
                    
                    <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                      <span className="text-sm text-gray-500">실수령액</span>
                      <span className="text-xl font-bold text-indigo-600">
                        {payroll.total_amount?.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                ))
             )}
           </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
          {/* Admin Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
             <div className="flex items-center gap-4 w-full md:w-auto">
                {/* View Toggle */}
               <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-bold">
                  <button 
                    onClick={() => setAdminView('monthly')}
                    className={`px-3 py-1.5 rounded-md transition-all ${adminView === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    월간
                  </button>
                  <button 
                    onClick={() => setAdminView('yearly')}
                    className={`px-3 py-1.5 rounded-md transition-all ${adminView === 'yearly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    연간
                  </button>
               </div>

               <div className="relative">
                 {adminView === 'monthly' ? (
                     <input 
                        type="month"
                        value={adminMonth}
                        onChange={(e) => setAdminMonth(e.target.value)}
                        className="pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
                     />
                 ) : (
                    <div className="relative">
                        <select 
                          value={adminYear}
                          onChange={(e) => setAdminYear(e.target.value)}
                          className="appearance-none bg-white border border-gray-200 pl-4 pr-10 py-2 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-sm"
                        >
                          <option value="2025">2025년</option>
                          <option value="2024">2024년</option>
                          <option value="2023">2023년</option>
                          <option value="2022">2022년</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                 )}
               </div>
               <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                   type="text"
                   placeholder="이름, 사번, 부서 검색"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
                 />
               </div>
             </div>
             
             <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
               <Download size={18} /> 엑셀 다운로드
             </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-4 px-2 mb-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={showBasic} onChange={e => setShowBasic(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">기본급여</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={showRegular} onChange={e => setShowRegular(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">정기수당</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={showVariable} onChange={e => setShowVariable(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">변동급여</span>
            </label>
          </div>

          {/* Employee Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-800">
                    {adminView === 'monthly' ? `${adminMonth} 급여 지급 현황` : `${adminYear}년 연간 급여 현황`}
                </h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">총 {filteredAdminList.length}명</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                            <th className="px-6 py-4">구성원</th>
                            <th className="px-6 py-4">부서</th>
                            {adminView === 'monthly' && <th className="px-6 py-4">지급일</th>}
                            {adminView === 'yearly' && <th className="px-6 py-4 text-center">지급월수</th>}
                            <th className="px-6 py-4 text-right">
                              {showBasic && showRegular && showVariable ? '지급총액' : '선택 합계'}
                            </th>
                            <th className="px-6 py-4 text-center">상세</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                           <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>
                        ) : filteredAdminList.length === 0 ? (
                           <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">데이터가 없습니다.</td></tr>
                        ) : (
                          filteredAdminList.map((emp) => {
                            const displayAmount = 
                              (showBasic ? (emp.BASIC_PAY || 0) : 0) +
                              (showRegular ? (emp.REGULAR_PAY || 0) : 0) +
                              (showVariable ? (emp.VARIABLE_PAY || 0) : 0);
                              
                            return (
                            <tr key={emp.EMP_ID} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                    {emp.NAME[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{emp.NAME}</p>
                                    <p className="text-xs text-gray-400">{emp.EMP_ID}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {emp.DEP_NAME || '-'}
                                </span>
                              </td>
                              
                              {adminView === 'monthly' ? (
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {emp.PAY_DATE}
                                  </td>
                              ) : (
                                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                                    {emp.PAID_MONTHS}개월
                                  </td>
                              )}
                              
                              <td className="px-6 py-4 text-right">
                                <span className="font-bold text-gray-900">
                                   {displayAmount.toLocaleString()}원
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">
                                  보기
                                </button>
                              </td>
                            </tr>
                            );
                          })
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <PayrollModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedPayroll} 
      />
    </div>
  );
}