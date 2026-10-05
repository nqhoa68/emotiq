#!/usr/bin/env python3
"""
Real-time Inference Script: Continuous evaluation of Vietnamese service reviews.
Press Ctrl+C to exit safely.
"""

import sys
from config.settings import ASPECT_COLS, STAR_DESC
from services.inference import SentimentPredictor

def main():
    try:
        predictor = SentimentPredictor()
    except FileNotFoundError as e:
        print(e)
        return
        
    print("✅ Hệ thống Emotiq đã sẵn sàng nhận diện thực tế!")
    print("=" * 80)
    print("💡 HƯỚNG DẪN: Nhập đoạn review tiếng Việt của bạn vào prompt bên dưới và nhấn Enter.")
    print("🛑 Nhấn tổ hợp phím [Ctrl + C] bất kỳ lúc nào để thoát khỏi chương trình.")
    print("=" * 80)

    # Vòng lặp lắng nghe Real-time
    try:
        while True:
            raw_input = input("\n📝 Nhập câu review của khách hàng: ").strip()
            
            if not raw_input:
                print("⚠️ Câu nhập rỗng, vui lòng nhập lại.")
                continue
                
            # Thực hiện suy luận
            cleaned_input, aspect_probs, sentiment_preds = predictor.predict(raw_input)
            
            # Kết xuất báo cáo phân tích
            print("\n📊 KẾT QUẢ PHÂN TÍCH (REAL-TIME REPORT):")
            print("-" * 65)
            print(f"  • Chuỗi xử lý hệ thống: \"{cleaned_input}\"")
            print("-" * 65)
            
            any_aspect_detected = False
            for idx, aspect_name in enumerate(ASPECT_COLS):
                prob = aspect_probs[idx]
                
                # Ngưỡng threshold quyết định sự tồn tại là >= 0.5
                if prob >= 0.5:
                    any_aspect_detected = True
                    star = sentiment_preds[idx]
                    star_desc = STAR_DESC.get(star, "")
                    
                    print(
                        f"   ➔ KHÍA CẠNH: [{aspect_name:<11}] | "
                        f"Xác suất: {prob*100:6.2f}% ➔ Đánh giá: {star} Sao ({star_desc})"
                    )
            
            if not any_aspect_detected:
                print("   ❓ Hệ thống không nhận diện được khía cạnh liên quan nào (Tất cả nhãn đều bằng 0).")
            print("-" * 65)

    except KeyboardInterrupt:
        print("\n\n🛑 Đã dừng!")
        sys.exit(0)

if __name__ == "__main__":
    main()