from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import shutil
import os
import json
from typing import List
import models
import schemas
from database import SessionLocal, engine, Base
from analysis import transcribe_audio, analyze_transcript
from dotenv import load_dotenv

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Voice Analyzer API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded recordings (be careful in production)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Voice Analyzer API is running"}

@app.post("/upload", response_model=schemas.Recording)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create DB record with UPLOADED status
    db_recording = models.Recording(
        filename=file.filename,
        status="UPLOADED",
        duration=0.0, # Will be updated after transcription
        average_sentiment=0.0
    )
    db.add(db_recording)
    db.commit()
    db.refresh(db_recording)
    
    return db_recording

@app.post("/recordings/{recording_id}/transcribe", response_model=schemas.RecordingDetail)
def transcribe_recording(recording_id: int, db: Session = Depends(get_db)):
    recording = db.query(models.Recording).filter(models.Recording.id == recording_id).first()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
        
    file_path = f"uploads/{recording.filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    result = transcribe_audio(file_path)
    if not result:
        raise HTTPException(status_code=500, detail="Transcription failed")
        
    # Update recording
    recording.duration = result["duration"]
    recording.transcript_text = result["text"]
    # Store raw segments temporarily in a way we can retrieve later? 
    # For now, we might just store them in the DB if we had a JSON column, 
    # but since we don't, we'll rely on re-transcribing or just passing text to GPT if segments aren't stored.
    # actually, let's store raw segments as a temporary file or just proceed. 
    # To keep it simple for this "manual trigger" flow, we will save raw segments to a JSON file.
    
    segments_path = f"uploads/{recording.filename}.json"
    with open(segments_path, "w") as f:
        json.dump(result["segments"], f, indent=2, ensure_ascii=False)

    recording.status = "TRANSCRIBED"
    db.commit()
    db.refresh(recording)
    
    # Attach segments for response
    # Map raw segments (dicts) to TranscriptSegment schema
    mapped_segments = []
    for s in result["segments"]:
        mapped_segments.append(schemas.TranscriptSegment(
            id=0, # Temporary ID
            recording_id=recording.id,
            speaker=s.get("speaker", "Unknown"),
            text=s["text"],
            start_time=s["start"],
            end_time=s["end"],
            sentiment_score=s.get("sentiment_score", 0.0)
        ))
    
    # Create RecordingDetail from the DB model and attach segments
    recording_detail = schemas.RecordingDetail.model_validate(recording)
    recording_detail.segments = mapped_segments
    
    return recording_detail

@app.post("/recordings/{recording_id}/analyze", response_model=schemas.RecordingDetail)
def analyze_recording(recording_id: int, db: Session = Depends(get_db)):
    recording = db.query(models.Recording).filter(models.Recording.id == recording_id).first()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
        
    if recording.status != "TRANSCRIBED":
         raise HTTPException(status_code=400, detail="Recording must be transcribed first")

    # Load raw segments
    segments_path = f"uploads/{recording.filename}.json"
    if not os.path.exists(segments_path):
         raise HTTPException(status_code=500, detail="Transcript segments not found")
         
    with open(segments_path, "r") as f:
        whisper_segments = json.load(f)
        
    analysis_result = analyze_transcript(whisper_segments)
    if not analysis_result:
        raise HTTPException(status_code=500, detail="Analysis failed")
        
    # Update recording
    recording.average_sentiment = analysis_result["average_sentiment"]
    recording.status = "COMPLETED"
    
    # Save segments to DB
    # First clear existing segments if any (re-analysis case)
    db.query(models.TranscriptSegment).filter(models.TranscriptSegment.recording_id == recording.id).delete()
    
    for seg in analysis_result["segments"]:
        db_segment = models.TranscriptSegment(
            recording_id=recording.id,
            speaker=seg["speaker"],
            text=seg["text"],
            start_time=seg["start_time"],
            end_time=seg["end_time"],
            sentiment_score=seg["sentiment_score"]
        )
        db.add(db_segment)
    
    db.commit()
    db.refresh(recording)
    
    return recording

@app.get("/recordings", response_model=List[schemas.Recording])
def read_recordings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recordings = db.query(models.Recording).order_by(models.Recording.upload_date.desc()).offset(skip).limit(limit).all()
    return recordings

@app.get("/recordings/{recording_id}", response_model=schemas.RecordingDetail)
def read_recording(recording_id: int, db: Session = Depends(get_db)):
    recording = db.query(models.Recording).filter(models.Recording.id == recording_id).first()
    if recording is None:
        raise HTTPException(status_code=404, detail="Recording not found")
        
    # If segments are empty but status is TRANSCRIBED, try to load from JSON
    if not recording.segments and recording.status == "TRANSCRIBED":
        segments_path = f"uploads/{recording.filename}.json"
        if os.path.exists(segments_path):
            try:
                with open(segments_path, "r") as f:
                    raw_segments = json.load(f)
                    
                mapped_segments = []
                for s in raw_segments:
                    # Handle both dict keys and object attributes just in case
                    text = s.get("text", "")
                    start = s.get("start", 0.0)
                    end = s.get("end", 0.0)
                    
                    mapped_segments.append(schemas.TranscriptSegment(
                        id=0,
                        recording_id=recording.id,
                        speaker=s.get("speaker", "Unknown"),
                        text=text,
                        start_time=start,
                        end_time=end,
                        sentiment_score=s.get("sentiment_score", 0.0)
                    ))
                
                # We need to return a Pydantic model with these segments attached
                # We can't modify the SQLAlchemy object's relationship directly without adding to session
                # So we convert to Pydantic model first
                recording_detail = schemas.RecordingDetail.model_validate(recording)
                recording_detail.segments = mapped_segments
                return recording_detail
            except Exception as e:
                print(f"Error loading segments from JSON: {e}")
                
    return recording

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
