import { X, User, Mail, Phone, MapPin, Calendar, Briefcase, Hash, Target } from 'lucide-react';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
}

export function MemberModal({ isOpen, onClose, member }: MemberModalProps) {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* 헤더 */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {member.NAME?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{member.NAME}</h2>
              <p className="text-gray-500">{member.ENG_NAME} ({member.NICKNAME || '별명 없음'})</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 space-y-8">
          
          {/* 조직 정보 섹션 */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">조직 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <InfoItem icon={Briefcase} label="부서" value={member.DEPT_NAME || '미배정'} />
              <InfoItem icon={Target} label="직무" value={member.JOB_NAME || '미배정'} />
              <InfoItem icon={User} label="직위" value={member.POSITION_NAME || '미배정'} />
              <InfoItem icon={Hash} label="사번" value={member.EMP_ID} />
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 인사 정보 섹션 */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">인사 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <InfoItem icon={Calendar} label="입사일" value={member.IN_DATE} />
              <InfoItem icon={Calendar} label="그룹 입사일" value={member.GROUP_IN_DATE} />
              <InfoItem icon={User} label="재직 상태" value={member.CURRENT_EMP_YN === 'Y' ? '재직' : '퇴사'} />
              {member.OUT_DATE && <InfoItem icon={Calendar} label="퇴사일" value={member.OUT_DATE} />}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 연락처 정보 섹션 */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">연락처 및 개인정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <InfoItem icon={Mail} label="이메일" value={member.EMAIL} />
              <InfoItem icon={Phone} label="전화번호" value={member.PHONE_NUM} />
              <div className="col-span-2">
                 <InfoItem icon={MapPin} label="주소" value={member.ADDRESS} />
              </div>
            </div>
          </section>
        </div>

        {/* 푸터 (액션 버튼) */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            닫기
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            정보 수정
          </button>
        </div>

      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-all">{value || '-'}</p>
      </div>
    </div>
  );
}