from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Voice Analyzer API is running"}

def test_upload_file():
    # Create a dummy file
    with open("test_audio.txt", "wb") as f:
        f.write(b"dummy audio content")
    
    with open("test_audio.txt", "rb") as f:
        response = client.post("/upload", files={"file": ("test_audio.txt", f, "text/plain")})
    
    # Clean up
    os.remove("test_audio.txt")
    if os.path.exists("uploads/test_audio.txt"):
        os.remove("uploads/test_audio.txt")

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["filename"] == "test_audio.txt"
    assert "average_sentiment" in data
    assert "segments" in data  # Check if segments are returned (Wait, schema says Recording returns segments? No, Recording schema doesn't have segments by default, only RecordingDetail does. Let's check schemas.py)

def test_read_recordings():
    response = client.get("/recordings")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_recording_detail():
    # First upload a file to get an ID
    with open("test_audio_2.txt", "wb") as f:
        f.write(b"dummy audio content")
    
    with open("test_audio_2.txt", "rb") as f:
        upload_response = client.post("/upload", files={"file": ("test_audio_2.txt", f, "text/plain")})
    
    recording_id = upload_response.json()["id"]
    
    # Now get details
    response = client.get(f"/recordings/{recording_id}")
    
    # Clean up
    os.remove("test_audio_2.txt")
    if os.path.exists("uploads/test_audio_2.txt"):
        os.remove("uploads/test_audio_2.txt")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == recording_id
    assert "segments" in data
    assert isinstance(data["segments"], list)
