import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Activity, ChevronRight, Search, Filter } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import TruncatedText from './ui/TruncatedText';

const Dashboard = () => {
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSentiment, setFilterSentiment] = useState('all');

    useEffect(() => {
        fetchRecordings();
    }, []);

    const fetchRecordings = async () => {
        try {
            const response = await axios.get('http://localhost:8080/recordings');
            setRecordings(response.data);
        } catch (error) {
            console.error('Error fetching recordings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTranscribe = async (id) => {
        try {
            setLoading(true);
            await axios.post(`http://localhost:8080/recordings/${id}/transcribe`);
            fetchRecordings();
        } catch (error) {
            console.error('Error transcribing:', error);
            alert('Transcription failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async (id) => {
        try {
            setLoading(true);
            await axios.post(`http://localhost:8080/recordings/${id}/analyze`);
            fetchRecordings();
        } catch (error) {
            console.error('Error analyzing:', error);
            alert('Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSentimentClass = (score) => {
        if (score >= 0.6) return 'badge-success';
        if (score <= 0.4) return 'badge-error';
        return 'badge-warning';
    };

    const getSentimentLabel = (score) => {
        if (score >= 0.6) return 'Positive';
        if (score <= 0.4) return 'Negative';
        return 'Neutral';
    };

    const filteredRecordings = recordings.filter(rec => {
        const matchesSearch = rec.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            filterSentiment === 'all' ||
            (filterSentiment === 'positive' && rec.average_sentiment >= 0.6) ||
            (filterSentiment === 'negative' && rec.average_sentiment <= 0.4) ||
            (filterSentiment === 'neutral' && rec.average_sentiment > 0.4 && rec.average_sentiment < 0.6);

        return matchesSearch && matchesFilter;
    });

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Overview of analyzed calls</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-group">
                        <Search className="input-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            className="input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '250px' }}
                        />
                    </div>

                    <div className="input-group">
                        <Filter className="input-icon" size={18} />
                        <select
                            className="input"
                            value={filterSentiment}
                            onChange={(e) => setFilterSentiment(e.target.value)}
                            style={{ width: '180px' }}
                        >
                            <option value="all">All Sentiments</option>
                            <option value="positive">Positive</option>
                            <option value="neutral">Neutral</option>
                            <option value="negative">Negative</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading recordings...
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Filename</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Duration</th>
                                <th>Sentiment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecordings.length > 0 ? (
                                filteredRecordings.map((rec) => (
                                    <tr key={rec.id}>
                                        <td style={{ fontWeight: 500, height: '130px' }}>
                                            <TruncatedText text={rec.filename} maxLength={30} />
                                        </td>
                                        <td style={{ height: '130px' }}>
                                            <span className={clsx("badge",
                                                rec.status === 'COMPLETED' ? 'badge-success' :
                                                    rec.status === 'TRANSCRIBED' ? 'badge-warning' : 'badge-neutral'
                                            )}>
                                                {rec.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', height: '130px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={14} />
                                                {formatDate(rec.upload_date)}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', height: '130px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={14} />
                                                {rec.duration > 0 ? formatDuration(rec.duration) : '-'}
                                            </div>
                                        </td>
                                        <td style={{ height: '130px' }}>
                                            {rec.status === 'COMPLETED' ? (
                                                <span className={clsx("badge", getSentimentClass(rec.average_sentiment))}>
                                                    <Activity size={14} />
                                                    {getSentimentLabel(rec.average_sentiment)} ({Math.round(rec.average_sentiment * 100)}%)
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', height: '130px', alignItems: 'center' }}>
                                            {rec.status === 'UPLOADED' && (
                                                <button onClick={() => handleTranscribe(rec.id)} className="btn btn-primary btn-sm">
                                                    Transcribe
                                                </button>
                                            )}
                                            {rec.status === 'TRANSCRIBED' && (
                                                <button onClick={() => handleAnalyze(rec.id)} className="btn btn-primary btn-sm">
                                                    Analyze
                                                </button>
                                            )}
                                            {(rec.status === 'COMPLETED' || rec.status === 'TRANSCRIBED') && (
                                                <Link to={`/report/${rec.id}`} className="btn btn-secondary btn-sm">
                                                    {rec.status === 'COMPLETED' ? 'View Report' : 'View Transcript'}
                                                    <ChevronRight size={16} />
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No recordings found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
