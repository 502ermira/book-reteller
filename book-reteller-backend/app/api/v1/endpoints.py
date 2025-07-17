from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import uuid
import os
from app.services.summarizer import BookSummarizer
from app.config import settings

router = APIRouter()
summarizer = BookSummarizer()

@router.post("/summarize")
async def create_summary(
    file: UploadFile = File(...),
    start_page: int = 0,
    end_page: int = None
):
    try:
        print("\n" + "="*50)
        print("📤 Received upload request")
        print(f"📄 File name: {file.filename}")
        print(f"📄 Content type: {file.content_type}")
        print(f"📖 Pages: {start_page}-{end_page if end_page else 'all'}")

        # Verify file was received
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
            
        # Create directories if they don't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(settings.OUTPUT_DIR, exist_ok=True)

        # Save uploaded file
        file_id = str(uuid.uuid4())
        pdf_path = Path(settings.UPLOAD_DIR) / f"{file_id}.pdf"
        
        print("💾 Saving uploaded file...")
        file_size = 0
        with open(pdf_path, "wb") as buffer:
            while contents := await file.read(1024 * 1024):  # 1MB chunks
                file_size += len(contents)
                buffer.write(contents)
        print(f"✅ File saved ({file_size} bytes) to {pdf_path}")

        # Verify file exists and has content
        if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) == 0:
            raise HTTPException(status_code=500, detail="File failed to save")

        # Process file
        output_path = Path(settings.OUTPUT_DIR) / f"{file_id}.txt"
        print("🔄 Starting processing...")
        summarizer.process_book(str(pdf_path), str(output_path), start_page, end_page)
        
        print(f"🎉 Processing complete! File ID: {file_id}")
        print("="*50 + "\n")
        return {"file_id": file_id}
        
    except Exception as e:
        print(f"🔥 Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary/{file_id}")
async def get_summary(file_id: str):
    file_path = Path(settings.OUTPUT_DIR) / f"{file_id}.txt"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Summary not found")
    
    with open(file_path, "r", encoding="utf-8") as f:
        return {"summary": f.read()}