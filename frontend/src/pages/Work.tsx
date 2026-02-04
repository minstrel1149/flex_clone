import { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

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

export function Work() {
  const [data, setData] = useState<WorkData>({
    summary: { total_work_minutes: 0, total_overtime_minutes: 0, work_days: 0 },
    records: []
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date('2023-01-01')); // Default to 2023-01 per data

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkData(currentDate);
  }, [currentDate]);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header & Date Controls */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">근무</h1>
          <p className="text-gray-500 text-sm mt-1">나의 근무 기록을 확인하세요.</p>
        </div>
        
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => handleMonthChange(-1)}
            className="px-3 py-1 hover:bg-gray-50 text-gray-600 rounded-md text-sm"
          >
            &lt;
          </button>
          <span className="px-4 font-bold text-gray-800">
            {currentDate.getFullYear()}. {String(currentDate.getMonth() + 1).padStart(2, '0')}
          </span>
          <button 
            onClick={() => handleMonthChange(1)}
            className="px-3 py-1 hover:bg-gray-50 text-gray-600 rounded-md text-sm"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">총 근무 시간</p>
            <p className="text-2xl font-bold text-gray-900">{formatMinutes(data.summary.total_work_minutes)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">초과 근무</p>
            <p className="text-2xl font-bold text-gray-900">{formatMinutes(data.summary.total_overtime_minutes)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">근무 일수</p>
            <p className="text-2xl font-bold text-gray-900">{data.summary.work_days}일</p>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">일별 근무 기록</h2>
        </div>
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
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>
              ) : data.records.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">기록이 없습니다.</td></tr>
              ) : (
                data.records.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {record.DATE}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-500">
                        {record.WORK_TYPE_NAME}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {formatMinutes(record.SCHEDULED_WORK_MINUTES)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600 font-mono">
                      {formatMinutes(record.ACTUAL_WORK_MINUTES)}
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-500 font-mono">
                      {record.OVERTIME_MINUTES > 0 ? `+${formatMinutes(record.OVERTIME_MINUTES)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                      {record.NIGHT_WORK_MINUTES > 0 ? formatMinutes(record.NIGHT_WORK_MINUTES) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
