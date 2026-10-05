import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_csv('test_split.csv')
labels = ['giai_tri', 'luu_tru', 'nha_hang', 'an_uong', 'van_chuyen', 'mua_sam']

print("="*50)
print(f"TỔNG SỐ LƯỢNG REVIEW: {len(df)}")
print("="*50)

# 2. Thống kê chi tiết từng khía cạnh
stats = []
for label in labels:
    # Lấy các dòng có nhắc đến khía cạnh này (giá trị > 0)
    active_rows = df[df[label] > 0]
    count = len(active_rows)
    
    if count > 0:
        avg_score = active_rows[label].mean()
        # Đếm chi tiết số lượng 1, 2, 3, 4, 5 sao
        stars = active_rows[label].value_counts().reindex([1, 2, 3, 4, 5], fill_value=0)
        
        stats.append({
            'Khía cạnh': label.upper(),
            'Số lượng': count,
            'Tỷ lệ (%)': round((count / len(df)) * 100, 1),
            'Điểm TB': round(avg_score, 2),
            '1 Sao': stars[1],
            '2 Sao': stars[2],
            '3 Sao': stars[3],
            '4 Sao': stars[4],
            '5 Sao': stars[5]
        })

stats_df = pd.DataFrame(stats)
print("\n1. PHÂN BỐ CÁC KHÍA CẠNH & ĐIỂM SỐ CẢM XÚC (SENTIMENT):")
print(stats_df.to_string(index=False))

# 3. Thống kê mức độ "Multi-label" (1 câu chứa mấy khía cạnh?)
df['so_khia_canh'] = (df[labels] > 0).sum(axis=1)
print("\n2. ĐỘ PHỨC TẠP CỦA REVIEW (MULTI-LABEL):")
multi_label_stats = df['so_khia_canh'].value_counts().sort_index()
for k, v in multi_label_stats.items():
    if k == 0:
        print(f"- Có {v} câu KHÔNG thuộc khía cạnh nào (Nhiễu/Unknown)")
    else:
        print(f"- Có {v} câu chứa đúng {k} khía cạnh")

# ==========================================
# 4. VẼ BIỂU ĐỒ (Lưu thành file ảnh)
# ==========================================
plt.figure(figsize=(14, 6))

# Biểu đồ 1: Số lượng review theo từng khía cạnh
plt.subplot(1, 2, 1)
sns.barplot(x='Khía cạnh', y='Số lượng', data=stats_df, palette='viridis')
plt.title('Số lượng Review theo từng Khía cạnh')
plt.xticks(rotation=45)
for i, v in enumerate(stats_df['Số lượng']):
    plt.text(i, v + 2, str(v), ha='center')

# Biểu đồ 2: Điểm trung bình theo từng khía cạnh
plt.subplot(1, 2, 2)
sns.barplot(x='Khía cạnh', y='Điểm TB', data=stats_df, palette='coolwarm')
plt.title('Điểm đánh giá trung bình')
plt.ylim(0, 5)
plt.axhline(y=3, color='r', linestyle='--', alpha=0.5) # Đường baseline 3 sao
plt.xticks(rotation=45)
for i, v in enumerate(stats_df['Điểm TB']):
    plt.text(i, v + 0.1, str(v), ha='center')

plt.tight_layout()
plt.savefig('data_distribution.png')
print("\n=> Đã lưu biểu đồ phân tích vào file 'data_distribution.png'")
print("="*50)