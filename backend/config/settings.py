import os

# Base directory for the backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Model Configuration
MODEL_NAME = "vinai/phobert-base-v2"
MAX_LENGTH = 256
# Đường dẫn trên Hugging Face Model Hub chứa file weights (~550MB) của bạn
HF_MODEL_REPO = "baoquanhihihi/ViABSA-PhoBERT-Model"
HF_WEIGHTS_FILENAME = "best_model_fold_4.pth"

ASPECT_COLS = ("giai_tri", "luu_tru", "nha_hang", "an_uong", "van_chuyen", "mua_sam")

# Dictionaries for Preprocessing
TEENCODE_DICT = {
    "ksan": "khách sạn", "ks": "khách sạn", "khách san": "khách sạn",
    "nv": "nhân viên", "pv": "phục vụ", "staff": "nhân viên",
    "mng": "mọi người", "mn": "mọi người",
    "ko": "không", "khum": "không", "k": "không", "koo": "không",
    "đc": "được", "dc": "được", "j": "gì", "gđ": "gia đình", "t": "tôi",
    "thg": "thường", "bth": "bình thường", "ncl": "nói chung là",
    "vs": "với", "vsinh": "vệ sinh", "chưởi": "chửi", "v*i": "vãi", "vãi": "rất",
    "tuyoi": "tươi", "tuoi": "tươi", "ngòn": "ngon", "p": "phút",
}

EMOJI_DICT = {
    "😆": " vui vẻ ", "😊": " hài lòng ", "😍": " tuyệt vời ", "🥰": " yêu thích ",
    "🤤": " ngon lành ", "🤩": " xuất sắc ", "👍": " tốt ", "👌": " đồng ý ",
    "😅": " bối rối ", "🤣": " buồn cười ", "😂": " buồn cười ",
    "😡": " tồi tệ tức giận ", "😠": " khó chịu bực mình ", " dở ": " không ngon ",
    "😥": " thất vọng buồn ", "😞": " thất vọng ", "😱": " kinh ngạc ",
    "🤢": " tồi tệ ", "🤮": " quá tệ ", "😷": " kém kém "
}

# Star Descriptions
STAR_DESC = {
    1: "Rất không hài lòng 😡", 
    2: "Không hài lòng 😠", 
    3: "Trung bình 😐", 
    4: "Hài lòng 😊", 
    5: "Rất hài lòng 😍"
}
