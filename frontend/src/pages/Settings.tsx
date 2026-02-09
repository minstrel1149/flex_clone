import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Clock, 
  ShieldCheck, 
  Calendar,
  Briefcase,
  FileText,
  Award,
  MapPin,
  DollarSign,
  ChevronRight,
  Edit2,
  Layers,
  UserCircle
} from 'lucide-react';

interface SettingMenuItem {
  id: string;
  label: string;
  icon: any;
  category: string;
}

const SETTINGS_MENU: SettingMenuItem[] = [
  // 기본 설정
  { id: 'company_info', label: '회사 정보', icon: Building2, category: '기본 설정' },
  { id: 'holidays', label: '공휴일 · 휴무일', icon: Calendar, category: '기본 설정' },
  
  // 조직 관리
  { id: 'org_structure', label: '조직 구조 (Division/Office)', icon: Layers, category: '조직 관리' },
  { id: 'position_management', label: '직위 · 직급 관리', icon: Award, category: '조직 관리' },
  { id: 'member_fields', label: '구성원 정보 항목', icon: UserCircle, category: '조직 관리' },
  
  // 운영 정책
  { id: 'work_type', label: '근무 유형 설정', icon: Clock, category: '운영 정책' },
  { id: 'leave_policy', label: '휴가 규정 관리', icon: FileText, category: '운영 정책' },
  { id: 'payroll_config', label: '급여 · 정산 설정', icon: DollarSign, category: '운영 정책' },
  { id: 'approval_flow', label: '결제 · 승인 라인', icon: ShieldCheck, category: '운영 정책' },
];

