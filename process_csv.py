import pandas as pd

# Đọc file gốc và chỉ lấy 3 cột đầu tiên
df = pd.read_csv("reviews_time_series.csv", usecols=[0, 1, 2])

# Lưu sang file mới
df.to_csv("test.csv", index=False)