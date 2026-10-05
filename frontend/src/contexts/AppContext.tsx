import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface AspectResult {
  aspect: string;
  probability: number;
  star: number;
  description: string;
}

export interface AnalyzeResponse {
  aspects: AspectResult[];
}

export interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  analysis?: AnalyzeResponse;
  isLoading?: boolean;
  isGeneratingReply?: boolean;
  reply?: string;
  isErrorReply?: boolean;
}

export interface BatchSummary {
  aspect_counts: Record<string, number>;
  aspect_avg_stars: Record<string, number>;
  positive_aspects: number;
  negative_aspects: number;
}

export interface BatchItem {
  original_text: string;
  aspects: AspectResult[];
  auto_reply?: string;
  /** Chỉ có khi file CSV có cột `timestamp` (định dạng loại 2). */
  timestamp?: string;
}

export interface BatchAnalyzeResponse {
  total_processed: number;
  summary: BatchSummary;
  items: BatchItem[];
}

interface AppContextType {
  // Chat state
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  
  // Dashboard state
  dashboardFile: File | null;
  setDashboardFile: React.Dispatch<React.SetStateAction<File | null>>;
  dashboardResult: BatchAnalyzeResponse | null;
  setDashboardResult: React.Dispatch<React.SetStateAction<BatchAnalyzeResponse | null>>;
  enableAutoReply: boolean;
  setEnableAutoReply: React.Dispatch<React.SetStateAction<boolean>>;
  dashboardPage: number;
  setDashboardPage: React.Dispatch<React.SetStateAction<number>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Xin chào! 👋 Tôi là trợ lý AI phân tích đánh giá dịch vụ. Hãy nhập một đánh giá (ví dụ: "Phòng khách sạn rất sạch sẽ, nhân viên nhiệt tình nhưng đồ ăn hơi dở") để tôi phân tích nhé!'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const [dashboardFile, setDashboardFile] = useState<File | null>(null);
  const [dashboardResult, setDashboardResult] = useState<BatchAnalyzeResponse | null>(null);
  const [enableAutoReply, setEnableAutoReply] = useState(false);
  const [dashboardPage, setDashboardPage] = useState(1);

  return (
    <AppContext.Provider value={{
      messages, setMessages,
      chatInput, setChatInput,
      dashboardFile, setDashboardFile,
      dashboardResult, setDashboardResult,
      enableAutoReply, setEnableAutoReply,
      dashboardPage, setDashboardPage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
