from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import datetime

class Recording(Base):
    __tablename__ = "recordings"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="UPLOADED") # UPLOADED, TRANSCRIBED, COMPLETED
    transcript_text = Column(String, nullable=True) # Full raw transcript
    duration = Column(Float) # in seconds
    average_sentiment = Column(Float) # 0.0 to 1.0

    segments = relationship("TranscriptSegment", back_populates="recording")

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    recording_id = Column(Integer, ForeignKey("recordings.id"))
    speaker = Column(String) # "Agent", "Customer", "Speaker 1"
    text = Column(String)
    start_time = Column(Float)
    end_time = Column(Float)
    sentiment_score = Column(Float)

    recording = relationship("Recording", back_populates="segments")
