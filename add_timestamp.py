import pandas as pd
import random
from datetime import datetime, timedelta

# Định nghĩa các khoảng thời gian sự kiện năm 2023
events = {
    'baseline': (datetime(2023, 4, 1), datetime(2023, 11, 30)),       # Ngày bình thường
    'holiday_30_4': (datetime(2023, 4, 28), datetime(2023, 5, 3)),    # Lễ 30/4 - 1/5
    'blackout': (datetime(2023, 5, 25), datetime(2023, 6, 15)),       # Mất điện miền Bắc
    'blackpink': (datetime(2023, 7, 28), datetime(2023, 8, 1)),       # Concert Blackpink
    'ghost_month': (datetime(2023, 8, 16), datetime(2023, 9, 14))     # Tháng cô hồn :))
}

def get_random_date(start_date, end_date):
    """Sinh thời gian ngẫu nhiên giữa 2 mốc"""
    delta = end_date - start_date
    random_second = random.randint(0, int(delta.total_seconds()))
    return start_date + timedelta(seconds=random_second)

def assign_event_time(row):
    """Logic gán mốc thời gian dựa trên đặc trưng của review"""
    
    # 1. Kịch bản Mất điện (Tháng 5-6): Lưu trú & Nhà hàng nhận 1-2 sao
    if row['luu_tru'] in [1, 2] or row['nha_hang'] in [1, 2]:
        if random.random() < 0.7:  # 70% rơi vào đợt mất điện
            return get_random_date(*events['blackout'])
        else:                      # 30% rơi vào quá tải dịp lễ 30/4
            return get_random_date(*events['holiday_30_4'])

    # 2. Kịch bản Quá tải giao thông / Đi lại chật vật: Vận chuyển 1-2 sao
    if row['van_chuyen'] in [1, 2]:
        if random.random() < 0.5:
            return get_random_date(*events['holiday_30_4'])
        else:
            return get_random_date(*events['blackpink'])

    # 3. Kịch bản Concert Blackpink: Giải trí bùng nổ 4-5 sao
    if row['giai_tri'] in [4, 5]:
        if random.random() < 0.4:  # 40% gom vào 4 ngày concert
            return get_random_date(*events['blackpink'])

    # 4. Kịch bản Tháng cô hồn: Khách ít đi chơi, chủ yếu đi ăn uống nhẹ nhàng (4-5 sao)
    if row['an_uong'] in [4, 5] and row['giai_tri'] == 0 and row['luu_tru'] == 0:
        if random.random() < 0.15: # Lọc một phần nhỏ vào vùng trũng
            return get_random_date(*events['ghost_month'])

    # 5. Baseline: Các câu review khen ngợi bình thường hoặc không dính điều kiện trên
    # Sẽ được rải đều ngẫu nhiên trong suốt 8 tháng
    return get_random_date(*events['baseline'])

# ----------------- THỰC THI -----------------

df = pd.read_csv('test_split.csv')                                          # Đọc file CSV
df['timestamp'] = df.apply(assign_event_time, axis=1)                       # Áp dụng logic gán thời gian cho từng dòng
df = df.sort_values(by='timestamp', ascending=True).reset_index(drop=True)  # Sắp xếp thời gian từ cũ nhất đến mới nhất
df.insert(0, 'id', df.index + 1)                                            # Tạo cột ID bắt đầu từ 1
df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')          # Format lại cột datetime thành chuỗi chuẩn ISO 8601 dễ đọc

# Sắp xếp lại thứ tự các cột cho chuẩn form
cols = ['id', 'timestamp', 'Review', 'giai_tri', 'luu_tru', 'nha_hang', 'an_uong', 'van_chuyen', 'mua_sam']
df = df[cols]

# Xuất file mới
output_file = 'reviews_time_series.csv'
df.to_csv(output_file, index=False, encoding='utf-8-sig')

print(f"✅ Đã xử lý xong {len(df)} dòng dữ liệu.")
print(f"⏳ Cũ nhất: {df['timestamp'].iloc[0]}")
print(f"⌛ Mới nhất: {df['timestamp'].iloc[-1]}")
print(f"📁 Lưu tại: {output_file}")
