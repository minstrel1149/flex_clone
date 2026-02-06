import { X, Calendar, DollarSign, Download, Printer } from 'lucide-react';

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export function PayrollModal({ isOpen, onClose, data }: PayrollModalProps) {
  if (!isOpen || !data) return null;

  // Group items by category
  const groupedItems = data.items?.reduce((acc: any, item: any) => {
    const cat = item.PAYROLL_ITEM_CATEGORY || '기타';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = groupedItems ? Object.keys(groupedItems) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
               <Calendar size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-900">{data.pay_period} 급여명세서</h2>
               <p className="text-sm text-gray-500">지급일: {data.pay_date}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Total Summary */}
          <div className="bg-indigo-50 rounded-xl p-6 flex justify-between items-center">
             <div>
               <p className="text-sm text-indigo-600 font-medium mb-1">실수령액</p>
               <h3 className="text-3xl font-bold text-indigo-900">
                 {data.total_pay?.toLocaleString()}원
               </h3>
             </div>
             <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700">
               <DollarSign size={24} />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map(cat => (
               <div key={cat} className="space-y-4">
                 <h4 className="text-sm font-bold text-gray-500 uppercase border-b border-gray-200 pb-2">{cat}</h4>
                 <div className="space-y-3">
                   {groupedItems[cat].map((item: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center text-sm">
                       <span className="text-gray-600">{item.PAYROLL_ITEM_NAME}</span>
                       <span className="font-medium text-gray-900">{Number(item.PAY_AMOUNT).toLocaleString()}원</span>
                     </div>
                   ))}
                   {/* Subtotal for category if needed */}
                 </div>
               </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-2xl">
           <div className="flex gap-2">
             <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
               <Printer size={16} /> 인쇄
             </button>
             <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
               <Download size={16} /> 다운로드
             </button>
           </div>
           <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
             확인
           </button>
        </div>

      </div>
    </div>
  );
}
