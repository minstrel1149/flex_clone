import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

// --- Types ---
interface Doc {
  DOC_ID: string;
  EMP_ID: string;
  DOC_TYPE: string;
  TITLE: string;
  CONTENT: string;
  STATUS: string; // Pending, Approved, Rejected
  CREATED_AT: string;
  COMPLETED_AT: string;
  // For inbox
  MY_STATUS?: string; 
}

const CURRENT_USER_ID = "E00002"; 

export function Documents() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('outbox');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    type: '품의서',
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchDocs();
  }, [activeTab]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'inbox' 
        ? `http://localhost:8000/api/documents/to-approve/${CURRENT_USER_ID}`
        : `http://localhost:8000/api/documents/my-drafts/${CURRENT_USER_ID}`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.title || !createForm.content) return alert('내용을 입력해주세요.');
    try {
      await fetch('http://localhost:8000/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: CURRENT_USER_ID,
          doc_type: createForm.type,
          title: createForm.title,
          content: createForm.content,
          approver_id: 'E00001' // Hardcoded Approver
        })
      });
      alert('기안되었습니다.');
      setIsCreateModalOpen(false);
      setCreateForm({ type: '품의서', title: '', content: '' });
      fetchDocs();
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;
    if (!confirm('승인하시겠습니까?')) return;
    try {
      await fetch('http://localhost:8000/api/documents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id: selectedDoc.DOC_ID,
          approver_id: CURRENT_USER_ID,
          comment: '승인합니다.'
        })
      });
      alert('승인되었습니다.');
      setSelectedDoc(null);
      fetchDocs();
    } catch (e) { alert('오류가 발생했습니다.'); }
  };

  const handleReject = async () => {
    if (!selectedDoc) return;
    const reason = prompt('반려 사유를 입력해주세요.');
    if (reason === null) return; // Cancel
    
    try {
      await fetch('http://localhost:8000/api/documents/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id: selectedDoc.DOC_ID,
          approver_id: CURRENT_USER_ID,
          comment: reason
        })
      });
      alert('반려되었습니다.');
      setSelectedDoc(null);
      fetchDocs();
    } catch (e) { alert('오류가 발생했습니다.'); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">승인 완료</span>;
      case 'Rejected': return <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">반려됨</span>;
      default: return <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">결재 대기</span>;
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">문서 (전자결재)</h1>
          <p className="text-gray-500 text-sm mt-1">전자결재 문서를 기안하고 관리합니다.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus size={20} /> 새 문서 기안
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
            <button 
                onClick={() => setActiveTab('outbox')}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'outbox' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                내 문서함 (기안)
                {activeTab === 'outbox' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('inbox')}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'inbox' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                결재 대기함
                {activeTab === 'inbox' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
            </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">종류</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">제목</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">기안일</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">상태</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {loading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>
                ) : docs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">문서가 없습니다.</td></tr>
                ) : (
                    docs.map((doc) => (
                        <tr key={doc.DOC_ID} onClick={() => setSelectedDoc(doc)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                            <td className="px-6 py-4 text-sm text-gray-600">{doc.DOC_TYPE}</td>
                            <td className="px-6 py-4 font-bold text-gray-900">{doc.TITLE}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{doc.CREATED_AT}</td>
                            <td className="px-6 py-4 text-center">
                                {getStatusBadge(doc.STATUS)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <ChevronRight className="inline-block text-gray-300 group-hover:text-indigo-500 transition-colors" size={20} />
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
         </table>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <FileText className="text-indigo-600" />
                    새 문서 기안
                </h2>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">문서 종류</label>
                            <select 
                                value={createForm.type}
                                onChange={e => setCreateForm({...createForm, type: e.target.value})}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="품의서">품의서</option>
                                <option value="지출결의서">지출결의서</option>
                                <option value="휴가신청서">휴가신청서</option>
                                <option value="시말서">시말서</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">결재자</label>
                            <input type="text" value="관리자 (자동 지정)" disabled className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">제목</label>
                        <input 
                            type="text" 
                            value={createForm.title}
                            onChange={e => setCreateForm({...createForm, title: e.target.value})}
                            placeholder="문서 제목을 입력하세요"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">내용</label>
                        <textarea 
                            value={createForm.content}
                            onChange={e => setCreateForm({...createForm, content: e.target.value})}
                            placeholder="상세 내용을 입력하세요..."
                            className="w-full p-3 border border-gray-200 rounded-xl h-48 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">취소</button>
                    <button onClick={handleCreate} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-colors">기안하기</button>
                </div>
            </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedDoc(null)}>
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                    <div>
                        <span className="inline-block px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-500 mb-2">{selectedDoc.DOC_TYPE}</span>
                        <h2 className="text-xl font-bold text-gray-900">{selectedDoc.TITLE}</h2>
                        <p className="text-sm text-gray-500 mt-1">기안일: {selectedDoc.CREATED_AT}</p>
                    </div>
                    <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[200px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedDoc.CONTENT}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500">현재 상태:</span>
                        {getStatusBadge(selectedDoc.STATUS)}
                    </div>

                    {activeTab === 'inbox' && selectedDoc.STATUS === 'Pending' && (
                        <div className="flex gap-2">
                            <button onClick={handleReject} className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors">반려</button>
                            <button onClick={handleApprove} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">승인</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
