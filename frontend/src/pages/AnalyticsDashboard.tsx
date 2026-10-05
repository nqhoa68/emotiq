import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, BarChart2, ThumbsUp, ThumbsDown, Download, Table, FileSpreadsheet, Sparkles } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis 
} from 'recharts';

import { useAppContext } from '../contexts/AppContext';
import DashboardTabs from '../components/DashboardTabs';
import type { DashboardTabId } from '../components/DashboardTabs';
import TimeSeriesView from '../components/TimeSeriesView';
import { enrichWithTimestamps } from '../utils/csvUtils';
import { ASPECTS_LIST, hasTimestampData } from '../utils/timeSeriesUtils';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl">
        <p className="text-slate-700 dark:text-slate-200 font-medium">{label || payload[0].name}</p>
        <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">
          {payload[0].value} {payload[0].dataKey === 'A' ? 'sao' : 'đánh giá'}
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsDashboard() {
  const { 
    dashboardFile: file, setDashboardFile: setFile,
    dashboardResult: result, setDashboardResult: setResult,
    enableAutoReply, setEnableAutoReply,
    dashboardPage: currentPage, setDashboardPage: setCurrentPage
  } = useAppContext();

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [activeFilter, setActiveFilter] = useState<{ aspect: string, star: number | null } | null>(null);
  // Tab do người dùng chọn thủ công; null = dùng tab mặc định theo dữ liệu (timestamp)
  const [selectedTab, setSelectedTab] = useState<DashboardTabId | null>(null);
  const ITEMS_PER_PAGE = 30;
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Vui lòng chỉ tải lên file .csv');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Vui lòng chỉ tải lên file .csv');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentPage(1);
    setActiveFilter(null);
    setSelectedTab(null);

    try {
      const responseData = await apiService.analyzeBatch(file);
      // Ưu tiên timestamp từ backend; nếu thiếu thì tự đọc từ CSV gốc (client-side)
      setResult(await enrichWithTimestamps(responseData, file));
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến server. Vui lòng kiểm tra backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setError(null);
    setCurrentPage(1);
    setActiveFilter(null);
    setSelectedTab(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportCSV = () => {
    if (!result) return;
    const headers = ['id', 'review_text', ...ASPECTS_LIST, 'auto_reply'];
    const rows = result.items.map((item, index) => {
      const row: any = { id: index + 1, review_text: `"${item.original_text.replace(/"/g, '""')}"`, auto_reply: `"${(item.auto_reply || '').replace(/"/g, '""')}"` };
      ASPECTS_LIST.forEach(aspect => {
        const found = item.aspects.find(a => a.aspect === aspect);
        row[aspect] = found ? found.star : 0;
      });
      return headers.map(h => row[h]).join(',');
    });
    const csvContent = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!result) return;
    const exportData = result.items.map((item, index) => {
      const row: any = { id: index + 1, review_text: item.original_text, auto_reply: item.auto_reply || '' };
      ASPECTS_LIST.forEach(aspect => {
        const found = item.aspects.find(a => a.aspect === aspect);
        row[aspect] = found ? found.star : 0;
      });
      return row;
    });
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!result) return;
    
    const data = [
      ['STT', 'Nội dung Review gốc', 'Giải trí', 'Lưu trú', 'Nhà hàng', 'Ăn uống', 'Vận chuyển', 'Mua sắm', 'Phản hồi AI']
    ];

    result.items.forEach((item, index) => {
      const rowData: any[] = [
        index + 1,
        item.original_text
      ];

      ASPECTS_LIST.forEach(aspect => {
        const found = item.aspects.find(a => a.aspect === aspect);
        rowData.push(found ? found.star : 0);
      });
      
      rowData.push(item.auto_reply || '');

      data.push(rowData);
    });

    const worksheet = utils.aoa_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Kết quả Phân tích");
    
    writeFile(workbook, "ket_qua_phan_tich_review.xlsx");
  };

  const renderStars = (star: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={i < star ? "text-amber-400" : "text-slate-600"}>★</span>
    ));
  };

  // --- Data Processors for Charts ---
  const pieData = result ? [
    { name: 'Tích cực', value: result.summary.positive_aspects, fill: '#10b981' },
    { name: 'Tiêu cực', value: result.summary.negative_aspects, fill: '#f43f5e' }
  ].filter(d => d.value > 0) : [];

  const radarData = result ? Object.entries(result.summary.aspect_avg_stars).map(([key, val]) => ({
    subject: key.toUpperCase(),
    A: val,
    fullMark: 5
  })) : [];

  const barDataByAspect: Record<string, any[]> = {};
  if (result) {
    ASPECTS_LIST.forEach(aspect => {
      barDataByAspect[aspect] = [
        { star: '1★', count: 0, fill: '#f43f5e' },
        { star: '2★', count: 0, fill: '#fb923c' },
        { star: '3★', count: 0, fill: '#fbbf24' },
        { star: '4★', count: 0, fill: '#a3e635' },
        { star: '5★', count: 0, fill: '#10b981' },
      ];
    });

    result.items.forEach(item => {
      item.aspects.forEach(a => {
        if (barDataByAspect[a.aspect] && a.star >= 1 && a.star <= 5) {
          barDataByAspect[a.aspect][a.star - 1].count += 1;
        }
      });
    });
  }

  // --- Pagination Logic ---
  const filteredItems = result 
    ? result.items.filter(item => {
        if (!activeFilter) return true;
        return item.aspects.some(a => {
          if (a.aspect !== activeFilter.aspect) return false;
          if (activeFilter.star !== null && a.star !== activeFilter.star) return false;
          return true;
        });
      })
    : [];

  const totalPages = result ? Math.ceil(filteredItems.length / ITEMS_PER_PAGE) : 0;
  const currentItems = result ? filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) : [];

  // --- Conditional Routing: phát hiện trục thời gian ---
  const hasTimeSeries = hasTimestampData(result?.items);
  // Có timestamp → mặc định Time-Series; không có → ép về Overview (Tab 1 bị disable)
  const activeTab: DashboardTabId = hasTimeSeries ? (selectedTab ?? 'timeseries') : 'overview';





  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Phân tích chuyên sâu từ dữ liệu đánh giá hàng loạt</p>
        </div>
        
        <div className="flex items-center gap-4">
          {!result && (
            <button 
              onClick={() => setEnableAutoReply(!enableAutoReply)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                enableAutoReply 
                  ? 'bg-linear-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 border-transparent' 
                  : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm dark:shadow-none'
              }`}
            >
              <Sparkles size={16} className={enableAutoReply ? 'animate-pulse' : ''} />
              Bật tự động sinh phản hồi (AI)
            </button>
          )}

          {result && (
            <div className="flex items-center gap-2">
            <button onClick={handleExportExcel} className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors shadow-sm dark:shadow-none">
              <FileSpreadsheet size={16} className="text-blue-500 dark:text-blue-400" /> Xuất Excel
            </button>
            <button onClick={handleExportCSV} className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors shadow-sm dark:shadow-none">
              <Table size={16} className="text-indigo-500 dark:text-indigo-400" /> Xuất CSV
            </button>
            <button onClick={handleExportJSON} className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors shadow-sm dark:shadow-none">
              <Download size={16} className="text-emerald-500 dark:text-emerald-400" /> Xuất JSON
            </button>
          </div>
          )}
        </div>
      </div>

      {!result ? (
        // Trạng thái 1: Chưa có dữ liệu
        <div className="flex flex-col items-center justify-center flex-1 p-8 bg-white border border-slate-200 shadow-sm rounded-xl dark:bg-[#1E293B] dark:border-none dark:shadow-none">
          <div 
            className={`w-full max-w-xl p-12 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden ${
              isDragging 
                ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.02]' 
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/5 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            
            {file ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <FileText size={40} />
                </div>
                <div>
                  <p className="text-xl font-medium text-slate-800 dark:text-slate-200">{file.name}</p>
                  <p className="text-sm text-slate-500 mt-2">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 text-sm font-medium bg-emerald-500/10 px-4 py-2 rounded-full mt-2">
                  <CheckCircle size={18} /> Sẵn sàng phân tích
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <UploadCloud size={40} />
                </div>
                <div>
                  <p className="text-xl font-medium text-slate-800 dark:text-slate-200">Kéo thả file CSV vào đây</p>
                  <p className="text-sm text-slate-500 mt-2">Hỗ trợ file định dạng .csv chuẩn UTF-8</p>
                </div>
                <button className="px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm mt-4 transition-colors border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                  Duyệt file
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 text-rose-400 bg-rose-500/10 px-4 py-3 rounded-xl border border-rose-500/20 w-full max-w-xl">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={!file || isLoading}
            className={`mt-10 flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-lg ${
              (!file || isLoading)
                ? 'bg-indigo-50 text-indigo-300 border border-indigo-100 cursor-not-allowed dark:bg-indigo-900/30 dark:text-indigo-500 dark:border-none'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 cursor-pointer'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={24} /> Đang xử lý dữ liệu...
              </>
            ) : (
              <>
                <BarChart2 size={24} /> Bắt đầu phân tích
              </>
            )}
          </button>
        </div>
      ) : (
        // Trạng thái 2: Đã có dữ liệu
        <div className="flex flex-col space-y-6 animate-in fade-in duration-700">
          
          <div className="flex items-center justify-between bg-white border border-slate-200 shadow-sm rounded-xl p-4 dark:bg-[#101b2d] dark:border-none dark:shadow-none">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <FileText className="text-indigo-500 dark:text-indigo-400" size={20} />
              <span>Đang hiển thị kết quả cho: <strong className="text-slate-800 dark:text-slate-100">{file?.name}</strong></span>
            </div>
            <button 
              onClick={handleReset} 
              className="cursor-pointer text-sm px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none"
            >
              Phân tích file khác
            </button>
          </div>

          <DashboardTabs
            activeTab={activeTab}
            onChange={setSelectedTab}
            timeSeriesEnabled={hasTimeSeries}
          />

          {activeTab === 'timeseries' ? (
            <motion.div
              key="timeseries"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <TimeSeriesView items={result.items} />
            </motion.div>
          ) : (
          <motion.div
            key="overview"
            className="flex flex-col space-y-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex items-center gap-5 dark:bg-[#101b2d] dark:border-none dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Tổng số Review</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{result.total_processed}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex items-center gap-5 dark:bg-[#101b2d] dark:border-none dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
                <ThumbsUp size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Đánh giá Tích cực</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{result.summary.positive_aspects}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex items-center gap-5 dark:bg-[#101b2d] dark:border-none dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center">
                <ThumbsDown size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Đánh giá Tiêu cực</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{result.summary.negative_aspects}</p>
              </div>
            </div>
          </div>

          {/* Top Section Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 min-h-100 flex flex-col dark:bg-[#101b2d] dark:border-none dark:shadow-none">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-lg">Điểm số trung bình (Avg Stars)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Đánh giá chung trên 6 khía cạnh</p>
              <div className="flex-1 w-full h-80">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: isDark ? '#64748b' : '#94a3b8' }} />
                      <Radar name="Điểm trung bình" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <BarChart2 size={48} className="mb-4 opacity-50" />
                    <p>Chưa có dữ liệu</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 min-h-100 flex flex-col dark:bg-[#101b2d] dark:border-none dark:shadow-none">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-lg">Tỷ lệ Tích cực / Tiêu cực</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Phân bổ dựa trên tổng số lượt đánh giá các khía cạnh</p>
              <div className="flex-1 w-full h-80">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <BarChart2 size={48} className="mb-4 opacity-50" />
                    <p>Chưa có dữ liệu</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-sm text-slate-600 dark:text-slate-300">Tích cực</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-sm text-slate-600 dark:text-slate-300">Tiêu cực</span></div>
              </div>
            </div>
          </div>

          {/* Bottom Section Charts (6 Bar Charts) */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 dark:bg-[#101b2d] dark:border-none dark:shadow-none">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-lg">Phân bổ chi tiết 6 khía cạnh</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Số lượng đánh giá theo mức độ sao (1★ - 5★)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ASPECTS_LIST.map((aspect) => {
                const data = barDataByAspect[aspect];
                const totalVotes = data.reduce((sum, item) => sum + item.count, 0);
                
                return (
                  <div 
                    key={aspect} 
                    onClick={() => { setActiveFilter({ aspect, star: null }); setCurrentPage(1); }}
                    className={`bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 flex flex-col shadow-inner dark:shadow-none cursor-pointer hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-500 transition-all ${
                      activeFilter?.aspect === aspect && activeFilter?.star === null ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 border-transparent' : 'border border-slate-200 dark:border-white/5'
                    }`}
                  >
                    <h4 className="text-slate-700 dark:text-slate-200 font-medium uppercase mb-4 text-center tracking-wider text-sm">{aspect.replace('_', ' ')}</h4>
                    <div className="flex-1 h-37.5">
                      {totalVotes > 0 ? (
                        <ResponsiveContainer width="100%" height={150}>
                          <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="star" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: isDark ? '#334155' : '#e2e8f0', opacity: 0.4 }} content={<CustomTooltip />} />
                            <Bar 
                              dataKey="count" 
                              radius={[4, 4, 0, 0]}
                              onClick={(data: any, index: number, e: any) => {
                                if (e && e.stopPropagation) {
                                  e.stopPropagation();
                                } else if (data && (data as any).stopPropagation) {
                                  (data as any).stopPropagation();
                                }
                                setActiveFilter({ aspect, star: index + 1 });
                                setCurrentPage(1);
                              }}
                            >
                              {data.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.fill} 
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                  stroke={activeFilter?.aspect === aspect && activeFilter?.star === index + 1 ? '#4f46e5' : 'transparent'}
                                  strokeWidth={activeFilter?.aspect === aspect && activeFilter?.star === index + 1 ? 2 : 0}
                                />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500/70">
                          <BarChart2 size={32} className="mb-2 opacity-50" />
                          <p className="text-xs">No data</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Table/List with Pagination */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 dark:bg-[#101b2d] dark:border-none dark:shadow-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Chi tiết từng Review</h3>
                {activeFilter && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30">
                    <span>
                      Lọc: {activeFilter.aspect.replace('_', ' ').toUpperCase()} {activeFilter.star ? `- ${activeFilter.star}★` : ''}
                    </span>
                    <button 
                      onClick={() => { setActiveFilter(null); setCurrentPage(1); }}
                      className="ml-1 hover:text-indigo-900 dark:hover:text-indigo-100 p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-500/40 transition-colors"
                      title="Xóa bộ lọc"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Hiển thị trang {currentPage} / {totalPages} (Tổng: {filteredItems.length})
              </span>
            </div>
            
            <div className="space-y-4">
              {currentItems.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:border-none dark:shadow-none dark:hover:bg-slate-700/60">
                  <p className="text-slate-700 italic dark:text-slate-300 text-sm mb-4 leading-relaxed">"{item.original_text}"</p>
                  {item.aspects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.aspects.map((aspect, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2 bg-white dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
                          <span className="text-xs uppercase font-semibold text-indigo-600 dark:text-indigo-300">{aspect.aspect}</span>
                          <div className="flex text-[10px] tracking-widest ml-1">{renderStars(aspect.star)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 inline-block mb-1">
                      Không phát hiện khía cạnh
                    </span>
                  )}
                  
                  {item.auto_reply && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                      <div className={`flex items-center gap-2 text-xs font-semibold mb-2 uppercase tracking-wider ${item.auto_reply.startsWith('⚠️') ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {item.auto_reply.startsWith('⚠️') ? <AlertCircle size={14} /> : <Sparkles size={14} />}
                        {item.auto_reply.startsWith('⚠️') ? 'Lỗi Phản hồi AI' : 'AI Phản hồi tự động'}
                      </div>
                      <div className={`text-sm p-4 rounded-xl leading-relaxed border ${item.auto_reply.startsWith('⚠️') ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-200/90' : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-200/90'}`}>
                        {item.auto_reply.startsWith('⚠️') ? item.auto_reply.replace(/^⚠️\s*/, '') : item.auto_reply}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
                >
                  Trang trước
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    // Only show first, last, and pages around current page
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                            currentPage === page 
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 || 
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="text-slate-500 text-sm">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
          </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
