import { useState, useEffect } from 'react';
import { X, Key, Save, Trash2, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('gemini_custom_api_key');
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_custom_api_key', apiKey.trim());
      setToastMessage('Đã lưu API Key thành công!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_custom_api_key');
    setApiKey('');
    setToastMessage('Đã xóa API Key!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Key size={18} className="text-indigo-500 dark:text-indigo-400" />
            Cài đặt API Key
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Nhập Gemini API Key của riêng bạn để sử dụng tính năng AI. Key này được lưu trữ an toàn ngay trên trình duyệt của bạn và gửi trực tiếp tới máy chủ.
          </p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gemini API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm shadow-inner dark:shadow-none"
              />
            </div>
          </div>
          
          {showToast && (
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
              <CheckCircle2 size={16} />
              {toastMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3">
          {apiKey && (
            <button 
              onClick={handleClear}
              className="px-4 py-2 flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
            >
              <Trash2 size={16} /> Xóa
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-5 py-2 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Save size={16} /> Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}
