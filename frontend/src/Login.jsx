import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Lock, Mail, ArrowRight } from 'lucide-react';
import './index.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Layers size={60} color="var(--accent-primary)" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Sign in to continue to AI Vision Segmenter</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="email" 
              placeholder="Email address (e.g. demo@test.com)" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                color: 'white',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                color: 'white',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button type="submit" className="btn" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            Sign In <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
