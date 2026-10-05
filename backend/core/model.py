import torch
import torch.nn as nn
from transformers import AutoModel

class SharedEncoderMultiClassModel(nn.Module):
    def __init__(self, model_name: str, num_aspects: int = 6):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(model_name)
        hidden = self.encoder.config.hidden_size
        
        self.aspect_heads = nn.ModuleList([
            nn.Sequential(
                nn.Linear(hidden, 256), 
                nn.LayerNorm(256), 
                nn.ReLU(), 
                nn.Dropout(0.2), 
                nn.Linear(256, 1)
            ) for _ in range(num_aspects)
        ])

        self.sentiment_heads = nn.ModuleList([
            nn.Sequential(
                nn.Linear(hidden, 256), 
                nn.LayerNorm(256), 
                nn.ReLU(), 
                nn.Dropout(0.2), 
                nn.Linear(256, 5)
            ) for _ in range(num_aspects)
        ])

    def forward(self, input_ids, attention_mask):
        out = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        pooled = out.last_hidden_state[:, 0, :]  
        
        aspect_logits = torch.stack([h(pooled).squeeze(-1) for h in self.aspect_heads], dim=1)
        sentiment_logits = torch.stack([h(pooled) for h in self.sentiment_heads], dim=1)
        
        return aspect_logits, sentiment_logits
