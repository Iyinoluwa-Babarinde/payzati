'use client';

import React from 'react';

export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0A0E1A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      gap: '1.5rem'
    }}>
      {/* Premium micro-animated spinner */}
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid rgba(0, 212, 170, 0.1)',
        borderTop: '3px solid #00D4AA',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      
      <span style={{
        color: '#9CA3AF',
        fontSize: '0.875rem',
        letterSpacing: '0.05em',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        Just a moment, getting things ready...
      </span>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
