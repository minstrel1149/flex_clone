import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Search, 
  Briefcase, 
  ChevronRight, 
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';

interface Applicant {
  APPLICANT_ID: string;
  NAME: string;
  POSITION_ID: string;
  TITLE: string;
  STAGE: string;
  STATUS: string;
  APPLIED_DATE: string;
}

interface Position {
  POSITION_ID: string;
  TITLE: string;
  DEPT_NAME: string;
  STATUS: string;
}

const STAGES = ['접수', '서류전형', '1차인터뷰', '2차인터뷰'];
const CLOSED_STAGES = ['최종합격', '불합격'];

export function Recruitment() {
  const [activeTab, setActiveTab] = useState<'진행중' | '종료'>('진행중');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('전체');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, posRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/recruitment/applicants?tab=${activeTab}`),
        axios.get('http://localhost:8000/api/recruitment/positions')
      ]);
      setApplicants(appRes.data);
      setPositions(posRes.data);
    } catch (err) {
      console.error('Failed to fetch recruitment data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.TITLE.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = selectedPosition === '전체' || app.POSITION_ID === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  const getStageColor = (stage: string) => {
    switch(stage) {
      case '접수': return 'bg-blue-50 text-blue-700 border-blue-100';
      case '서류전형': return 'bg-purple-50 text-purple-700 border-purple-100';
      case '1차인터뷰': return 'bg-orange-50 text-orange-700 border-orange-100';
      case '2차인터뷰': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case '최종합격': return 'bg-green-50 text-green-700 border-green-100';
      case '불합격': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Users size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">채용 관리 (ATS)</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">지원 현황 마스터</h1>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
            <span>+ 채용 공고 생성</span>
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            {(['진행중', '종료'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="지원자명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 min-w-[200px]">
              <Filter size={16} className="text-gray-400" />
              <select 
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="bg-transparent text-sm outline-none w-full"
              >
                <option value="전체">모든 포지션</option>
                {positions.map(pos => (
                  <option key={pos.POSITION_ID} value={pos.POSITION_ID}>{pos.TITLE}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board Style Stages */}
      <div className="flex-1 overflow-x-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : activeTab === '진행중' ? (
          <div className="flex gap-6 h-full min-w-max">
            {STAGES.map(stage => {
              const stageApps = filteredApplicants.filter(a => a.STAGE === stage);
              return (
                <div key={stage} className="flex flex-col w-72 bg-gray-100/50 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white/50 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700">{stage}</span>
                      <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {stageApps.length}
                      </span>
                    </div>
                    <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {stageApps.length > 0 ? stageApps.map(app => (
                      <div key={app.APPLICANT_ID} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{app.NAME}</h4>
                          <span className="text-[10px] text-gray-400">{app.APPLICANT_ID}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                          <Briefcase size={12} />
                          <span className="truncate">{app.TITLE}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock size={10} />
                            <span>{app.APPLIED_DATE}</span>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <div className="w-10 h-10 border-2 border-dashed border-gray-200 rounded-full mb-2" />
                        <span className="text-xs italic">지원자 없음</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Closed Tab - Grouped by Final Pass / Failed */
          <div className="space-y-12">
            {/* Final Pass Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 bg-green-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">최종합격 ({filteredApplicants.filter(a => a.STAGE === '최종합격').length})</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredApplicants.filter(a => a.STAGE === '최종합격').map(app => (
                  <div key={app.APPLICANT_ID} className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{app.NAME}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Briefcase size={14} /> {app.TITLE}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-50 text-green-700 border-green-100">
                        최종합격
                      </span>
                      <span className="text-xs text-gray-400">입사 예정일: {app.APPLIED_DATE}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Failed Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 bg-gray-400 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">불합격 ({filteredApplicants.filter(a => a.STATUS === '불합격').length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredApplicants.filter(a => a.STATUS === '불합격').map(app => (
                  <div key={app.APPLICANT_ID} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-3 shadow-sm hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <XCircle size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">{app.NAME}</h4>
                          <p className="text-[11px] text-gray-400 truncate max-w-[100px]">{app.TITLE}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">{app.APPLIED_DATE}</span>
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-red-100 bg-red-50 text-red-600">
                        탈락: {app.STAGE}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filteredApplicants.length === 0 && (
              <div className="py-20 text-center text-gray-400">
                <Filter size={40} className="mx-auto mb-4 opacity-20" />
                <p>종료된 지원 내역이 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-white border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
        <p>© 2026 Flex Recruitment System. All candidates are fictional.</p>
        <div className="flex gap-4">
          <span>총 지원자: {applicants.length}명</span>
          <span className="text-green-600 font-bold">진행중: {applicants.filter(a => a.STATUS === '진행중').length}명</span>
        </div>
      </div>
    </div>
  );
}
