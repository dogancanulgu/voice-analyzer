import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileAudio, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

const Upload = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file (MP3, WAV, etc).');
            return;
        }
        setFile(file);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8080/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            navigate(`/report/${response.data.id}`);
        } catch (err) {
            console.error(err);
            setError('Upload failed. Please check the backend connection.');
            setUploading(false);
        }
    };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="page-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <div>
                    <h1 className="page-title">Upload Recording</h1>
                    <p className="page-subtitle">Drag and drop your audio file to start analysis</p>
                </div>
            </div>

            <div
                className={clsx(
                    "upload-zone",
                    isDragging && "dragging",
                    file && "has-file"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="audio/*"
                    onChange={handleFileSelect}
                />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    {file ? (
                        <>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <FileAudio size={32} />
                            </div>
                            <div>
                                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{file.name}</p>
                                <p style={{ color: 'rgba(255,255,255,0.7)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                                className="btn-link"
                                style={{ color: 'white', textDecoration: 'underline' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                }}
                            >
                                Remove file
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'var(--surface)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                color: 'var(--primary)'
                            }}>
                                <UploadIcon size={40} />
                            </div>
                            <div>
                                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Click to upload or drag and drop</p>
                                <p style={{ color: 'var(--text-muted)' }}>Supported formats: MP3, WAV, M4A</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div style={{
                    marginTop: '1.5rem', padding: '1rem', borderRadius: 'var(--radius)',
                    background: 'var(--error-bg)', color: 'var(--error)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                <button
                    className="btn btn-primary"
                    style={{ minWidth: '200px' }}
                    disabled={!file || uploading}
                    onClick={handleUpload}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Uploading...
                        </>
                    ) : (
                        <>
                            Upload
                            <UploadIcon size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Upload;
