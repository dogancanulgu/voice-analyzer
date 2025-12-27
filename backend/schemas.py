from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TranscriptSegmentBase(BaseModel):
    speaker: str
    text: str
    start_time: float
    end_time: float
    sentiment_score: float

class TranscriptSegmentCreate(TranscriptSegmentBase):
    pass

class TranscriptSegment(TranscriptSegmentBase):
    id: int
    recording_id: int

    class Config:
        from_attributes = True

class RecordingBase(BaseModel):
    filename: str
    duration: float
    average_sentiment: float

class RecordingCreate(RecordingBase):
    pass

class Recording(RecordingBase):
    id: int
    duration: float
    status: str
    transcript_text: Optional[str] = None
    upload_date: datetime

    class Config:
        from_attributes = True

class RecordingDetail(Recording):
    segments: List[TranscriptSegment] = []
