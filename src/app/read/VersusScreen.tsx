'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface VersusScreenProps {
  fighterA: string;
  fighterB: string;
  onComplete: () => void;
}

export default function VersusScreen({ fighterA, fighterB, onComplete }: VersusScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'clash' | 'vs' | 'ready'>('enter');
  const [showFightButton, setShowFightButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Animation timeline - stops at 'ready' and waits for user click
    const timeline = [
      { phase: 'clash' as const, delay: 800 },   // Fighters slide in, then clash
      { phase: 'vs' as const, delay: 1400 },     // VS explodes
      { phase: 'ready' as const, delay: 2200 },  // Ready for user input
    ];

    const timeouts = timeline.map(({ phase, delay }) =>
      setTimeout(() => setPhase(phase), delay)
    );

    // Show FIGHT button after animation settles
    const buttonTimeout = setTimeout(() => setShowFightButton(true), 2500);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(buttonTimeout);
    };
  }, []);

  // Click on background = go back to selection
  const handleBackgroundClick = () => {
    router.push('/');
  };

  // Click FIGHT = proceed to book
  const handleFightClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger background click
    onComplete();
  };

  return (
    <div className="versus-screen" onClick={handleBackgroundClick}>
      {/* Dark dramatic background */}
      <div className="vs-background" />
      
      {/* Hint text */}
      <div className="click-hint">Click anywhere to change fighters</div>
      
      {/* Impact flash on clash */}
      <AnimatePresence>
        {phase === 'clash' && (
          <motion.div
            className="impact-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Screen shake container */}
      <motion.div 
        className="vs-content"
        animate={phase === 'clash' ? { x: [0, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {/* Red Corner - Fighter A */}
        <motion.div
          className="fighter-panel red"
          initial={{ x: '-100vw', rotate: -15 }}
          animate={
            phase === 'enter' 
              ? { x: '-100vw', rotate: -15 }
              : { x: 0, rotate: phase === 'clash' ? [-5, 0] : 0 }
          }
          transition={{ 
            type: 'spring', 
            stiffness: 200, 
            damping: 20,
            duration: 0.6 
          }}
        >
          <div className="fighter-bg red-bg" />
          <div className="fighter-content">
            <div className="corner-label">RED CORNER</div>
            <div className="fighter-name">{fighterA.toUpperCase()}</div>
            <div className="fighter-image-container">
              <img 
                src={`/fighters/${fighterA.toLowerCase().replace(/ /g, '-')}.jpg`} 
                alt={fighterA}
                className="fighter-image"
              />
            </div>
          </div>
          {/* Dramatic slash */}
          <div className="slash-effect red-slash" />
        </motion.div>

        {/* Blue Corner - Fighter B */}
        <motion.div
          className="fighter-panel blue"
          initial={{ x: '100vw', rotate: 15 }}
          animate={
            phase === 'enter'
              ? { x: '100vw', rotate: 15 }
              : { x: 0, rotate: phase === 'clash' ? [5, 0] : 0 }
          }
          transition={{ 
            type: 'spring', 
            stiffness: 200, 
            damping: 20,
            duration: 0.6 
          }}
        >
          <div className="fighter-bg blue-bg" />
          <div className="fighter-content">
            <div className="corner-label">BLUE CORNER</div>
            <div className="fighter-name">{fighterB.toUpperCase()}</div>
            <div className="fighter-image-container">
              <img 
                src={`/fighters/${fighterB.toLowerCase().replace(/ /g, '-')}.jpg`} 
                alt={fighterB}
                className="fighter-image"
              />
            </div>
          </div>
          {/* Dramatic slash */}
          <div className="slash-effect blue-slash" />
        </motion.div>

        {/* VS Badge - appears on clash with explosion */}
        <AnimatePresence>
          {(phase === 'clash' || phase === 'vs' || phase === 'ready') && (
            <motion.div
              className="vs-container"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: phase === 'vs' || phase === 'ready' ? [1.2, 1] : 3,
                rotate: 0,
              }}
              transition={{ 
                type: 'spring',
                stiffness: 300,
                damping: 15,
              }}
            >
              {/* Explosion rings */}
              <motion.div 
                className="explosion-ring ring-1"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              />
              <motion.div 
                className="explosion-ring ring-2"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              <motion.div 
                className="explosion-ring ring-3"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              />
              
              {/* VS text */}
              <motion.div 
                className="vs-badge"
                animate={{ 
                  textShadow: [
                    '0 0 20px #ffd700, 0 0 40px #ff6b00',
                    '0 0 40px #ffd700, 0 0 80px #ff6b00',
                    '0 0 20px #ffd700, 0 0 40px #ff6b00',
                  ]
                }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                VS
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Particle effects */}
        {phase !== 'enter' && (
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 1,
                  opacity: 1 
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  scale: 0,
                  opacity: 0
                }}
                transition={{ 
                  duration: 0.8 + Math.random() * 0.4,
                  delay: Math.random() * 0.2
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      <style jsx global>{`
        .versus-screen {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .vs-background {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #1a1a2e 0%, #0a0a15 100%);
        }

        .impact-flash {
          position: absolute;
          inset: 0;
          background: white;
          z-index: 10;
        }

        .vs-content {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fighter-panel {
          position: absolute;
          width: 50%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .fighter-panel.red {
          left: 0;
          transform-origin: right center;
        }

        .fighter-panel.blue {
          right: 0;
          transform-origin: left center;
        }

        .fighter-bg {
          position: absolute;
          inset: 0;
        }

        .red-bg {
          background: linear-gradient(135deg, #c41e3a 0%, #8b0000 50%, #4a0000 100%);
          clip-path: polygon(0 0, 110% 0, 95% 100%, 0 100%);
        }

        .blue-bg {
          background: linear-gradient(225deg, #1e4fc4 0%, #00008b 50%, #00004a 100%);
          clip-path: polygon(5% 0, 100% 0, 100% 100%, -10% 100%);
        }

        .fighter-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .corner-label {
          font-family: 'Anton', 'Impact', sans-serif;
          font-size: 1.2rem;
          letter-spacing: 0.3em;
          color: rgba(255,255,255,0.7);
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .fighter-name {
          font-family: 'Anton', 'Impact', 'Arial Black', sans-serif;
          font-size: clamp(2rem, 8vw, 5rem);
          font-weight: 900;
          color: white;
          text-shadow: 
            4px 4px 0 rgba(0,0,0,0.5),
            -2px -2px 0 rgba(255,255,255,0.2);
          letter-spacing: 0.05em;
          line-height: 1;
        }

        .fighter-image-container {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        .fighter-image {
          width: clamp(80px, 20vw, 150px);
          height: clamp(80px, 20vw, 150px);
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 30px rgba(0,0,0,0.5);
        }

        .fighter-panel.red .fighter-image {
          border-color: #ff4444;
          box-shadow: 0 0 30px rgba(255,68,68,0.5);
        }

        .fighter-panel.blue .fighter-image {
          border-color: #4444ff;
          box-shadow: 0 0 30px rgba(68,68,255,0.5);
        }

        .slash-effect {
          position: absolute;
          width: 200%;
          height: 8px;
          top: 50%;
          transform: translateY(-50%);
        }

        .red-slash {
          right: -20%;
          background: linear-gradient(90deg, transparent, #ffd700, #ff6b00, transparent);
        }

        .blue-slash {
          left: -20%;
          background: linear-gradient(270deg, transparent, #ffd700, #ff6b00, transparent);
        }

        .vs-container {
          position: absolute;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .explosion-ring {
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 4px solid;
        }

        .ring-1 {
          border-color: #ffd700;
        }

        .ring-2 {
          border-color: #ff6b00;
        }

        .ring-3 {
          border-color: #ff0000;
        }

        .vs-badge {
          font-family: 'Anton', 'Impact', 'Arial Black', sans-serif;
          font-size: clamp(4rem, 15vw, 10rem);
          font-weight: 900;
          color: #ffd700;
          text-shadow: 
            0 0 20px #ffd700,
            0 0 40px #ff6b00,
            4px 4px 0 #8b0000,
            -4px -4px 0 #00008b;
          letter-spacing: 0.1em;
          z-index: 5;
        }

        .particles {
          position: absolute;
          top: 50%;
          left: 50%;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: linear-gradient(45deg, #ffd700, #ff6b00);
          border-radius: 50%;
        }

        /* Font import */
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
      `}</style>
    </div>
  );
}
