import React from 'react';
import Tooltip from './Tooltip';

const TruncatedText = ({ text, maxLength = 30, className = '' }) => {
    if (!text) return null;

    const shouldTruncate = text.length > maxLength;
    const displayText = shouldTruncate ? `${text.substring(0, maxLength)}...` : text;

    if (!shouldTruncate) {
        return <span className={className}>{text}</span>;
    }

    return (
        <Tooltip content={text}>
            <span className={className} style={{ cursor: 'help' }}>
                {displayText}
            </span>
        </Tooltip>
    );
};

export default TruncatedText;
