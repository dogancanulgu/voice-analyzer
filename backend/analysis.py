import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

from faster_whisper import WhisperModel
import time

import av
import numpy as np
import wave
import math

MODEL_SIZE = "large-v3"
device = "cuda" if os.getenv("USE_GPU") == "true" else "cpu"

print(f"Loading model: {MODEL_SIZE} ({device})...")
model = WhisperModel(MODEL_SIZE, device=device, compute_type="float16" if device == "cuda" else "int8")
print("Model loaded successfully.")

def split_channels(file_path):
    """
    Decodes audio using PyAV, checks for stereo, and splits into mono WAV files if needed.
    Returns a list of temporary filenames (or just the original if mono).
    """
    try:
        container = av.open(file_path)
        stream = container.streams.audio[0]
        channels = stream.channels
        
        if channels == 1:
            container.close()
            return [file_path]
            
        print(f"Detected {channels} channels. Splitting...")
        
        # Use AudioResampler to force conversion to planar format (s16p)
        # This ensures to_ndarray returns shape (channels, samples) instead of (1, samples*channels) (packed)
        # We preserve the rate and layout (implied)
        resampler = av.AudioResampler(format='s16p')
        
        audio_data = []
        
        # Helper to process frames
        def process_frame(frame):
            # Resample returns a list of frames (usually 1, potentially 0 or more)
            resampled_frames = resampler.resample(frame)
            for rf in resampled_frames:
                arr = rf.to_ndarray()
                audio_data.append(arr)

        for frame in container.decode(audio=0):
            process_frame(frame)
            
        # Flush resampler
        process_frame(None)

        container.close()
        
        if not audio_data:
            print("No audio data decoded.")
            return [file_path]
            
        # Concatenate all frames: shape (channels, total_samples)
        full_audio = np.concatenate(audio_data, axis=1)
        print(f"Full audio shape: {full_audio.shape}")
        
        output_files = []
        sample_rate = stream.rate
        
        # Save each channel as a separate WAV
        for i in range(channels):
            if i >= full_audio.shape[0]:
                print(f"Warning: Channel {i} out of bounds for audio shape {full_audio.shape}")
                break
                
            channel_data = full_audio[i, :]
            
            out_name = f"{file_path}_ch{i}.wav"
            with wave.open(out_name, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2) # 16 bit
                wav_file.setframerate(sample_rate)
                # Data is already s16p (int16), just ensure correct type for safety
                if channel_data.dtype != np.int16:
                   channel_data = channel_data.astype(np.int16)
                         
                wav_file.writeframes(channel_data.tobytes())
            
            output_files.append(out_name)
            
        return output_files
        
    except Exception as e:
        print(f"Error splitting channels: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to original
        return [file_path]

def transcribe_audio(file_path: str):
    """
    Transcribes audio using local Faster Whisper model.
    Handles stereo/multi-channel audio by splitting using PyAV.
    Returns duration, full text, and segments.
    """
    try:
        print(f"Starting transcription for: {file_path}")
        channel_files = split_channels(file_path)
        is_stereo = len(channel_files) > 1
        print(f"Split result: {len(channel_files)} files. Is Stereo: {is_stereo}")
        
        all_segments = []
        full_text_parts = []
        detected_language = "unknown"
        duration = 0.0
        
        for i, source_file in enumerate(channel_files):
            print(f"Processing channel {i}: {source_file}")
            try:
                print(f"Transcribing channel {i}...")
                segments, info = model.transcribe(
                    source_file, 
                    beam_size=5, 
                    language="tr",
                    condition_on_previous_text=False,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                    word_timestamps=True
                )
                print(f"Transcription finished for channel {i}")
                
                if i == 0:
                    detected_language = info.language
                    duration = info.duration # Approx duration
                    print(f"Detected language: {detected_language}, Duration: {duration}")
                
                segment_count = 0
                for segment in segments:
                    segment_count += 1
                    confidence = math.exp(segment.avg_logprob) if segment.avg_logprob is not None else 0.0
                    
                    speaker_label = "Unknown"
                    if is_stereo:
                        if i == 0: speaker_label = "Customer"
                        elif i == 1: speaker_label = "Agent"
                        else: speaker_label = f"Channel {i}"
                    
                    all_segments.append({
                        "start": round(segment.start, 2),
                        "end": round(segment.end, 2),
                        "text": segment.text.strip(),
                        "speaker": speaker_label,
                        "confidence": round(confidence, 2),
                        "no_speech_prob": round(segment.no_speech_prob, 4) if hasattr(segment, 'no_speech_prob') else 0.0
                    })
                print(f"Channel {i} segments processed: {segment_count}")

            finally:
                # Cleanup temp files if they are distinct from original
                if source_file != file_path and os.path.exists(source_file):
                    print(f"Removing temp file: {source_file}")
                    os.remove(source_file)
        
        # Sort and merge
        all_segments.sort(key=lambda x: x["start"])
        full_text_parts = [s["text"] for s in all_segments]
        
        print(f"Total segments collected: {len(all_segments)}")
        return {
            "duration": round(duration, 2),
            "text": " ".join(full_text_parts),
            "segments": all_segments,
            "language": detected_language
        }
        
    except Exception as e:
        print(f"Error in transcription loop: {e}")
        import traceback
        traceback.print_exc()
        return None

def analyze_transcript(whisper_segments):
    """
    Analyzes transcript segments using GPT-5-Nano for sentiment and diarization.
    """
    system_prompt = """
    You are an expert conversation analyst. 
    I will provide you with a transcript of a call between an Agent and a Customer.
    The transcript is a list of segments with start and end times.
    
    Your task is to:
    1. Infer who is speaking (Agent or Customer) for each segment based on context.
    2. Analyze the sentiment score of each segment (0.0 to 1.0, where 0 is negative, 1 is positive).
    3. Calculate the overall average sentiment of the call.
    
    Return the output strictly as a JSON object with the following structure:
    {
        "average_sentiment": float,
        "segments": [
            {
                "speaker": "Agent" or "Customer",
                "text": "segment text",
                "start_time": float,
                "end_time": float,
                "sentiment_score": float
            }
        ]
    }
    """
    
    # Prepare segments for GPT context
    segments_context = json.dumps([{
        "text": s['text'] if isinstance(s, dict) else s.text,
        "start": s['start'] if isinstance(s, dict) else s.start,
        "end": s['end'] if isinstance(s, dict) else s.end
    } for s in whisper_segments], ensure_ascii=False)

    try:
        response = client.chat.completions.create(
            model="gpt-5-nano",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here are the transcript segments:\n{segments_context}"}
            ]
        )
        
        result_json = response.choices[0].message.content
        print(f"DEBUG: GPT Response Sample: {result_json[:100]}")
        analysis_data = json.loads(result_json)
        
        return analysis_data
        
    except Exception as e:
        print(f"Error in GPT analysis: {e}")
        return None
