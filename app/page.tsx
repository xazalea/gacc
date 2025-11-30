'use client';

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/create-gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.account);
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#f5f5f5',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: '4px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1rem',
          color: '#1a1a1a',
          fontWeight: '400',
          letterSpacing: '-0.02em',
        }}>
          Gmail Account Creator
        </h1>
        
        <p style={{ color: '#666666', marginBottom: '2rem', lineHeight: '1.6' }}>
          Automatically create a Gmail account and receive the credentials in JSON format.
        </p>

        <button
          onClick={handleCreateAccount}
          disabled={loading}
          style={{
            padding: '0.875rem 1.75rem',
            fontSize: '1rem',
            background: loading ? '#cccccc' : '#1a1a1a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '2px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '400',
            transition: 'background-color 0.2s, opacity 0.2s',
            marginBottom: '2rem',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#333333';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#1a1a1a';
            }
          }}
        >
          {loading ? 'Creating Account...' : 'Create Gmail Account'}
        </button>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#f5f5f5',
            border: '1px solid #d0d0d0',
            borderRadius: '2px',
            color: '#1a1a1a',
            marginBottom: '1rem',
          }}>
            <strong style={{ color: '#666666' }}>Error:</strong> <span style={{ color: '#1a1a1a' }}>{error}</span>
          </div>
        )}

        {result && (
          <div style={{
            padding: '1.5rem',
            background: '#fafafa',
            borderRadius: '2px',
            marginTop: '1rem',
            border: '1px solid #e0e0e0',
          }}>
            <h2 style={{ marginBottom: '1rem', color: '#1a1a1a', fontWeight: '400' }}>Account Created Successfully</h2>
            <pre style={{
              background: '#1a1a1a',
              color: '#e0e0e0',
              padding: '1.5rem',
              borderRadius: '2px',
              overflow: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              border: '1px solid #333333',
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

