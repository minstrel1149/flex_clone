import { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, Calendar, ChevronRight, Bell, CheckCircle2, Coffee } from 'lucide-react';

interface DashboardData {
  profile: {
    NAME: string;
    DEPARTMENT: string; // 데이터에 없을 수도 있으니 확인 필요
    POSITION: string;
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

export function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 임시로 사원 ID 'E00001' 사용
    axios.get('http://127.0.0.1:8000/api/dashboard/E00001')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">데이터 로딩 중...</div>;
  if (!data) return <div className="p-8">데이터를 불러올 수 없습니다.</div>;

  return (
    <div className="space-y-6">
      {/* 1. 상단 환영 메시지 & 알림 */}
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
                <span>알림 3</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. 왼쪽 컬럼 (주요 액션 및 근무 현황) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* 근무 상태 위젯 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Clock className="text-indigo-600" size={20} />
                        오늘의 근무
                    </h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        근무 중
                    </span>
                </div>
                
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-gray-50 p-4 rounded-xl text-center">
                        <p className="text-xs text-gray-500 mb-1">출근 시간</p>
                        <p className="text-xl font-bold text-gray-900">09:03</p>
                    </div>
                    <div className="flex-1 bg-gray-50 p-4 rounded-xl text-center">
                        <p className="text-xs text-gray-500 mb-1">퇴근 예정</p>
                        <p className="text-xl font-bold text-gray-900">18:00</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                        퇴근하기
                    </button>
                    <button className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                        외근 신청
                    </button>
                </div>
            </div>

            {/* 이번 주 근무 기록 위젯 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">최근 근무 기록</h2>
                    <button className="text-sm text-gray-400 hover:text-gray-600 flex items-center">
                        더보기 <ChevronRight size={16} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-gray-400 border-b border-gray-100">
                            <tr>
                                <th className="pb-3 font-medium">날짜</th>
                                <th className="pb-3 font-medium">근무 유형</th>
                                <th className="pb-3 font-medium">실 근무시간</th>
                                <th className="pb-3 font-medium text-right">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.work_history.map((work, idx) => (
                                <tr key={idx} className="group hover:bg-gray-50">
                                    <td className="py-4 text-gray-900 font-medium">{work.DATE}</td>
                                    <td className="py-4 text-gray-500">{work.WORK_TYPE_NAME}</td>
                                    <td className="py-4 text-gray-500">
                                        {Math.floor(work.ACTUAL_WORK_MINUTES / 60)}시간 {work.ACTUAL_WORK_MINUTES % 60}분
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 group-hover:bg-white border group-hover:border-gray-200">
                                            확정
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* 3. 오른쪽 컬럼 (요약 및 사이드 위젯) */}
        <div className="space-y-6">
            
            {/* 내 정보 요약 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                        {/* 이미지 플레이스홀더 */}
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                            {data.profile.NAME[0]}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{data.profile.NAME}</h3>
                        <p className="text-sm text-gray-500">{data.profile.EMAIL}</p>
                    </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-500 text-sm">소속</span>
                        <span className="font-medium text-gray-900 text-sm">개발팀 (가정)</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-500 text-sm">직책</span>
                        <span className="font-medium text-gray-900 text-sm">매니저 (가정)</span>
                    </div>
                </div>
            </div>

            {/* 휴가 현황 위젯 */}
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

                <h3 className="text-sm font-bold text-gray-900 mb-3">최근 휴가 사용</h3>
                <ul className="space-y-3">
                    {data.leave_history.length > 0 ? data.leave_history.map((leave, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            <span className="text-gray-600">{leave.DATE}</span>
                            <span className="text-gray-900 font-medium ml-auto">{leave.LEAVE_LENGTH}일</span>
                        </li>
                    )) : (
                        <p className="text-sm text-gray-400">최근 휴가 기록이 없습니다.</p>
                    )}
                </ul>
            </div>

             {/* 투두 리스트 (정적 데이터) */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <CheckCircle2 className="text-blue-500" size={20} />
                        할 일
                    </h2>
                </div>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700">1월 급여 명세서 확인하기</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700">인사평가 본인 평가 작성</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked readOnly />
                        <span className="text-sm text-gray-400 line-through">개인정보 업데이트</span>
                    </li>
                </ul>
            </div>

        </div>
      </div>
    </div>
  );
}