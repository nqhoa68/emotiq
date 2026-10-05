import { Client } from "@gradio/client";
import type { AnalyzeResponse, BatchAnalyzeResponse } from '../contexts/AppContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://baoquanhihihi-viabsa-backend.hf.space';
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

// Helper function để lấy Client kèm HF Token
const getGradioClient = async () => {
  return await Client.connect(API_URL, {
    hf_token: HF_TOKEN as `hf_${string}` | undefined,
  });
};

// Xóa apiClient vì giờ đây tất cả API đều qua Gradio client

export const apiService = {
  /**
   * Phân tích câu đơn sử dụng @gradio/client
   */
  analyzeReview: async (text: string): Promise<AnalyzeResponse> => {
    const client = await getGradioClient();
    
    // Truyền mảng [text] cho positional input tương ứng với inputs=[txt_input] trong app.py
    const result = await client.predict("/analyze", [text]) as any;

    const data = result.data[0];
    
    // Nếu kết quả trả về chứa "error", quăng lỗi
    if (data && data.error) {
      throw new Error(data.error);
    }
    
    return data as AnalyzeResponse;
  },

  /**
   * Phân tích hàng loạt từ file CSV sử dụng @gradio/client
   */
  analyzeBatch: async (file: File): Promise<BatchAnalyzeResponse> => {
    const client = await getGradioClient();
    
    // @gradio/client tự động xử lý JavaScript File object
    const result = await client.predict("/batch", [file]) as any;

    const data = result.data[0];

    // Nếu kết quả trả về chứa "error", quăng lỗi
    if (data && data.error) {
      throw new Error(data.error);
    }

    return data as BatchAnalyzeResponse;
  },

  /**
   * Tạo phản hồi tự động
   * Vẫn dùng axios do endpoint này có thể chưa được expose qua Gradio block 
   * và cần truyền custom headers.
   */
  generateReply: async (reviewText: string, aspects: any[], customKey?: string) => {
    const client = await getGradioClient();

    // Gọi endpoint /generate_reply qua Gradio Client (tương ứng với inputs: Textbox, JSON, Textbox)
    const result = await client.predict("/generate_reply", [reviewText, aspects, customKey || ""]) as any;

    const data = result.data[0];
    
    if (data && data.error) {
      throw new Error(data.error);
    }

    return data;
  }
};
