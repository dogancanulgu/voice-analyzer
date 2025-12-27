import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ children, content, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positions = {
        top: { bottom: '100%', left: '50%', x: '-50%', marginBottom: '8px' },
        bottom: { top: '100%', left: '50%', x: '-50%', marginTop: '8px' },
        left: { right: '100%', top: '50%', y: '-50%', marginRight: '8px' },
        right: { left: '100%', top: '50%', y: '-50%', marginLeft: '8px' },
    };

    return (
        <span
            className="tooltip-wrapper"
            style={{ position: 'relative', display: 'inline' }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            ...positions[position],
                            zIndex: 50,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{
                            backgroundColor: 'var(--surface-active)',
                            color: 'var(--text)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            boxShadow: 'var(--shadow-lg)',
                            border: '1px solid var(--border)',
                            width: 'max-content',
                            maxWidth: '300px',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            textAlign: 'center',
                            WebkitTextFillColor: 'var(--text)', // Reset text fill color
                            fontWeight: 'normal' // Reset font weight if needed
                        }}>
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
};

export default Tooltip;
