import { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Search, Filter } from 'lucide-react';

interface Employee {
  EMP_ID: string;
  NAME: string;
  EMAIL: string;
  DEPARTMENT?: string; // CSV 데이터 확인 후 정확한 필드명 매핑 필요
  POSITION?: string;
  PHONE_NUM?: string;
}

export function Members() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 100명 정도 가져오기
    axios.get('http://127.0.0.1:8000/api/employees?limit=100')
      .then(res => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">구성원</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          구성원 추가
        </button>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="이름, 조직, 직무 검색" 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          <Filter size={18} />
          <span>필터</span>
        </button>
      </div>

      {/* 구성원 리스트 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">이름</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">사번</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">이메일</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">전화번호</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">데이터 로딩 중...</td></tr>
            ) : employees.map((emp) => (
              <tr key={emp.EMP_ID} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">
                      <User size={16} />
                    </div>
                    <span className="font-medium text-gray-900">{emp.NAME}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.EMP_ID}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.EMAIL}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.PHONE_NUM}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
