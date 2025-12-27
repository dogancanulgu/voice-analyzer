import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Activity, Play, Pause, FileText, BrainCircuit, Loader2, SkipBack, SkipForward } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import TruncatedText from './ui/TruncatedText';

const Report = () => {
    const { id } = useParams();
    const [recording, setRecording] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);
    const transcriptRefs = useRef([]);

    useEffect(() => {
        fetchRecording();
    }, [id]);

    const fetchRecording = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/recordings/${id}`);
            setRecording(response.data);
        } catch (error) {
            console.error('Error fetching recording:', error);
            setError('Failed to load report.');
        } finally {
            setLoading(false);
        }
    };

    const handleTranscribe = async () => {
        setProcessing(true);
        try {
            await axios.post(`http://localhost:8080/recordings/${id}/transcribe`);
            fetchRecording();
        } catch (error) {
            console.error('Transcription failed:', error);
            setError('Transcription failed.');
        } finally {
            setProcessing(false);
        }
    };

    const handleAnalyze = async () => {
        setProcessing(true);
        try {
            await axios.post(`http://localhost:8080/recordings/${id}/analyze`);
            fetchRecording();
        } catch (error) {
            console.error('Analysis failed:', error);
            setError('Analysis failed.');
        } finally {
            setProcessing(false);
        }
    };

    // Audio Controls
    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            scrollToActiveSegment(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const progressBar = e.currentTarget;
        const clickPosition = (e.nativeEvent.offsetX / progressBar.offsetWidth);
        const newTime = clickPosition * duration;

        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const skip = (seconds) => {
        if (audioRef.current) {
            audioRef.current.currentTime += seconds;
        }
    };

    const scrollToActiveSegment = (time) => {
        if (!recording || !recording.segments) return;

        const activeIndex = recording.segments.findIndex(
            seg => time >= seg.start_time && time <= seg.end_time
        );

        if (activeIndex !== -1 && transcriptRefs.current[activeIndex]) {
            transcriptRefs.current[activeIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    const formatTime = (seconds) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getSentimentClass = (score) => {
        if (score >= 0.6) return 'badge-success';
        if (score <= 0.4) return 'badge-error';
        return 'badge-warning';
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading report...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--error)' }}>{error}</div>;
    if (!recording) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Recording not found.</div>;

    return (
        <div>
            <Link to="/" className="btn-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <ArrowLeft size={18} />
                Back to Dashboard
            </Link>

            <div className="report-grid">
                <div>
                    <h1
                        className="page-title"
                        title={recording.filename}
                        style={{
                            fontSize: '2.5rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '50vw'
                        }}
                    >
                        {recording.filename}
                    </h1>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', alignItems: 'center' }}>
                        <div className="badge badge-warning" style={{ textTransform: 'uppercase' }}>
                            {recording.status}
                        </div>
                        {recording.duration > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                <Clock size={18} />
                                {formatTime(recording.duration)}
                            </div>
                        )}
                        {recording.status === 'COMPLETED' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={18} color="var(--text-muted)" />
                                <span style={{ color: 'var(--text-muted)' }}>Overall Sentiment:</span>
                                <span className={clsx("badge", getSentimentClass(recording.average_sentiment))}>
                                    {Math.round(recording.average_sentiment * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Custom Audio Player */}
                {recording.status === 'COMPLETED' ? (
                    <div className="audio-player-card">
                        <div className="player-controls">
                            <button className="play-button" onClick={togglePlay}>
                                {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '4px' }} />}
                            </button>

                            <div className="progress-container">
                                <div className="time-display">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration || recording.duration)}</span>
                                </div>
                                <div className="progress-bar-wrapper" onClick={handleSeek}>
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button className="btn-link" onClick={() => skip(-5)}>
                                <SkipBack size={20} /> -5s
                            </button>
                            <button className="btn-link" onClick={() => skip(5)}>
                                +5s <SkipForward size={20} />
                            </button>
                        </div>

                        <audio
                            ref={audioRef}
                            src={`http://localhost:8080/uploads/${recording.filename}`}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                        />
                    </div>
                ) : (
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        {recording.status === 'UPLOADED' && (
                            <>
                                <p style={{ color: 'var(--text-muted)' }}>Ready to transcribe</p>
                                <button className="btn btn-primary" onClick={handleTranscribe} disabled={processing}>
                                    {processing ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
                                    Transcribe Audio
                                </button>
                            </>
                        )}
                        {recording.status === 'TRANSCRIBED' && (
                            <>
                                <p style={{ color: 'var(--text-muted)' }}>Transcript ready. Analyze sentiment?</p>
                                <button className="btn btn-primary" onClick={handleAnalyze} disabled={processing}>
                                    {processing ? <Loader2 className="animate-spin" /> : <BrainCircuit size={18} />}
                                    Run AI Analysis
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Transcript Section */}
            {(recording.status === 'TRANSCRIBED' || recording.status === 'COMPLETED') && (
                <>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginTop: '2rem' }}>
                        Transcript
                    </h2>

                    {(recording.segments && recording.segments.length > 0) ? (
                        <div className="transcript-list">
                            {recording.segments.map((segment, index) => {
                                const isActive = currentTime >= segment.start_time && currentTime <= segment.end_time;
                                return (
                                    <div
                                        key={index}
                                        ref={el => transcriptRefs.current[index] = el}
                                        className={clsx("transcript-item", isActive && "active")}
                                        onClick={() => {
                                            if (audioRef.current) {
                                                audioRef.current.currentTime = segment.start_time;
                                                audioRef.current.play();
                                                setIsPlaying(true);
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="transcript-header">
                                            <div className={clsx("speaker-badge", segment.speaker === "Agent" ? "speaker-agent" : "speaker-customer")}>
                                                <div className="speaker-avatar">
                                                    {segment.speaker === "Agent" ? "AG" : (segment.speaker === "Customer" ? "CU" : "??")}
                                                </div>
                                                <span>{segment.speaker}</span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                                                    {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                                                </span>
                                            </div>

                                            {segment.sentiment_score !== undefined && segment.sentiment_score !== 0.0 && (
                                                <div className={clsx("badge", getSentimentClass(segment.sentiment_score))}>
                                                    {Math.round(segment.sentiment_score * 100)}%
                                                </div>
                                            )}
                                        </div>

                                        <p className="transcript-text">
                                            {segment.text}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text)' }}>
                            {recording.transcript_text || "No transcript text available."}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Report;
