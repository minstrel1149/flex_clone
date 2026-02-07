import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { 
  BarChart2, 
  Filter, 
  Table as TableIcon,
  Info
} from 'lucide-react';

interface ProposalGroups {
  [key: string]: string[];
}

interface ProposalTitles {
  [key: string]: string;
}

interface ViewData {
  type: 'single' | 'tabs';
  fig?: any;
  df?: any[];
  df_columns?: string[];
  tabs?: {
    label: string;
    fig: any;
    df: any[];
  }[];
}

export function Insight() {
  const [groups, setGroups] = useState<ProposalGroups>({});
  const [titles, setTitles] = useState<ProposalTitles>({});
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [drilldowns, setDrilldowns] = useState<string[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<string>('개요');
  const [selectedProposal, setSelectedProposal] = useState<string>('개요');
  const [selectedDimension, setSelectedDimension] = useState<string>('전체');
  const [selectedDrilldown, setSelectedDrilldown] = useState<string>('전체');

  const [viewData, setViewData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Initial Load: Groups and Titles
  useEffect(() => {
    axios.get('http://localhost:8000/api/insight/groups')
      .then(res => {
        setGroups(res.data.groups);
        setTitles(res.data.titles);
      })
      .catch(err => console.error('Failed to load groups', err));
  }, []);

  // When Proposal changes, fetch Dimensions
  useEffect(() => {
    if (selectedProposal && selectedProposal !== '개요') {
      axios.get(`http://localhost:8000/api/insight/dimensions/${selectedProposal}`)
        .then(res => {
          setDimensions(res.data.options);
          // Reset dimension if not in new options
          if (!res.data.options.includes(selectedDimension)) {
            setSelectedDimension(res.data.options[0] || '전체');
          }
        });
    } else {
      setDimensions(['개요', '전체']);
    }
  }, [selectedProposal]);

  // When Dimension changes, fetch Drilldowns
  useEffect(() => {
    if (selectedProposal && selectedProposal !== '개요' && selectedDimension) {
      axios.get(`http://localhost:8000/api/insight/drilldown/${selectedProposal}/${selectedDimension}`)
        .then(res => {
          setDrilldowns(res.data.options);
          setSelectedDrilldown('전체');
        });
    } else {
      setDrilldowns(['전체']);
    }
  }, [selectedProposal, selectedDimension]);

  // Fetch View Data
  useEffect(() => {
    if (selectedProposal && selectedProposal !== '개요') {
      setLoading(true);
      axios.get(`http://localhost:8000/api/insight/view/${selectedProposal}`, {
        params: {
          dimension: selectedDimension,
          drilldown: selectedDrilldown
        }
      })
      .then(res => {
        setViewData(res.data);
        setActiveTab(0);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load view data', err);
        setLoading(false);
      });
    } else {
      setViewData(null);
    }
  }, [selectedProposal, selectedDimension, selectedDrilldown]);

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const group = e.target.value;
    setSelectedGroup(group);
    setSelectedProposal('개요');
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const columns = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col} className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                    {typeof row[col] === 'number' ? row[col].toLocaleString() : row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <BarChart2 size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">인사 인사이트</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">데이터 시각화 및 분석</h1>
      </div>

      {/* Filter Panel */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 ml-1">1. 그룹 살펴보기</label>
          <select 
            value={selectedGroup} 
            onChange={handleGroupChange}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {Object.keys(groups).map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 ml-1">2. 제안 살펴보기</label>
          <select 
            value={selectedProposal} 
            onChange={(e) => setSelectedProposal(e.target.value)}
            disabled={selectedGroup === '개요'}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
          >
            <option value="개요">-- 제안 선택 --</option>
            {(groups[selectedGroup] || []).map(p => (
              <option key={p} value={p}>{titles[p] || p}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 ml-1">3. 구분 (차원)</label>
          <select 
            value={selectedDimension} 
            onChange={(e) => setSelectedDimension(e.target.value)}
            disabled={selectedProposal === '개요'}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
          >
            {dimensions.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 ml-1">4. 하위구분</label>
          <select 
            value={selectedDrilldown} 
            onChange={(e) => setSelectedDrilldown(e.target.value)}
            disabled={selectedProposal === '개요' || selectedDimension === '개요'}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
          >
            {drilldowns.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {selectedProposal === '개요' ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-6">
              <Filter size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">분석할 제안을 선택해 주세요</h2>
            <p className="text-gray-500 max-w-md">상단 필터에서 그룹을 먼저 선택한 후, 구체적인 분석 제안을 선택하시면 실시간 시각화 데이터를 확인하실 수 있습니다.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : viewData ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {titles[selectedProposal]} 
                <span className="text-gray-400 font-normal ml-2">({selectedDimension}{selectedDrilldown !== '전체' ? ` - ${selectedDrilldown}` : ''})</span>
              </h2>
            </div>

            {viewData.type === 'tabs' && viewData.tabs ? (
              <div className="space-y-4">
                <div className="flex border-b border-gray-200">
                  {viewData.tabs.map((tab, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(idx)}
                      className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === idx 
                          ? 'border-indigo-600 text-indigo-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="pt-4 space-y-8">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                    {viewData.tabs[activeTab].fig ? (
                      <Plot
                        data={viewData.tabs[activeTab].fig.data}
                        layout={{
                          ...viewData.tabs[activeTab].fig.layout,
                          autosize: true,
                          width: undefined,
                          height: 600,
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                        }}
                        useResizeHandler={true}
                        style={{ width: "100%", height: "100%" }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-gray-400">
                        해당 기간의 시각화 데이터가 없습니다.
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-800 font-bold">
                      <TableIcon size={18} />
                      <span>상세 데이터 테이블</span>
                    </div>
                    {renderTable(viewData.tabs[activeTab].df)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                  {viewData.fig ? (
                    <Plot
                      data={viewData.fig.data}
                      layout={{
                        ...viewData.fig.layout,
                        autosize: true,
                        width: undefined,
                        height: 600,
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                      }}
                      useResizeHandler={true}
                      style={{ width: "100%", height: "100%" }}
                      config={{ responsive: true, displayModeBar: false }}
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-400">
                      시각화 데이터를 생성할 수 없습니다.
                    </div>
                  )}
                </div>
                
                {viewData.df && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-800 font-bold">
                      <TableIcon size={18} />
                      <span>상세 데이터 테이블</span>
                    </div>
                    {renderTable(viewData.df)}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            데이터를 불러오는 중 오류가 발생했거나 데이터가 없습니다.
          </div>
        )}
      </div>

      {/* Footer / Tip */}
      <div className="p-4 bg-indigo-50 border-t border-indigo-100 flex items-start gap-3">
        <Info className="text-indigo-500 shrink-0 mt-0.5" size={18} />
        <div className="text-xs text-indigo-700 leading-relaxed">
          <strong>Tip:</strong> 인사이트 탭에서는 다양한 통계 모델을 활용하여 조직의 건강도와 성장성을 다각도로 분석합니다. 
          차트 내의 범례를 클릭하여 특정 항목을 숨기거나 강조할 수 있으며, 데이터 테이블을 통해 구체적인 수치를 확인할 수 있습니다.
        </div>
      </div>
    </div>
  );
}
