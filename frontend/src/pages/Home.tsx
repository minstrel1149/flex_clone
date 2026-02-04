import { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, Calendar, ChevronRight, Bell, CheckCircle2, MapPin, X } from 'lucide-react';

interface DashboardData {
  profile: {
    NAME: string;
    EMAIL: string;
  };
  work_history: {
    DATE: string;
    WORK_TYPE_NAME: string;
    ACTUAL_WORK_MINUTES: number;
  }[];
  leave_history: {
    DATE: string;
    LEAVE_LENGTH: number;
  }[];
  stats: {
    total_work_minutes_this_week: number;
    remaining_leave_days: number;
  };
}

interface AttendanceStatus {
  status: 'before_work' | 'working' | 'after_work';
  data: {
    DATE_START_TIME: string;
    DATE_END_TIME: string;
    WORK_ETC: string;
  } | null;
}

export function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStatus>({ status: 'before_work', data: null });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Off-site Modal State
  const [isOffSiteModalOpen, setIsOffSiteModalOpen] = useState(false);
  const [offSiteReason, setOffSiteReason] = useState('');

  const EMP_ID = 'E00002'; // Demo User

  useEffect(() => {
    // 1. Dashboard Data
    axios.get(`http://127.0.0.1:8000/api/dashboard/${EMP_ID}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // 2. Attendance Status
    fetchAttendanceStatus();

    // 3. Clock Timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceStatus = () => {
    axios.get(`http://127.0.0.1:8000/api/attendance/today/${EMP_ID}`)
      .then(res => setAttendance(res.data));
  };

  const handleClockIn = async () => {
    if (!confirm('출근하시겠습니까?')) return;
    try {
      await axios.post('http://127.0.0.1:8000/api/attendance/clock-in', { emp_id: EMP_ID });
      fetchAttendanceStatus();
    } catch (err) { alert('출근 처리에 실패했습니다.'); }
  };

  const handleClockOut = async () => {
    if (!confirm('퇴근하시겠습니까?')) return;
    try {
      await axios.post('http://127.0.0.1:8000/api/attendance/clock-out', { emp_id: EMP_ID });
      fetchAttendanceStatus();
    } catch (err) { alert('퇴근 처리에 실패했습니다.'); }
  };

  const handleOffSiteApply = async () => {
    if (!offSiteReason.trim()) return alert('외근 사유를 입력해주세요.');
    try {
      await axios.post('http://127.0.0.1:8000/api/attendance/off-site', { emp_id: EMP_ID, info: offSiteReason });
      setIsOffSiteModalOpen(false);
      setOffSiteReason('');
      alert('외근 신청이 완료되었습니다.');
      fetchAttendanceStatus(); // Update status if needed (e.g. show "Off-site" badge)
    } catch (err) { alert('외근 신청에 실패했습니다.'); }
  };

  if (loading) return <div className="p-8">데이터 로딩 중...</div>;
  if (!data) return <div className="p-8">데이터를 불러올 수 없습니다.</div>;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            안녕하세요, <span className="text-indigo-600">{data.profile.NAME}</span>님 👋
          </h1>
          <p className="text-gray-500 mt-2">오늘도 활기찬 하루 보내세요!</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
                <Bell size={18} className="text-gray-400" />
                <span>알림</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Attendance Widget */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Clock size={120} />
                </div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Clock className="text-indigo-600" size={20} />
                        오늘의 근무
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold 
                        ${attendance.status === 'working' ? 'bg-green-100 text-green-700' : 
                          attendance.status === 'after_work' ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {attendance.status === 'working' ? '근무 중' : 
                         attendance.status === 'after_work' ? '퇴근 완료' : '출근 전'}
                    </span>
                </div>
                
                <div className="flex items-center gap-8 mb-8 relative z-10">
                    <div>
                        <p className="text-4xl font-black text-gray-900 tracking-tight font-mono">
                            {formatTime(currentTime)}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                            {currentTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                        </p>
                    </div>
                    <div className="h-12 w-px bg-gray-200"></div>
                    <div className="flex gap-6">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">출근 시간</p>
                            <p className="text-lg font-bold text-gray-800">
                                {attendance.data?.DATE_START_TIME || '--:--'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">퇴근 시간</p>
                            <p className="text-lg font-bold text-gray-800">
                                {attendance.data?.DATE_END_TIME || '--:--'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 relative z-10">
                    {attendance.status === 'before_work' && (
                        <button 
                            onClick={handleClockIn}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                            출근하기
                        </button>
                    )}
                    {attendance.status === 'working' && (
                        <button 
                            onClick={handleClockOut}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
                            퇴근하기
                        </button>
                    )}
                    {attendance.status === 'after_work' && (
                         <button disabled className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold cursor-not-allowed">
                            오늘 업무 종료
                        </button>
                    )}
                    
                    <button 
                        onClick={() => setIsOffSiteModalOpen(true)}
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                        외근 신청
                    </button>
                </div>
            </div>

            {/* Recent Work History */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">최근 근무 기록</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-gray-400 border-b border-gray-100">
                            <tr>
                                <th className="pb-3 font-medium">날짜</th>
                                <th className="pb-3 font-medium">근무 유형</th>
                                <th className="pb-3 font-medium">실 근무시간</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.work_history.map((work, idx) => (
                                <tr key={idx} className="group hover:bg-gray-50">
                                    <td className="py-4 text-gray-900 font-medium">{work.DATE}</td>
                                    <td className="py-4 text-gray-500">{work.WORK_TYPE_NAME}</td>
                                    <td className="py-4 text-gray-500 font-mono">
                                        {Math.floor(work.ACTUAL_WORK_MINUTES / 60)}h {work.ACTUAL_WORK_MINUTES % 60}m
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
            {/* User Profile Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold">
                        {data.profile.NAME[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{data.profile.NAME}</h3>
                        <p className="text-sm text-gray-500">{data.profile.EMAIL}</p>
                    </div>
                </div>
            </div>

            {/* Leave Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Calendar className="text-orange-500" size={20} />
                        휴가 현황
                    </h2>
                </div>
                <div className="mb-6 text-center py-4 bg-orange-50 rounded-xl">
                    <p className="text-sm text-orange-600 mb-1">사용 가능 연차</p>
                    <p className="text-3xl font-bold text-orange-600">{data.stats.remaining_leave_days}<span className="text-base font-normal ml-1">일</span></p>
                </div>
                <ul className="space-y-3">
                    {data.leave_history.slice(0, 3).map((leave, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            <span className="text-gray-600">{leave.DATE}</span>
                            <span className="text-gray-900 font-medium ml-auto">{leave.LEAVE_LENGTH}일</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>

      {/* Off-site Modal */}
      {isOffSiteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="text-indigo-600" />
                외근 신청
              </h3>
              <button onClick={() => setIsOffSiteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                  {new Date().toLocaleDateString()} (오늘)
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">외근 사유 및 장소</label>
                <textarea 
                  value={offSiteReason}
                  onChange={(e) => setOffSiteReason(e.target.value)}
                  placeholder="예: 클라이언트 미팅 (강남역)"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setIsOffSiteModalOpen(false)}
                  className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleOffSiteApply}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  신청하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
