import { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Search, Filter, MoreVertical, Download, X } from 'lucide-react';
import { MemberModal } from '../components/MemberModal';

interface Employee {
  EMP_ID: string;
  NAME: string;
  EMAIL: string;
  DEPT_NAME?: string;
  DIVISION_NAME?: string;
  POSITION_NAME?: string;
  JOB_NAME?: string;
  JOB_GROUP_NAME?: string;
  PHONE_NUM?: string;
  CURRENT_EMP_YN?: string;
}

export function Members() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterOptions, setFilterOptions] = useState({ divisions: [] as string[], jobs: [] as string[] });
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [selectedJob, setSelectedJob] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/employees?limit=500')
      .then(res => {
        // 프론트엔드에서도 EMP_ID 기준 최종 중복 제거
        const uniqueData = Array.from(new Map(res.data.map((item: any) => [item.EMP_ID, item])).values()) as Employee[];
        setEmployees(uniqueData);
        setFilteredEmployees(uniqueData);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    axios.get('http://127.0.0.1:8000/api/filter-options').then(res => setFilterOptions(res.data));
  }, []);

  useEffect(() => {
    let result = [...employees];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e => e.NAME.toLowerCase().includes(term) || e.EMP_ID.toLowerCase().includes(term));
    }
    if (selectedDivision !== 'All') result = result.filter(e => e.DIVISION_NAME === selectedDivision);
    if (selectedJob !== 'All') result = result.filter(e => e.JOB_GROUP_NAME === selectedJob);
    if (selectedStatus !== 'All') result = result.filter(e => e.CURRENT_EMP_YN === selectedStatus);
    setFilteredEmployees(result);
  }, [searchTerm, selectedDivision, selectedJob, selectedStatus, employees]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">구성원</h1>
            <p className="text-gray-500 text-sm mt-1">총 {filteredEmployees.length}명</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
                <Download size={18} />
                <span>다운로드</span>
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md">
                구성원 추가
            </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6 space-y-3">
        <div className="flex gap-3">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" placeholder="이름, 사번 검색" value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <button onClick={() => setIsFilterVisible(!isFilterVisible)} className={`p-2 border rounded-lg ${isFilterVisible ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white'}`}>
                <Filter size={20} />
            </button>
        </div>

        {isFilterVisible && (
            <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-50 animate-in slide-in-from-top-1">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="p-2 bg-gray-50 rounded-lg text-sm border-none">
                    <option value="All">전체 상태</option>
                    <option value="Y">재직</option>
                    <option value="N">퇴사</option>
                </select>
                <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)} className="p-2 bg-gray-50 rounded-lg text-sm border-none">
                    <option value="All">전체 소속</option>
                    {filterOptions.divisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="p-2 bg-gray-50 rounded-lg text-sm border-none">
                    <option value="All">전체 직무</option>
                    {filterOptions.jobs.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <button onClick={() => {setSelectedJob('All'); setSelectedStatus('All'); setSelectedDivision('All'); setSearchTerm('');}} className="text-gray-400">
                    <X size={20} />
                </button>
            </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                        <th className="px-6 py-4">구성원</th>
                        <th className="px-6 py-4">부서 / 직위</th>
                        <th className="px-6 py-4">직무</th>
                        <th className="px-6 py-4 text-center">상태</th>
                        <th className="px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>
                    ) : filteredEmployees.map((emp) => (
                        <tr key={emp.EMP_ID} onClick={() => {setSelectedMember(emp); setIsModalOpen(true);}} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">{emp.NAME[0]}</div>
                                    <div>
                                        <div className="font-bold text-gray-900">{emp.NAME}</div>
                                        <div className="text-xs text-gray-400">{emp.EMP_ID}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="text-gray-700 font-medium">{emp.DEPT_NAME}</div>
                                <div className="text-gray-400">{emp.POSITION_NAME}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="text-gray-600">{emp.JOB_NAME}</div>
                                <div className="text-[10px] text-gray-400">{emp.JOB_GROUP_NAME}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${emp.CURRENT_EMP_YN === 'Y' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {emp.CURRENT_EMP_YN === 'Y' ? '재직' : '퇴사'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-300 group-hover:text-gray-600">
                                <MoreVertical size={18} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      <MemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} member={selectedMember} />
    </div>
  );
}
