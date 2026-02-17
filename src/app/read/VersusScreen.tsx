'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Animated stage messages during book generation
function GeneratingStages() {
  const stages = [
    '📚 Researching animal facts...',
    '⚔️ Writing battle scenes...',
    '🎨 Generating battle artwork...',
    '📊 Calculating fight stats...',
    '🖼️ Creating epic cover art...',
    '🏆 Determining the winner...',
    '✨ Finishing touches...',
  ];
  const [stageIndex, setStageIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex(prev => (prev + 1) % stages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        style={{ fontFamily: "'Bangers', cursive", fontSize: '1rem', color: '#ffd54f', letterSpacing: '1px', textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
      >
        {stages[stageIndex]}
      </motion.div>
    </AnimatePresence>
  );
}

interface VersusScreenProps {
  fighterA: string;
  fighterB: string;
  bookReady: boolean;
  onComplete: () => void;
}

interface FighterTagline {
  stat: string;
  tagline: string;
  special: string;
}

function getImagePath(name: string): string {
  return `/fighters/${name.toLowerCase().replace(/ /g, '-')}.jpg`;
}

export default function VersusScreen({ fighterA, fighterB, bookReady, onComplete }: VersusScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'clash' | 'stats' | 'ready'>('enter');
  const [animationDone, setAnimationDone] = useState(false);
  const [visibleStats, setVisibleStats] = useState<number>(0);
  const [taglines, setTaglines] = useState<{ fighterA: FighterTagline; fighterB: FighterTagline } | null>(null);

  // Fetch dynamic taglines from API
  useEffect(() => {
    async function fetchTaglines() {
      try {
        const response = await fetch('/api/vs-taglines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fighterA, fighterB }),
        });
        const data = await response.json();
        setTaglines(data);
      } catch (error) {
        console.error('Failed to fetch taglines:', error);
        // Fallback
        setTaglines({
          fighterA: { stat: '???', tagline: 'Apex predator', special: 'DEADLY' },
          fighterB: { stat: '???', tagline: 'Born to fight', special: 'FIERCE' },
        });
      }
    }
    fetchTaglines();
  }, [fighterA, fighterB]);

  const statsA = taglines?.fighterA || { stat: '...', tagline: 'Loading...', special: '...' };
  const statsB = taglines?.fighterB || { stat: '...', tagline: 'Loading...', special: '...' };

  useEffect(() => {
    // Animation timeline
    const timeline = [
      { phase: 'clash' as const, delay: 800 },   // Fighters slide in, then clash
      { phase: 'stats' as const, delay: 1600 },  // Start showing stats
      { phase: 'ready' as const, delay: 4500 },  // Animation complete
    ];

    const timeouts = timeline.map(({ phase, delay }) =>
      setTimeout(() => setPhase(phase), delay)
    );

    // Mark animation as done after minimum display time
    const animationTimeout = setTimeout(() => setAnimationDone(true), 5000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(animationTimeout);
    };
  }, []);

  // Animate stats appearing one by one
  useEffect(() => {
    if (phase === 'stats' || phase === 'ready') {
      const statTimers = [0, 1, 2, 3].map((index) =>
        setTimeout(() => setVisibleStats(index + 1), index * 400)
      );
      return () => statTimers.forEach(clearTimeout);
    }
  }, [phase]);

  // Auto-proceed when both animation is done AND book is ready
  useEffect(() => {
    if (animationDone && bookReady) {
      onComplete();
    }
  }, [animationDone, bookReady, onComplete]);

  return (
    <div className="versus-screen">
      {/* Dark dramatic background */}
      <div className="vs-background" />
      
      {/* Energy effect background */}
      <div className="energy-field">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="energy-bolt"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={phase !== 'enter' ? { 
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.5],
            } : {}}
            transition={{ 
              repeat: Infinity, 
              duration: 0.8 + Math.random() * 0.5,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
          />
        ))}
      </div>

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
          
          {/* Fighter Portrait */}
          <motion.div 
            className="fighter-portrait-container red-portrait"
            initial={{ scale: 0, opacity: 0 }}
            animate={phase !== 'enter' ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <img src={getImagePath(fighterA)} alt={fighterA} className="fighter-portrait-img" />
            <motion.div 
              className="portrait-glow red-glow"
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </motion.div>
          
          <div className="fighter-content">
            <div className="corner-label">RED CORNER</div>
            <motion.div 
              className="fighter-name"
              animate={phase !== 'enter' ? { 
                textShadow: [
                  '4px 4px 0 rgba(0,0,0,0.5)',
                  '4px 4px 20px rgba(255,0,0,0.8)',
                  '4px 4px 0 rgba(0,0,0,0.5)',
                ]
              } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {fighterA.toUpperCase()}
            </motion.div>
            
            {/* Stats reveal - Dynamic taglines */}
            <div className="fighter-stats">
              <AnimatePresence>
                {visibleStats >= 1 && (
                  <motion.div
                    className="stat-item highlight"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className="stat-icon">💪</span>
                    <span className="stat-value">{statsA.stat}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {visibleStats >= 2 && (
                  <motion.div
                    className="stat-item special"
                    initial={{ x: -100, opacity: 0, scale: 0.5 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className="stat-icon">🔥</span>
                    <span className="stat-value">{statsA.special}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {visibleStats >= 3 && (
                  <motion.div
                    className="tagline-item"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className="tagline-text">"{statsA.tagline}"</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
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
          
          {/* Fighter Portrait */}
          <motion.div 
            className="fighter-portrait-container blue-portrait"
            initial={{ scale: 0, opacity: 0 }}
            animate={phase !== 'enter' ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <img src={getImagePath(fighterB)} alt={fighterB} className="fighter-portrait-img" />
            <motion.div 
              className="portrait-glow blue-glow"
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            />
          </motion.div>
          
          <div className="fighter-content">
            <div className="corner-label">BLUE CORNER</div>
            <motion.div 
              className="fighter-name"
              animate={phase !== 'enter' ? { 
                textShadow: [
                  '4px 4px 0 rgba(0,0,0,0.5)',
                  '4px 4px 20px rgba(0,100,255,0.8)',
                  '4px 4px 0 rgba(0,0,0,0.5)',
                ]
              } : {}}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
            >
              {fighterB.toUpperCase()}
            </motion.div>
            
            {/* Stats reveal - Dynamic taglines */}
            <div className="fighter-stats">
              <AnimatePresence>
                {visibleStats >= 1 && (
                  <motion.div
                    className="stat-item highlight"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className="stat-value">{statsB.stat}</span>
                    <span className="stat-icon">💪</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {visibleStats >= 2 && (
                  <motion.div
                    className="stat-item special"
                    initial={{ x: 100, opacity: 0, scale: 0.5 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className="stat-value">{statsB.special}</span>
                    <span className="stat-icon">🔥</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {visibleStats >= 3 && (
                  <motion.div
                    className="tagline-item"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className="tagline-text">"{statsB.tagline}"</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="slash-effect blue-slash" />
        </motion.div>

        {/* VS Badge - appears on clash with explosion */}
        <AnimatePresence>
          {(phase === 'clash' || phase === 'stats' || phase === 'ready') && (
            <motion.div
              className="vs-container"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: phase === 'stats' || phase === 'ready' ? [1.2, 1] : 3,
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

        {/* Lightning bolts between fighters */}
        {phase !== 'enter' && (
          <div className="lightning-container">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="lightning-bolt"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scaleY: [0, 1, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.2,
                  delay: i * 0.3 + Math.random() * 0.5,
                  repeatDelay: 1 + Math.random(),
                }}
                style={{
                  left: `${45 + Math.random() * 10}%`,
                  top: `${20 + Math.random() * 60}%`,
                  rotate: `${-30 + Math.random() * 60}deg`,
                }}
              />
            ))}
          </div>
        )}

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

      {/* Loading indicator - shows after stats if book not ready */}
      <AnimatePresence>
        {animationDone && !bookReady && (
          <motion.div
            className="generating-indicator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="generating-icon"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              ⚔️
            </motion.div>
            <motion.div 
              className="generating-text"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              CREATING YOUR BOOK
            </motion.div>
            <div className="generating-stages">
              <GeneratingStages />
            </div>
            <div className="generating-bar">
              <motion.div 
                className="generating-bar-fill"
                initial={{ width: '5%' }}
                animate={{ width: '95%' }}
                transition={{ duration: 25, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

        .energy-field {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .energy-bolt {
          position: absolute;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%);
          border-radius: 50%;
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
          flex-direction: column;
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
          clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
        }

        .blue-bg {
          background: linear-gradient(225deg, #1e4fc4 0%, #00008b 50%, #00004a 100%);
          clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
        }

        /* Fighter Portraits */
        .fighter-portrait-container {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: visible;
          margin-bottom: 15px;
          z-index: 5;
        }

        .fighter-portrait-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          border: 4px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 30px rgba(0,0,0,0.5);
        }

        .portrait-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          z-index: -1;
        }

        .red-glow {
          background: radial-gradient(circle, rgba(255,0,0,0.5) 0%, transparent 70%);
          box-shadow: 0 0 40px rgba(255,0,0,0.6);
        }

        .blue-glow {
          background: radial-gradient(circle, rgba(0,100,255,0.5) 0%, transparent 70%);
          box-shadow: 0 0 40px rgba(0,100,255,0.6);
        }

        @media (min-width: 768px) {
          .fighter-portrait-container {
            width: 150px;
            height: 150px;
          }
        }

        .fighter-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 20px;
        }

        .corner-label {
          font-family: 'Anton', 'Impact', sans-serif;
          font-size: 1rem;
          letter-spacing: 0.3em;
          color: rgba(255,255,255,0.7);
          margin-bottom: 5px;
          text-transform: uppercase;
        }

        .fighter-name {
          font-family: 'Anton', 'Impact', 'Arial Black', sans-serif;
          font-size: clamp(1.5rem, 6vw, 3.5rem);
          font-weight: 900;
          color: white;
          text-shadow: 4px 4px 0 rgba(0,0,0,0.5);
          letter-spacing: 0.05em;
          line-height: 1;
          margin-bottom: 15px;
        }

        /* Stats */
        .fighter-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 140px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0,0,0,0.4);
          padding: 6px 12px;
          border-radius: 20px;
          backdrop-filter: blur(4px);
        }

        .red .stat-item {
          justify-content: flex-start;
        }

        .blue .stat-item {
          justify-content: flex-end;
        }

        .stat-icon {
          font-size: 1.2rem;
        }

        .stat-value {
          font-family: 'Anton', 'Impact', sans-serif;
          font-size: 1rem;
          color: #ffd700;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          letter-spacing: 0.05em;
        }

        .stat-item.special {
          background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,107,0,0.3));
          border: 1px solid rgba(255,215,0,0.5);
        }

        .stat-item.special .stat-value {
          color: #fff;
          text-shadow: 0 0 10px rgba(255,215,0,0.8);
        }

        .stat-item.highlight {
          background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.3);
        }

        .stat-item.highlight .stat-value {
          font-size: 1.3rem;
          color: #fff;
          text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }

        .tagline-item {
          padding: 8px 12px;
          background: rgba(0,0,0,0.5);
          border-radius: 8px;
          border-left: 3px solid #ffd700;
        }

        .tagline-text {
          font-family: 'Georgia', serif;
          font-size: 0.9rem;
          color: #ffd700;
          font-style: italic;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          letter-spacing: 0.02em;
        }

        @media (min-width: 768px) {
          .tagline-text {
            font-size: 1rem;
          }
          .stat-item.highlight .stat-value {
            font-size: 1.5rem;
          }
        }

        @media (min-width: 768px) {
          .stat-item {
            padding: 8px 16px;
          }
          .stat-icon {
            font-size: 1.4rem;
          }
          .stat-value {
            font-size: 1.2rem;
          }
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

        /* Lightning */
        .lightning-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 15;
        }

        .lightning-bolt {
          position: absolute;
          width: 4px;
          height: 100px;
          background: linear-gradient(to bottom, 
            transparent 0%, 
            #ffd700 20%, 
            #fff 50%, 
            #ffd700 80%, 
            transparent 100%
          );
          filter: blur(1px);
          box-shadow: 0 0 10px #ffd700, 0 0 20px #ff6b00;
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

        .ring-1 { border-color: #ffd700; }
        .ring-2 { border-color: #ff6b00; }
        .ring-3 { border-color: #ff0000; }

        .vs-badge {
          font-family: 'Anton', 'Impact', 'Arial Black', sans-serif;
          font-size: clamp(3rem, 12vw, 8rem);
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

        /* Generating indicator - Bottom center, clean text */
        .generating-indicator {
          position: fixed;
          bottom: 6%;
          left: 0;
          right: 0;
          z-index: 30;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .generating-icon {
          font-size: 2.5rem;
          filter: drop-shadow(0 0 10px rgba(255,215,0,0.6));
        }

        .generating-text {
          font-family: 'Bangers', cursive;
          font-size: 2rem;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 4px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.3);
          white-space: nowrap;
        }

        .generating-stages {
          min-height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .generating-bar {
          width: 260px;
          height: 8px;
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.3);
        }

        .generating-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd54f, #ff9800, #ffd54f);
          background-size: 200% 100%;
          animation: barShimmer 1.5s ease-in-out infinite;
          border-radius: 4px;
        }

        @keyframes barShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
