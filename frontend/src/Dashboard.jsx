import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Image as ImageIcon, Download, RefreshCw, Layers, LogOut, ChartNoAxesColumn } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import './index.css';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'];

export default function Dashboard() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [segmentedImage, setSegmentedImage] = useState(null);
  const [counts, setCounts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setError(null);
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      setError('Please upload a valid JPG or PNG image.');
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setSegmentedImage(null);
      setCounts([]);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImage = async () => {
    if (!imageFile) return;
    
    setIsProcessing(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', imageFile);
    
    try {
      const response = await fetch('http://localhost:8000/api/segment', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to process image. Make sure the AI backend is running.');
      }
      
      const data = await response.json();
      
      if (data.error) {
         throw new Error(data.error);
      }
      
      setSegmentedImage('data:image/jpeg;base64,' + data.image);
      
      if (data.counts && Object.keys(data.counts).length > 0) {
        const chartData = Object.entries(data.counts).map(([name, value]) => ({ name, value }));
        setCounts(chartData);
      } else {
        setCounts([]);
      }
      
    } catch (err) {
      setError(err.message || 'An error occurred connecting to the backend server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!segmentedImage) return;
    const a = document.createElement('a');
    a.href = segmentedImage;
    a.download = 'segmented_ai_output.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClear = () => {
    setSelectedImage(null);
    setImageFile(null);
    setSegmentedImage(null);
    setCounts([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-container">
      <header className="header" style={{ position: 'relative' }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn-secondary" 
          style={{ position: 'absolute', right: 0, top: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={18} /> Logout
        </button>
        <h1>AI Vision <Layers className="inline-block mb-2 text-cyan-400" size={40} style={{verticalAlign: 'middle', margin: '0 8px'}} color="var(--accent-primary)"/> Segmenter</h1>
        <p>Upload an image and instantly isolate bounding regions with Mask R-CNN</p>
      </header>
      
      <main className="glass-card">
        {!selectedImage ? (
          <div 
            className={`uploader-area ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="upload-icon" size={64} style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Drag & Drop your image here</h2>
            <p style={{color: 'var(--text-secondary)'}}>or click to browse from your device (JPG, PNG)</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInput} 
              accept="image/jpeg, image/png" 
              style={{ display: 'none' }} 
            />
            {error && <div className="error-msg">{error}</div>}
          </div>
        ) : (
          <div>
            <div className="results-grid">
              <div className="image-container">
                <span className="image-label">Original Image</span>
                <img src={selectedImage} alt="Original uploaded" />
              </div>
              
              <div className="image-container" style={{ borderStyle: segmentedImage ? 'solid' : 'dashed' }}>
                <span className="image-label">AI Output</span>
                {isProcessing ? (
                  <div className="loader-overlay">
                    <div className="spinner"></div>
                    <h3 style={{fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)'}}>Running Inference...</h3>
                    <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>Initial run may take ~30s to download weights.</p>
                  </div>
                ) : segmentedImage ? (
                  <img src={segmentedImage} alt="Segmented result" style={{ animation: 'fadeIn 0.5s ease-out' }} />
                ) : (
                  <div style={{color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6}}>
                    <ImageIcon size={48} style={{margin: '0 auto 1rem'}} />
                    <p>Segmented region map will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Graph */}
            {segmentedImage && (
              <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', animation: 'fadeInDown 0.6s ease-out' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                  <ChartNoAxesColumn color="var(--accent-primary)" />
                  Detected Objects Analysis
                </h3>
                
                {counts.length > 0 ? (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={counts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                        <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                        <Tooltip 
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {counts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No high-confidence objects were detected by the model.</p>
                )}
              </div>
            )}
            
            <div className="action-bar">
              <button 
                className="btn btn-secondary" 
                onClick={handleClear}
                disabled={isProcessing}
              >
                <RefreshCw size={18} /> Restart
              </button>
              
              {!segmentedImage ? (
                <button 
                  className="btn" 
                  onClick={handleProcessImage}
                  disabled={isProcessing}
                >
                  <Layers size={18} /> Process with AI
                </button>
              ) : (
                <button 
                  className="btn" 
                  onClick={handleDownload}
                >
                  <Download size={18} /> Download Mask
                </button>
              )}
            </div>
            {error && <div style={{textAlign: 'center', marginTop: '1rem'}}><div className="error-msg">{error}</div></div>}
          </div>
        )}
      </main>
    </div>
  );
}