export function Settings() {
  const [activeMenu, setActiveMenu] = useState('company_info');

  const renderContent = () => {
    switch (activeMenu) {
      case 'company_info':
        return (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-900">회사 정보</h2>
            
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              </div>
              <div className="p-6 flex items-start justify-between">
                <div className="flex gap-5">
                  <div className="w-24 h-24 bg-white rounded-3xl -mt-16 border-4 border-white flex items-center justify-center text-indigo-600 text-4xl font-black shadow-xl">
                    FC
                  </div>
                  <div className="pt-2">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      (가상) 주식회사 플렉스 클론 <Edit2 size={18} className="text-gray-300 cursor-pointer hover:text-indigo-500" />
                    </h3>
                    <p className="text-gray-500 font-medium">Flex Clone System Service · 구성원 1,000명 이상</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="text-sm font-bold text-gray-900">기본 정보</h4>
                <button className="text-indigo-600 text-sm font-bold hover:underline">수정하기</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  { label: '대표자', value: '관리자 (Admin)', icon: Users },
                  { label: '대표 번호', value: '02-123-4567', icon: Briefcase },
                  { label: '설립일', value: '2020년 1월 1일', icon: Calendar },
                  { label: '사업자 번호', value: '123-45-67890', icon: FileText },
                  { label: '주소', value: '서울특별시 강남구 테헤란로 123 플렉스타워 15층', icon: MapPin, fullWidth: true },
                ].map((item, idx) => (
                  <div key={idx} className={`space-y-1.5 ${item.fullWidth ? 'md:col-span-2' : ''}`}>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</label>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'org_structure':
        const structure = [
          { 
            name: 'Planning Division', 
            offices: [
              { name: 'Strategy Office', teams: ['Planning Team', 'Analysis Team', 'HR Team'] },
              { name: 'Finance Office', teams: ['Accounting Team', 'Treasury Team'] }
            ] 
          },
          { 
            name: 'Development Division', 
            offices: [
              { name: 'R&D Office', teams: ['Backend Team', 'Frontend Team', 'Mobile Team'] },
              { name: 'QA Office', teams: ['System QA Team', 'Service QA Team'] }
            ] 
          },
          { 
            name: 'Sales Division', 
            offices: [
              { name: 'Marketing Office', teams: ['Performance Marketing Team', 'Content Marketing Team'] },
              { name: 'Domestic Sales Office', teams: ['Domestic Sales Team 1', 'Domestic Sales Team 2'] },
              { name: 'Global Sales Office', teams: ['APAC Sales Team', 'EU/NA Sales Team'] }
            ] 
          },
          { 
            name: 'Operating Division', 
            offices: [
              { name: 'Engineering Office', teams: ['Process Engineering Team', 'Quality Engineering Team'] },
              { name: 'Production Office', teams: ['Production Team Alpha', 'Production Team Beta', 'Production Team Charlie'] }
            ] 
          },
        ];
        return (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">조직 구조</h2>
                <p className="text-sm text-gray-500 mt-1">시스템에서 사용되는 본부(Division) - 실(Office) - 팀(Team) 단위의 위계입니다.</p>
              </div>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">구조 편집</button>
            </div>

            <div className="grid gap-8">
              {structure.map((div, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <span className="font-bold text-white text-lg">{div.name}</span>
                    <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase backdrop-blur-sm">Division</span>
                  </div>
                  <div className="p-6 space-y-6">
                    {div.offices.map((off, j) => (
                      <div key={j} className="space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-50 pb-2">
                          <Briefcase size={16} />
                          <span className="font-bold text-sm">{off.name}</span>
                          <span className="text-[9px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-bold uppercase">Office</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {off.teams.map((team, k) => (
                            <div key={k} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-white transition-all cursor-pointer group">
                              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-indigo-500 transition-colors" />
                              <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">{team}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'position_management':
        return (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-900">직위 · 직급 관리</h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 border-b border-gray-50">
                    <th className="pb-4 px-2">직위 (Position)</th>
                    <th className="pb-4 px-2">포함된 직급 (Grade)</th>
                    <th className="pb-4 px-2 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { pos: 'Staff', grades: 'G1, G2' },
                    { pos: 'Manager', grades: 'G3, G4' },
                    { pos: 'Director', grades: 'G5, G6' },
                    { pos: 'C-Level', grades: 'G7' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 font-bold text-gray-800">{row.pos}</td>
                      <td className="py-4 px-2 text-sm text-gray-500">
                        <div className="flex gap-2">
                          {row.grades.split(', ').map((g, j) => (
                            <span key={j} className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">{g}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button className="text-xs font-bold text-indigo-600 hover:underline">설정</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'work_type':
        const workSystems = [
          { id: 'WS001', name: '일반 근무', types: [
            { name: '주간', start: '09:00', end: '18:00', color: 'bg-blue-500' }
          ]},
          { id: 'WS002', name: '4조 3교대', types: [
            { name: '주간', start: '07:00', end: '15:00', color: 'bg-blue-500' },
            { name: '오후', start: '15:00', end: '23:00', color: 'bg-orange-500' },
            { name: '야간', start: '23:00', end: '07:00', color: 'bg-purple-600' },
            { name: '휴무', start: '-', end: '-', color: 'bg-gray-400' }
          ]},
          { id: 'WS003', name: '4조 2교대', types: [
            { name: '주간', start: '07:00', end: '19:00', color: 'bg-blue-500' },
            { name: '야간', start: '19:00', end: '07:00', color: 'bg-purple-600' },
            { name: '비번/휴무', start: '-', end: '-', color: 'bg-gray-400' }
          ]},
          { id: 'WS004', name: '3조 2교대', types: [
            { name: '주간', start: '08:00', end: '20:00', color: 'bg-blue-500' },
            { name: '야간', start: '20:00', end: '08:00', color: 'bg-purple-600' },
            { name: '비번/휴무', start: '-', end: '-', color: 'bg-gray-400' }
          ]}
        ];
        return (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">근무 유형 설정</h2>
                <p className="text-sm text-gray-500 mt-1">조직에서 운영 중인 근무 시스템과 세부 시간표를 관리합니다.</p>
              </div>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">+ 새 근무제 추가</button>
            </div>

            <div className="space-y-6">
              {workSystems.map((system) => (
                <div key={system.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{system.name}</h3>
                        <p className="text-xs text-gray-400">ID: {system.id}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Edit2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {system.types.map((type, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${type.color}`} />
                          <span className="text-sm font-bold text-gray-700">{type.name}</span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-lg font-black text-gray-900 tracking-tight">{type.start}</span>
                          <span className="text-gray-300 font-bold">-</span>
                          <span className="text-lg font-black text-gray-900 tracking-tight">{type.end}</span>
                        </div>
                        {type.start !== '-' && (
                          <p className="text-[10px] text-gray-400 font-medium">실근무 8시간 (휴게 1시간 포함)</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'leave_policy':
        const leavePolicies = [
          { id: 'LT001', name: '연차휴가', type: '유급', grant: '법정 기준 (1년 미만 매월 1일, 1년 이상 15일~)', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { id: 'LT002', name: '병휴가', type: '유급/무급', grant: '연 최대 60일 (근로기준법 및 취업규칙 의거)', icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50' },
          { id: 'LT003', name: '경조휴가', type: '유급', grant: '사유별 차등 지급 (1일 ~ 5일)', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
          { id: 'LT004', name: '포상휴가', type: '유급', grant: '성과 및 근속에 따른 특별 부여', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
        ];
        return (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">휴가 규정 관리</h2>
                <p className="text-sm text-gray-500 mt-1">조직의 휴가 종류별 부여 원칙과 상세 규정을 설정합니다.</p>
              </div>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">+ 새 휴가 종류 추가</button>
            </div>

            <div className="grid gap-4">
              {leavePolicies.map((policy) => (
                <div key={policy.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-indigo-200 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 ${policy.bg} rounded-2xl flex items-center justify-center ${policy.color}`}>
                        <policy.icon size={24} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{policy.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${policy.type === '유급' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                            {policy.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{policy.grant}</p>
                        <div className="flex gap-4 mt-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">사용 단위</span>
                            <span className="text-xs text-gray-600 font-medium">0.5일 (반차) / 1일</span>
                          </div>
                          <div className="flex flex-col border-l border-gray-100 pl-4">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">이월 여부</span>
                            <span className="text-xs text-gray-600 font-medium">미사용 시 소멸</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <ShieldCheck size={16} /> 공통 휴가 정책 안내
              </h4>
              <ul className="text-xs text-indigo-700 space-y-1.5 list-disc list-inside ml-1">
                <li>휴가 신청 시 결재권자의 승인이 반드시 필요합니다.</li>
                <li>연차 휴가는 입사일 기준으로 자동 부여되며, 회계연도 기준 변경은 관리자에게 문의하세요.</li>
                <li>반차(0.5일) 사용 시 오전/오후 선택이 가능합니다.</li>
              </ul>
            </div>
          </div>
        );

      case 'payroll_config':
        const payrollItems = [
          { id: 'PI001', name: '기본급', type: '1개월', category: '기본급여', tax: '과세' },
          { id: 'PI002', name: '식대', type: '1개월', category: '정기수당', tax: '비과세' },
          { id: 'PI003', name: '시간외근로수당', type: '1개월', category: '정기수당', tax: '과세' },
          { id: 'PI004', name: '직책수당', type: '1개월', category: '정기수당', tax: '과세' },
          { id: 'PI005', name: '연구수당', type: '1개월', category: '정기수당', tax: '비과세' },
          { id: 'PI006', name: '육아수당', type: '1개월', category: '정기수당', tax: '비과세' },
          { id: 'PI009', name: '인센티브', type: '변동', category: '변동급여', tax: '과세' },
        ];
        
        const categories = ['기본급여', '정기수당', '변동급여'];

        return (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">급여 · 정산 설정</h2>
                <p className="text-sm text-gray-500 mt-1">지급 항목 구성 및 세금, 비과세 등 급여 계산의 기초가 되는 항목을 관리합니다.</p>
              </div>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">+ 새 지급 항목 추가</button>
            </div>

            <div className="space-y-8">
              {categories.map(cat => (
                <div key={cat} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                    <h3 className="font-bold text-gray-900">{cat}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payrollItems.filter(item => item.category === cat).map(item => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-200 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <DollarSign size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-medium">지급주기: {item.type}</span>
                              <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                              <span className={`text-[10px] font-bold ${item.tax === '과세' ? 'text-orange-500' : 'text-green-600'}`}>
                                {item.tax}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-sm">정산 공통 설정</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: '정산 기준일', value: '매월 말일' },
                  { label: '급여 지급일', value: '매월 25일 (익월 지급)' },
                  { label: '4대보험 적용', value: '자동 계산' },
                ].map((conf, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{conf.label}</span>
                    <p className="text-sm font-bold text-gray-700">{conf.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'member_fields':
        const fieldCategories = [
          { 
            category: '기본 정보', 
            fields: ['사번 (EMP_ID)', '이름 (NAME)', '영문 이름 (ENG_NAME)', '닉네임 (NICKNAME)', '성별 (GENDER)', '생년월일 (PERSONAL_ID)'] 
          },
          { 
            category: '연락처 및 주소', 
            fields: ['이메일 (EMAIL)', '휴대폰 번호 (PHONE_NUM)', '거주지 주소 (ADDRESS)', '국적 (NATIONALITY)'] 
          },
          { 
            category: '인사 정보', 
            fields: ['입사일 (IN_DATE)', '그룹 입사일 (GROUP_IN_DATE)', '재직 상태 (CURRENT_EMP_YN)', '퇴사일 (OUT_DATE)', '수습 여부 (PROB_YN)'] 
          }
        ];
        return (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">구성원 정보 항목</h2>
              <p className="text-sm text-gray-500 mt-1">구성원 프로필에 표시되고 관리되는 데이터 항목들을 설정합니다.</p>
            </div>

            <div className="space-y-8">
              {fieldCategories.map((cat, i) => (
                <div key={i} className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 px-1 uppercase tracking-wider">{cat.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cat.fields.map((field, j) => (
                      <div key={j} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl shadow-sm group">
                        <span className="text-sm font-medium text-gray-700">{field}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold">필수</span>
                          <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-gray-400 text-sm font-medium hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                      + 항목 추가
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'approval_flow':
        const policies = [
          { id: 'AP001', name: '근태 신청 (휴가/재택/연장)', steps: 2, defaultLine: '팀장 → 본부장', icon: Clock },
          { id: 'AP002', name: '급여/정산 문서', steps: 3, defaultLine: '팀장 → 인사팀 → 대표이사', icon: DollarSign },
          { id: 'AP003', name: '일반 인사 서류', steps: 1, defaultLine: '팀장', icon: FileText },
          { id: 'AP004', name: '계약서/날인', steps: 2, defaultLine: '인사팀 → 대표이사', icon: ShieldCheck },
        ];
        return (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">결제 · 승인 라인</h2>
                <p className="text-sm text-gray-500 mt-1">각 문서 종류별로 기본 승인 절차 및 라인을 설정합니다.</p>
              </div>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">+ 새 정책 추가</button>
            </div>

            <div className="grid gap-4">
              {policies.map((p) => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <p.icon size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-gray-900">{p.name}</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{p.steps}단계 승인</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            기본 라인: <span className="text-gray-600 font-medium">{p.defaultLine}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">설정 변경</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 mb-1">대결 제도 안내</h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                  결재권자가 부재중인 경우, 사전에 설정된 대결권자가 대신 승인할 수 있도록 설정할 수 있습니다. 
                  대결 설정은 각 구성원의 개인 설정 또는 관리자 페이지에서 가능합니다.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <Layers size={32} />
            </div>
            <p className="text-sm">'{SETTINGS_MENU.find(m => m.id === activeMenu)?.label}' 메뉴는 현재 준비 중입니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-72 border-r border-gray-100 flex flex-col bg-gray-50/30">
        <div className="p-6 pb-2">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Settings</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Workspace Admin</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8">
          {['기본 설정', '조직 관리', '운영 정책'].map((cat) => (
            <div key={cat} className="space-y-1">
              <h3 className="px-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">{cat}</h3>
              {SETTINGS_MENU.filter(item => item.category === cat).map((item) => {
                const isActive = activeMenu === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold' 
                        : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                      }`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="max-w-5xl mx-auto p-12 min-h-full relative">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}