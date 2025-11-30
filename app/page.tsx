'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);

    try {
      const response = await fetch('/api/create-gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'status') {
              setLogs(prev => [...prev, `> ${data.message}`]);
            } else if (data.type === 'result') {
              setResult(data.account);
              setLogs(prev => [...prev, `> Account created successfully!`]);
            } else if (data.type === 'error') {
              setError(data.message);
              setLogs(prev => [...prev, `> Error: ${data.message}`]);
            }
          } catch (e) {
            console.error('Failed to parse chunk:', line);
          }
        }
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
      fontFamily: 'Courier New, monospace',
      background: '#111111',
      color: '#e0e0e0',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: '#1a1a1a',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        border: '1px solid #333333',
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '1.5rem',
          color: '#ffffff',
          fontWeight: 'bold',
          letterSpacing: '-0.02em',
          borderBottom: '1px solid #333333',
          paddingBottom: '1rem',
        }}>
          Gmail Account Creator
        </h1>
        
        <p style={{ color: '#888888', marginBottom: '2rem', lineHeight: '1.6' }}>
          Automated account generation with proxy rotation.
        </p>

        <button
          onClick={handleCreateAccount}
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1rem',
            background: loading ? '#333333' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            marginBottom: '2rem',
            opacity: loading ? 0.7 : 1,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {loading ? 'Executing Sequence...' : 'Initialize Creation Sequence'}
        </button>

        {(logs.length > 0 || loading) && (
          <div style={{
            background: '#000000',
            borderRadius: '4px',
            padding: '1.5rem',
            fontFamily: 'Courier New, monospace',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            border: '1px solid #333333',
            marginBottom: '1.5rem',
            height: '300px',
            overflowY: 'auto',
          }}>
            {logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '0.5rem',
                color: log.startsWith('> Error') ? '#ff5555' : '#00ff00'
              }}>
                {log}
              </div>
            ))}
            {loading && (
              <div style={{ color: '#666666', animation: 'pulse 1.5s infinite' }}>
                _
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 85, 85, 0.1)',
            border: '1px solid #ff5555',
            borderRadius: '4px',
            color: '#ff5555',
            marginBottom: '1rem',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div style={{
            padding: '1.5rem',
            background: '#222222',
            borderRadius: '4px',
            border: '1px solid #444444',
            animation: 'fadeIn 0.5s ease-in',
          }}>
            <h2 style={{ marginBottom: '1rem', color: '#ffffff', fontSize: '1.2rem' }}>Credentials Generated</h2>
            <pre style={{
              background: '#000000',
              color: '#00ff00',
              padding: '1.5rem',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              border: '1px solid #333333',
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
