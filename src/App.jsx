import { useState, useRef, useEffect } from 'react';
import { Camera, QrCode, Download, ChevronRight, RefreshCcw, ArrowLeft, Ticket } from 'lucide-react';
import './App.css';

const TEMPLATES = [
  { id: 't1', name: 'The Daily Prophet', style: 'classic' },
  { id: 't2', name: 'Cinema Times', style: 'modern' },
  { id: 't3', name: 'Midnight Courier', style: 'dark' }
];

function App() {
  const [step, setStep] = useState('home'); // home, template, preview, payment, camera, result
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  
  // Camera state
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const canvasResultRef = useRef(null);

  // Stop camera when not in use
  useEffect(() => {
    if (step !== 'camera' && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Please allow camera access to use the photobooth.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    
    // Countdown
    let count = 3;
    setCountdown(count);
    
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        
        // Flash effect
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 500);

        // Capture
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        // Mirror context so image is saved correctly
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPhotoData(dataUrl);
        setStep('result');
      }
    }, 1000);
  };

  // Render Result on Canvas for Download
  useEffect(() => {
    if (step === 'result' && photoData && canvasResultRef.current) {
      const canvas = canvasResultRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 1080;
      canvas.height = 1440; // 3:4 portrait newspaper

      // Background
      ctx.fillStyle = '#f4f1ea'; // paper color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Newspaper Header
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      
      // Title
      ctx.font = 'bold 100px "Playfair Display"';
      const title = TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'The Daily News';
      ctx.fillText(title, canvas.width / 2, 180);
      
      // Lines
      ctx.beginPath();
      ctx.moveTo(100, 220);
      ctx.lineTo(980, 220);
      ctx.moveTo(100, 235);
      ctx.lineTo(980, 235);
      ctx.stroke();

      // Subheader
      ctx.font = '30px "Inter"';
      ctx.fillText(`BREAKING NEWS • ${new Date().toLocaleDateString()} • SPECIAL EDITION`, canvas.width / 2, 280);
      
      ctx.beginPath();
      ctx.moveTo(100, 310);
      ctx.lineTo(980, 310);
      ctx.stroke();

      // Main Headline
      ctx.font = 'bold 60px "Playfair Display"';
      ctx.fillText("CAPTURED IN TIME!", canvas.width / 2, 400);

      // Load and draw photo
      const img = new Image();
      img.onload = () => {
        // Source crop (center crop 16:9 to roughly 4:3 or fit)
        const photoWidth = 880;
        const photoHeight = 660; // 4:3
        const xOffset = 100;
        const yOffset = 450;
        
        // Draw image frame
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 4;
        ctx.strokeRect(xOffset - 10, yOffset - 10, photoWidth + 20, photoHeight + 20);
        
        // Image itself (crop center)
        const scale = Math.max(photoWidth / img.width, photoHeight / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const sX = (drawWidth - photoWidth) / 2 / scale;
        const sY = (drawHeight - photoHeight) / 2 / scale;
        
        ctx.drawImage(img, sX, sY, img.width - (sX*2), img.height - (sY*2), xOffset, yOffset, photoWidth, photoHeight);

        // Footer Text
        ctx.font = '28px "Inter"';
        ctx.fillStyle = '#333';
        const text = "A mysterious figure was spotted looking absolutely stunning today.";
        ctx.fillText(text, canvas.width / 2, 1200);
        ctx.font = 'italic 24px "Playfair Display"';
        ctx.fillText("Photobooth Cinema Exclusive", canvas.width / 2, 1260);
      };
      img.src = photoData;
    }
  }, [step, photoData, selectedTemplate]);

  const downloadImage = () => {
    if (!canvasResultRef.current) return;
    const link = document.createElement('a');
    link.download = `photobooth-cinema-${Date.now()}.png`;
    link.href = canvasResultRef.current.toDataURL('image/png');
    link.click();
  };

  const reset = () => {
    setPhotoData(null);
    setSelectedTemplate(null);
    setStep('home');
  };

  return (
    <div className="app-container">
      <div className="cinematic-overlay"></div>
      
      <div className="content-wrapper">
        {step === 'home' && (
          <div className="home-screen fade-in">
            <div className="title-container">
              <h1>Photobooth Cinema</h1>
              <p>Capture your cinematic moment</p>
            </div>
            <button className="start-btn" onClick={() => setStep('template')}>
              Mulai <ChevronRight size={30} />
            </button>
          </div>
        )}

        {step === 'template' && (
          <div className="step-container glass-panel fade-in">
            <div className="step-header">
              <h2>Pilih Koran Anda</h2>
              <p>Pilih tema koran yang Anda inginkan</p>
            </div>
            <div className="templates-grid">
              {TEMPLATES.map(t => (
                <div 
                  key={t.id} 
                  className={`template-card ${selectedTemplate === t.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(t.id)}
                >
                  <div className="template-preview-img">
                    {t.name}
                  </div>
                  <h3>{t.name}</h3>
                </div>
              ))}
            </div>
            <div className="actions">
              <button className="btn-secondary" onClick={() => setStep('home')}>
                Batal
              </button>
              <button 
                className="btn-primary" 
                disabled={!selectedTemplate}
                onClick={() => setStep('preview')}
              >
                Selanjutnya <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="step-container glass-panel fade-in">
            <div className="step-header">
              <h2>Preview Template</h2>
              <p>Ini adalah tampilan koran yang akan Anda gunakan</p>
            </div>
            <div className="big-preview-container">
              <div className="big-preview">
                <div className="newspaper-title">
                  {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                </div>
                <div className="newspaper-photo-placeholder">
                  Foto Anda Di Sini
                </div>
                <p style={{fontSize: '12px'}}>Exclusive Edition • Breaking News</p>
              </div>
            </div>
            <div className="actions">
              <button className="btn-secondary" onClick={() => setStep('template')}>
                <ArrowLeft size={20} style={{marginRight: '8px'}} /> Kembali
              </button>
              <button className="btn-primary" onClick={() => setStep('payment')}>
                Lanjut ke Pembayaran <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="step-container glass-panel fade-in">
            <div className="step-header">
              <h2>Selesaikan Pembayaran</h2>
              <p>Scan QR code di bawah ini untuk membayar</p>
            </div>
            <div className="payment-screen">
              <div className="qr-code-box">
                <QrCode size={150} color="#111" />
              </div>
              <p>Rp 35.000</p>
            </div>
            <div className="actions">
              <button className="btn-secondary" onClick={() => setStep('preview')}>
                <ArrowLeft size={20} style={{marginRight: '8px'}} /> Kembali
              </button>
              <button className="btn-primary" onClick={() => {
                setStep('camera');
                startCamera();
              }}>
                <Ticket size={20} style={{marginRight: '8px'}} /> Saya Sudah Bayar (Simulasi)
              </button>
            </div>
          </div>
        )}

        {step === 'camera' && (
          <div className="step-container glass-panel fade-in" style={{maxWidth: '900px'}}>
            <div className="step-header">
              <h2>Ambil Foto</h2>
              <p>Bersiaplah untuk pose terbaik Anda</p>
            </div>
            
            <div className="camera-container">
              <video ref={videoRef} autoPlay playsInline muted></video>
              
              {countdown !== null && (
                <div className="countdown-overlay">{countdown}</div>
              )}
              
              <div className={`flash ${isFlashing ? 'active' : ''}`}></div>
            </div>

            <div className="actions">
              <button 
                className="btn-primary" 
                style={{padding: '1rem 3rem', fontSize: '1.2rem'}}
                onClick={takePhoto}
                disabled={countdown !== null}
              >
                <Camera size={24} style={{marginRight: '10px'}} /> Ambil Gambar
              </button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="step-container glass-panel fade-in" style={{maxWidth: '1200px'}}>
            <div className="step-header">
              <h2>Hasil Foto</h2>
              <p>Wah, Anda terlihat luar biasa!</p>
            </div>
            
            <div className="result-wrapper">
              <div className="canvas-container">
                {/* Visual canvas that the user sees (scaled down with css) */}
                <canvas ref={canvasResultRef} style={{maxHeight: '60vh'}}></canvas>
              </div>
            </div>

            <div className="actions">
              <button className="btn-secondary" onClick={() => {
                setPhotoData(null);
                setStep('camera');
                startCamera();
              }}>
                <RefreshCcw size={20} style={{marginRight: '8px'}} /> Ulangi Foto
              </button>
              <button className="btn-primary" onClick={downloadImage}>
                <Download size={20} style={{marginRight: '8px'}} /> Unduh Foto
              </button>
              <button className="btn-secondary" onClick={reset}>
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
