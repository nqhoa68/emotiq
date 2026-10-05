
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import GlobalLayout from './layouts/GlobalLayout';
import LandingPage from './pages/LandingPage';
import ChatView from './pages/ChatView';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';

function AnimatedRoutes() {
  const location = useLocation();
  // Gom chung key cho các route nằm trong GlobalLayout để không bị unmount Layout khi chuyển tab
  const isAppRoute = location.pathname.startsWith('/chat') || location.pathname.startsWith('/dashboard');
  const routeKey = isAppRoute ? 'app-layout' : location.pathname;
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
        {/* Landing Page đứng độc lập */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Layout chính bọc các trang con */}
        <Route element={<GlobalLayout />}>
          <Route path="/chat" element={<ChatView />} />
          <Route path="/dashboard" element={<AnalyticsDashboard />} />
        </Route>
        
        {/* Bắt lỗi 404 hoặc redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
