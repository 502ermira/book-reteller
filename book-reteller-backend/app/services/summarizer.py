import os
import nltk
import torch
import fitz  # PyMuPDF
from tqdm import tqdm
from nltk.tokenize import sent_tokenize
from transformers import pipeline, AutoTokenizer

class BookSummarizer:
    def __init__(self, model_name="philschmid/bart-large-cnn-samsum"):
        print("⚙️ Initializing BookSummarizer...")
        self.MAX_MODEL_TOKENS = 1024
        self.CHUNK_TOKEN_LIMIT = 950
        
        self.setup_nltk()
        self.device = 0 if torch.cuda.is_available() else -1
        print(f"🔧 Using {'GPU' if self.device == 0 else 'CPU'} for processing")
        
        print("⏳ Loading tokenizer and model...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.summarizer = pipeline(
            "summarization",
            model=model_name,
            tokenizer=self.tokenizer,
            device=self.device
        )
        print("✅ Model loaded successfully")

    def setup_nltk(self):
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            print("⏳ Downloading NLTK punkt tokenizer...")
            nltk.download('punkt', quiet=True)

    def extract_text(self, pdf_path, start_page=0, end_page=None):
        print(f"📖 Extracting text from {pdf_path} (pages {start_page}-{end_page if end_page else 'end'})")
        doc = fitz.open(pdf_path)
        if end_page is None:
            end_page = len(doc)
        full_text = []
        for page_num in range(start_page, end_page):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            full_text.append(text)
        print(f"📄 Extracted {len(full_text)} pages of text")
        return "\n".join(full_text).strip()

    def split_into_token_chunks(self, text, tokenizer):
        print("✂️ Splitting text into chunks...")
        paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
        chunks = []
        current_chunk = []
        current_len = 0

        for para in paragraphs:
            tokens = tokenizer.encode(para, add_special_tokens=False)
            if len(tokens) <= self.CHUNK_TOKEN_LIMIT:
                if current_len + len(tokens) <= self.CHUNK_TOKEN_LIMIT:
                    current_chunk.append(para)
                    current_len += len(tokens)
                else:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = [para]
                    current_len = len(tokens)
            else:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_len = 0
                try:
                    sentences = sent_tokenize(para)
                except:
                    sentences = [para]
                for sent in sentences:
                    sent_tokens = tokenizer.encode(sent, add_special_tokens=False)
                    if len(sent_tokens) > self.CHUNK_TOKEN_LIMIT:
                        chunks.append(sent[:self.CHUNK_TOKEN_LIMIT//4])
                    elif current_len + len(sent_tokens) <= self.CHUNK_TOKEN_LIMIT:
                        current_chunk.append(sent)
                        current_len += len(sent_tokens)
                    else:
                        chunks.append(" ".join(current_chunk))
                        current_chunk = [sent]
                        current_len = len(sent_tokens)

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        print(f"📦 Split into {len(chunks)} chunks")
        return chunks

    def summarize_chunks(self, chunks):
        print("🧠 Summarizing chunks...")
        summaries = []
        for i, chunk in enumerate(tqdm(chunks, desc="Summarizing")):
            try:
                if not chunk.strip():
                    summaries.append("[EMPTY]")
                    continue

                inputs = self.tokenizer(
                    chunk,
                    return_tensors="pt",
                    truncation=True,
                    max_length=self.MAX_MODEL_TOKENS
                )
                processed_text = self.tokenizer.decode(
                    inputs["input_ids"][0],
                    skip_special_tokens=True
                )
                if not processed_text.strip():
                    summaries.append("[NO CONTENT]")
                    continue

                summary = self.summarizer(
                    processed_text,
                    max_length=300,
                    min_length=150,
                    do_sample=False,
                    num_beams=4,
                    length_penalty=2.0
                )[0]['summary_text']

                summaries.append(summary.strip())

            except Exception as e:
                summaries.append("[ERROR IN PROCESSING]")
                print(f"⚠️ Error in chunk {i+1}: {e}")

        print(f"✅ Generated {len(summaries)} summaries")
        return summaries

    def process_book(self, pdf_path, output_path, start_page=0, end_page=None):
        print("\n" + "="*50)
        print("📚 Starting book processing")
        print(f"📂 Input: {pdf_path}")
        print(f"📝 Output: {output_path}")
        
        text = self.extract_text(pdf_path, start_page, end_page)
        chunks = self.split_into_token_chunks(text, self.tokenizer)
        summaries = self.summarize_chunks(chunks)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(summaries))
        
        print(f"🎉 Successfully saved summary to {output_path}")
        print("="*50 + "\n")
        return output_path