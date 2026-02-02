import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  Settings, 
  Briefcase,
  DollarSign,
  BarChart2
} from 'lucide-react';

const MENU_ITEMS = [
  { path: '/', label: '홈', icon: Home },
  { path: '/members', label: '구성원', icon: Users },
  { path: '/work', label: '근무', icon: Clock },
  { path: '/leaves', label: '휴가', icon: Calendar },
  { path: '/payroll', label: '급여정산', icon: DollarSign },
  { path: '/documents', label: '문서', icon: FileText },
  { path: '/insights', label: '인사이트', icon: BarChart2 },
  { path: '/recruit', label: '채용', icon: Briefcase },
  { path: '/settings', label: '설정', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-10">
      {/* 로고 영역 */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">F</div>
          <span>flex</span>
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단 프로필 영역 (간단하게) */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm font-bold">
            ME
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">관리자</p>
            <p className="text-xs text-gray-500">admin@flex.clone</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
