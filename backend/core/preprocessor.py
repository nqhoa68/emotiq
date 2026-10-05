import re
from config.settings import TEENCODE_DICT, EMOJI_DICT

def preprocess_text(text: str) -> str:
    """
    Tiền xử lý văn bản tiếng Việt:
    - Chuyển thành chữ thường
    - Thay thế emoji bằng từ tương ứng
    - Chuyển đổi teencode
    - Xóa các dấu câu không cần thiết
    """
    if not text or not isinstance(text, str):
        return " "
        
    text = text.lower()
    text = text.replace("\r\n", " ").replace("\n", " ")
    
    # Thay emoji
    for emoji, text_rep in EMOJI_DICT.items():
        text = text.replace(emoji, text_rep)
        
    # Thay teencode và xóa dấu câu
    words = text.split()
    cleaned_words = []
    
    for word in words:
        word_clean = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?"\']', '', word)
        if word_clean in TEENCODE_DICT:
            cleaned_words.append(TEENCODE_DICT[word_clean])
        else:
            cleaned_words.append(word)
            
    text = " ".join(cleaned_words)
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()
