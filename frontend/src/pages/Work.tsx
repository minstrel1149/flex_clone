import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Clock, AlertCircle, Users, Download } from 'lucide-react';

// --- Types ---
interface WorkRecord {
  DATE: string;
  WORK_SYS_ID: string;
  WORK_TYPE_NAME: string;
  SCHEDULED_WORK_MINUTES: number;
  ACTUAL_WORK_MINUTES: number;
  OVERTIME_MINUTES: number;
  NIGHT_WORK_MINUTES: number;
}
interface WorkSummary {
  total_work_minutes: number;
  total_overtime_minutes: number;
  work_days: number;
}
interface WorkData {
  summary: WorkSummary;
  records: WorkRecord[];
}
interface EmployeeStatus {
  EMP_ID: string;
  NAME: string;
  DEP_NAME: string;
  STATUS: string;
  DATE_START_TIME: string;
  DATE_END_TIME: string;
  WORK_ETC: string;
}

// --- Components ---

const MyWork = () => {
  const [data, setData] = useState<WorkData>({
    summary: { total_work_minutes: 0, total_overtime_minutes: 0, work_days: 0 },
    records: []
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date('2025-12-01'));

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  const fetchWorkData = async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const res = await axios.get(`http://127.0.0.1:8000/api/work/E00002?year=${year}&month=${month}`);
      setData(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkData(currentDate); }, [currentDate]);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
       {/* Date Controls */}
       <div className="flex justify-end mb-6">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <button onClick={() => handleMonthChange(-1)} className="px-3 py-1 hover:bg-gray-50 text-gray-600 rounded-md text-sm">&lt;</button>
          <span className="px-4 font-bold text-gray-800">{currentDate.getFullYear()}. {String(currentDate.getMonth() + 1).padStart(2, '0')}</span>
          <button onClick={() => handleMonthChange(1)} className="px-3 py-1 hover:bg-gray-50 text-gray-600 rounded-md text-sm">&gt;</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Clock size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">총 근무 시간</p><p className="text-2xl font-bold text-gray-900">{formatMinutes(data.summary.total_work_minutes)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600"><AlertCircle size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">초과 근무</p><p className="text-2xl font-bold text-gray-900">{formatMinutes(data.summary.total_overtime_minutes)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600"><Calendar size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">근무 일수</p><p className="text-2xl font-bold text-gray-900">{data.summary.work_days}일</p></div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-800">일별 근무 기록</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                <th className="px-6 py-4">날짜</th>
                <th className="px-6 py-4">근무 유형</th>
                <th className="px-6 py-4">계획 근무</th>
                <th className="px-6 py-4">실제 근무</th>
                <th className="px-6 py-4">초과 근무</th>
                <th className="px-6 py-4">야간 근무</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>) : 
               data.records.length === 0 ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">기록이 없습니다.</td></tr>) : 
               (data.records.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.DATE}</td>
                    <td className="px-6 py-4 text-sm text-gray-600"><span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-500">{record.WORK_TYPE_NAME}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{formatMinutes(record.SCHEDULED_WORK_MINUTES)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600 font-mono">{formatMinutes(record.ACTUAL_WORK_MINUTES)}</td>
                    <td className="px-6 py-4 text-sm text-orange-500 font-mono">{record.OVERTIME_MINUTES > 0 ? `+${formatMinutes(record.OVERTIME_MINUTES)}` : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{record.NIGHT_WORK_MINUTES > 0 ? formatMinutes(record.NIGHT_WORK_MINUTES) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const WorkManagement = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date('2025-12-31'));

  const fetchDaily = (date: Date) => {
    setLoading(true);
    const dateStr = date.toISOString().split('T')[0];
    axios.get(`http://127.0.0.1:8000/api/work/admin/daily-status?date=${dateStr}`)
      .then(res => { setEmployees(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchMonthly = (date: Date) => {
    setLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    axios.get(`http://127.0.0.1:8000/api/work/admin/monthly-stats?year=${year}&month=${month}`)
      .then(res => { setEmployees(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (viewMode === 'daily') fetchDaily(currentDate);
    else fetchMonthly(currentDate);
  }, [viewMode, currentDate]);

  const handleDateChange = (offset: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
        newDate.setDate(newDate.getDate() + offset);
    } else {
        newDate.setMonth(newDate.getMonth() + offset);
    }
    setCurrentDate(newDate);
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setViewMode('daily')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'daily' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                일일 현황
            </button>
            <button 
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                월간 통계
            </button>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                <button onClick={() => handleDateChange(-1)} className="px-3 py-1 hover:bg-gray-50 text-gray-600 rounded-md text-sm">&lt;</button>
                <span className="px-4 font-bold text-gray-800 text-sm">
                    {viewMode === 'daily' 
                        ? currentDate.toISOString().split('T')[0]
                        : `${currentDate.getFullYear()}. ${String(currentDate.getMonth() + 1).padStart(2, '0')}`
                    }
                </span>
                <button onClick={() => handleDateChange(1)} className="px-3 py-1 hover:bg-gray-50 text-gray-600 rounded-md text-sm">&gt;</button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
                <Download size={18} />
                <span>데이터 다운로드</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">
            {viewMode === 'daily' ? '전사 근무 현황' : '전사 월간 근무 통계'}
          </h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">총 {employees.length}명</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                <th className="px-6 py-4">구성원</th>
                <th className="px-6 py-4">소속</th>
                {viewMode === 'daily' ? (
                    <>
                        <th className="px-6 py-4 text-center">상태</th>
                        <th className="px-6 py-4">출근 시간</th>
                        <th className="px-6 py-4">퇴근 시간</th>
                    </>
                ) : (
                    <>
                        <th className="px-6 py-4">총 근무 시간</th>
                        <th className="px-6 py-4">초과 근무</th>
                        <th className="px-6 py-4 text-center">근무 일수</th>
                    </>
                )}
                <th className="px-6 py-4">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>) : 
               employees.length === 0 ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">데이터가 없습니다.</td></tr>) : 
               (employees.slice(0, 100).map((emp) => (
                  <tr key={emp.EMP_ID} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">{emp.NAME[0]}</div>
                            <div>
                                <div className="font-bold text-gray-900 text-sm">{emp.NAME}</div>
                                <div className="text-xs text-gray-400">{emp.EMP_ID}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.DEP_NAME}</td>
                    
                    {viewMode === 'daily' ? (
                        <>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold 
                                    ${emp.STATUS === '근무중' ? 'bg-green-100 text-green-700' : 
                                    emp.STATUS === '퇴근' ? 'bg-gray-100 text-gray-600' : 
                                    emp.STATUS === '휴가' ? 'bg-orange-100 text-orange-600' : 'bg-red-50 text-red-400'}`}>
                                    {emp.STATUS}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800 font-mono">{emp.DATE_START_TIME || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-800 font-mono">{emp.DATE_END_TIME || '-'}</td>
                        </>
                    ) : (
                        <>
                            <td className="px-6 py-4 text-sm text-gray-900 font-bold font-mono">{formatMinutes(emp.ACTUAL_WORK_MINUTES)}</td>
                            <td className="px-6 py-4 text-sm text-orange-500 font-mono">+{formatMinutes(emp.OVERTIME_MINUTES)}</td>
                            <td className="px-6 py-4 text-sm text-gray-800 text-center">{emp.WORK_DAYS}일</td>
                        </>
                    )}
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{emp.WORK_ETC || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export function Work() {
  const [activeTab, setActiveTab] = useState<'my' | 'manage'>('my');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">근무</h1>
          <p className="text-gray-500 text-sm mt-1">근무 기록과 현황을 관리합니다.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
            <button 
                onClick={() => setActiveTab('my')}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'my' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                내 근무
                {activeTab === 'my' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('manage')}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'manage' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <div className="flex items-center gap-2">
                    <Users size={16} />
                    근무 관리
                </div>
                {activeTab === 'manage' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
            </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'my' ? <MyWork /> : <WorkManagement />}
    </div>
  );
}
