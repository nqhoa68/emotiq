import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Send, User, MessageSquare, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
  PieChart, Pie, Cell, Tooltip 
} from 'recharts';
import ftuLogo from '../assets/FTU-logo.png';
import ThemeToggle from '../components/ThemeToggle';

// Mock Data cho Dashboard
const radarData = [
  { subject: 'GIẢI TRÍ', score: 4.5, fullMark: 5 },
  { subject: 'LƯU TRÚ', score: 5.0, fullMark: 5 },
  { subject: 'NHÀ HÀNG', score: 2.0, fullMark: 5 },
  { subject: 'ĂN UỐNG', score: 3.5, fullMark: 5 },
  { subject: 'VẬN CHUYỂN', score: 4.0, fullMark: 5 },
  { subject: 'MUA SẮM', score: 4.8, fullMark: 5 },
];

const pieData = [
  { name: 'Tích cực', value: 75 },
  { name: 'Tiêu cực', value: 25 },
];
const COLORS = ['#22c55e', '#ef4444']; // Xanh lá, Đỏ

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { type: 'spring', stiffness: 70, damping: 15 }
  },
};

const mockupVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.3 } }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeMock, setActiveMock] = useState<'chat' | 'dashboard'>('chat');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveMock((prev) => (prev === 'chat' ? 'dashboard' : 'chat'));
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 lg:p-8 overflow-hidden relative selection:bg-indigo-500/30"
    >
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 lg:top-10 lg:right-10 z-50">
        <ThemeToggle />
      </div>

      {/* Background Glows */}
      <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="hidden dark:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 12-Column Grid Container */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* CỘT TRÁI (5 phần): Hero Text & CTA */}
        <div className="lg:col-span-5 flex flex-col items-start text-left space-y-8">
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg overflow-hidden bg-slate-900 dark:bg-white/5">
              <img src={ftuLogo} alt="FTU Logo" className="w-full h-full object-cover scale-100" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              Emotiq AI
            </span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-4xl lg:text-5xl font-extrabold uppercase tracking-tight leading-tight"
          >
            <span className="bg-linear-to-r from-purple-500 via-indigo-500 to-blue-500 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent drop-shadow-sm block mb-2 pt-1">
              NỀN TẢNG PHÂN TÍCH PHẢN HỒI
            </span>
            <span className="text-slate-900 dark:text-white block">
              khách hàng về chất lượng dịch vụ doanh nghiệp
            </span>
            <span className="text-slate-500 dark:text-gray-400 block mt-2 text-2xl lg:text-3xl font-bold">
              dựa trên thang đo sao
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg"
          >
            Ứng dụng sức mạnh của mô hình <strong>PhoBERT</strong> và <strong>Google Generative AI</strong> để tự động nhận diện khía cạnh đánh giá và tạo phản hồi chuyên nghiệp, giúp nâng tầm dịch vụ chăm sóc khách hàng.
          </motion.p>

          <motion.div variants={itemVariants} className="pt-4">
            <button
              onClick={() => navigate('/chat')}
              className="group relative flex items-center gap-3 px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 rounded-full text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] overflow-hidden cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                Bắt đầu <Zap className="w-5 h-5 group-hover:animate-pulse" />
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </motion.div>
        </div>

        {/* CỘT PHẢI (7 phần): Interactive Mockup */}
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-7 w-full h-137.5 flex flex-col bg-white shadow-2xl shadow-slate-300/60 border border-slate-200 rounded-2xl dark:bg-[#1E293B] dark:border-none dark:shadow-none overflow-hidden relative backdrop-blur-xl"
        >
          {/* Mockup Header & Buttons */}
          <div className="h-14 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 bg-slate-100/50 dark:bg-slate-950/50">
            {/* macOS window dots */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            
            {/* 2 Buttons to switch mockups */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <button
                onClick={() => {
                  setActiveMock('chat');
                  setIsAutoPlaying(false);
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  activeMock === 'chat' 
                    ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-white dark:shadow-none' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare size={16} />
                Chat
              </button>
              <button
                onClick={() => {
                  setActiveMock('dashboard');
                  setIsAutoPlaying(false);
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  activeMock === 'dashboard' 
                    ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-white dark:shadow-none' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
            </div>
          </div>

          {/* Mockup Content */}
          <div className="flex-1 relative overflow-hidden bg-linear-to-b from-transparent to-slate-100/30 dark:to-slate-950/30">
            <AnimatePresence mode="wait">
              {activeMock === 'chat' ? (
                <motion.div 
                  key="chat"
                  variants={mockupVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col">
                    {/* User Message */}
                    <div className="flex gap-4 self-end flex-row-reverse max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                        <User size={16} className="text-slate-300" />
                      </div>
                      <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md">
                        <p className="text-sm">Phòng khách sạn sạch sẽ, nhưng đồ ăn nhà hàng hơi dở.</p>
                      </div>
                    </div>
                    {/* AI Message */}
                    <div className="flex gap-4 self-start max-w-[95%] sm:max-w-[90%]">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg overflow-hidden bg-slate-900 dark:bg-white/5">
                        <img src={ftuLogo} alt="AI" className="w-full h-full object-cover scale-110" />
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-indigo-500/30 text-slate-700 dark:text-slate-200 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm dark:shadow-lg">
                        <p className="text-sm leading-relaxed">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold block mb-2">Phân tích khía cạnh:</span>
                          • LUU_TRU: <span className="text-emerald-500 dark:text-green-400 font-medium">5 sao</span> (Tích cực)<br/>
                          • NHA_HANG: <span className="text-rose-500 dark:text-red-400 font-medium">2 sao</span> (Tiêu cực)<br/>
                          <span className="text-slate-500 dark:text-slate-300 italic block mt-3 text-sm border-t border-slate-200 dark:border-slate-700/50 pt-3">
                            "Cảm ơn bạn đã chia sẻ trải nghiệm. Chúng tôi rất vui vì bạn hài lòng với phòng ngủ. Tuy nhiên, chúng tôi thành thật xin lỗi vì chất lượng món ăn chưa đáp ứng kỳ vọng. Đội ngũ nhà hàng đã ghi nhận góp ý này để cải thiện. Mong được đón tiếp bạn lần sau với trải nghiệm trọn vẹn hơn!"
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Mock Input */}
                  <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/80">
                    <div className="relative">
                      <input 
                        type="text" 
                        readOnly
                        placeholder="Nhập review..." 
                        className="w-full bg-white dark:bg-slate-950 border border-slate-100 shadow-sm dark:border-white/10 rounded-full py-3 pl-5 pr-12 text-sm text-slate-800 dark:text-slate-300 focus:outline-none cursor-default"
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white cursor-default opacity-50">
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="dashboard"
                  variants={mockupVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
                >
                  {/* Radar Chart */}
                  <div className="bg-white border border-slate-100 shadow-sm rounded-xl dark:bg-slate-800 dark:border-white/5 dark:shadow-none p-4 h-full flex flex-col">
                    <h3 className="text-slate-800 dark:text-white font-medium text-sm mb-2 text-center">Điểm số theo khía cạnh</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke={isDark ? "#334155" : "#e2e8f0"} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                          <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                          <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '8px', color: isDark ? '#fff' : '#1e293b' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Donut Chart */}
                  <div className="bg-white border border-slate-100 shadow-sm rounded-xl dark:bg-slate-800 dark:border-white/5 dark:shadow-none p-4 h-full flex flex-col">
                    <h3 className="text-slate-800 dark:text-white font-medium text-sm mb-2 text-center">Tỷ lệ sắc thái</h3>
                    <div className="flex-1 min-h-0 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '8px', color: isDark ? '#fff' : '#1e293b' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Inner text for Donut */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">100</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Reviews</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
