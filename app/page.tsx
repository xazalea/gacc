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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Gmail Account Creator
        </h1>
        
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Automatically create a Gmail account and receive the credentials in JSON format.
        </p>

        <button
          onClick={handleCreateAccount}
          disabled={loading}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'transform 0.2s',
            marginBottom: '2rem',
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {loading ? 'Creating Account...' : 'Create Gmail Account'}
        </button>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            marginBottom: '1rem',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div style={{
            padding: '1.5rem',
            background: '#f5f5f5',
            borderRadius: '8px',
            marginTop: '1rem',
          }}>
            <h2 style={{ marginBottom: '1rem', color: '#333' }}>Account Created Successfully!</h2>
            <pre style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '1.5rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.9rem',
              lineHeight: '1.5',
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

