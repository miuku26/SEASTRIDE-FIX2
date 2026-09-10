import React, { useState, useEffect, useRef } from "react";
import { Crosshair } from "lucide-react";
import { soundFx } from "../../utils/audio";

import gaugeTrackSrc from "../../assets/images/calibration_gauge_track.png";
import gaugeNeedleSrc from "../../assets/images/calibration_needle_indicator.png";
import fuseSparkSrc from "../../assets/images/fuse_spark_ember.png";
import bgImageSrc from "../../assets/images/simple_menu_bg_1786470898720.jpg";

interface Props {
  onComplete: (isWin: boolean) => void;
}

export const CalibrationMinigameModal: React.FC<Props> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [needlePos, setNeedlePos] = useState(0); // 0 to 100
  const [isLocked, setIsLocked] = useState(false);
  const requestRef = useRef<number>(0);
  const direction = useRef<number>(1);
  const lastTimeRef = useRef<number>(0);
  
  // High speed oscillation
  const speed = 0.14; // pos per ms

  useEffect(() => {
    if (isLocked) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setNeedlePos(prev => {
        let next = prev + speed * deltaTime * direction.current;
        if (next >= 100) {
          next = 100;
          direction.current = -1;
        } else if (next <= 0) {
          next = 0;
          direction.current = 1;
        }
        return next;
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isLocked]);

  useEffect(() => {
    if (isLocked) return;
    
    const startTime = Date.now();
    let timerRef: number;
    
    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 5.0 - (elapsed / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        handleLock(true); // Auto-fail
      } else {
        timerRef = requestAnimationFrame(updateTimer);
      }
    };
    
    timerRef = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(timerRef);
  }, [isLocked]);

  const handleLock = (isTimeout: boolean = false) => {
    if (isLocked) return;
    setIsLocked(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    let isWin = false;
    if (!isTimeout) {
      // Check if needle is between 40 and 60 (center)
      setNeedlePos(currentPos => {
        isWin = currentPos >= 40 && currentPos <= 60;
        return currentPos;
      });
    }
    
    setTimeout(() => {
      onComplete(isWin);
    }, 400); // Shorter delay so feedback feels faster
  };

  const fusePercentage = (timeLeft / 5.0) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div 
        className="bg-[#1a0f0d]/90 border border-[#b45309]/50 rounded-[2rem] w-full max-w-sm p-6 shadow-2xl flex flex-col items-center relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImageSrc})` }}
      >
        {/* Light Overlay Layer */}
        <div className="absolute inset-0 bg-[#0B0F19]/50 backdrop-blur-md z-0" />
        
        <div className="relative z-10 w-full flex flex-col items-center">
          {/* Top Fuse Bar (No Numbers) */}
          <div className="w-full h-3 bg-black/80 rounded-full relative mb-8 border border-[#4a2c17]">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 rounded-full"
            style={{ width: `${fusePercentage}%` }}
          />
          <img 
            src={fuseSparkSrc}
            alt="spark"
            className="absolute top-1/2 -translate-y-1/2 w-24 h-24 object-contain z-10 brightness-125 drop-shadow-[0_0_12px_rgba(255,165,0,0.9)]"
            style={{ left: `calc(${fusePercentage}% - 48px)` }}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="text-[#fde68a] font-serif font-black uppercase tracking-wider mb-2 text-center text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Target Lock
        </div>
        <p className="text-xs text-amber-200/70 font-bold mb-8 text-center max-w-[200px] uppercase tracking-wide">
          Fire when aligned!
        </p>

        {/* Gauge Track & Needle */}
        <div className="w-full max-w-[260px] relative mb-12 h-16 flex flex-col items-center justify-center">
          {/* Optimal Zone Highlight (behind track) */}
          <div className="absolute left-[38%] right-[38%] top-0 bottom-0 bg-green-500/30 blur-sm rounded-full pointer-events-none" />
          
          {/* Track Layer */}
          <img 
            src={gaugeTrackSrc}
            alt="Gauge Track"
            className="w-full h-full z-10 object-contain drop-shadow-2xl relative"
            referrerPolicy="no-referrer"
          />

          {/* Needle overlaying the track container in layout (visually above the track) */}
          <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-20 flex items-end">
            <img 
              src={gaugeNeedleSrc}
              alt="Needle"
              className="absolute bottom-0 w-8 object-contain origin-bottom"
              style={{ 
                left: `${needlePos}%`, 
                transform: 'translateX(-50%) scale(0.5)',
                filter: 'drop-shadow(0 -2px 10px rgba(255,0,0,0.8))'
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            handleLock(false);
          }}
          disabled={isLocked}
          className="w-full bg-red-700 hover:bg-red-600 border-b-4 border-r-2 border-red-950 text-white font-black py-3 rounded-xl uppercase italic tracking-wider text-base shadow-2xl active:translate-y-1 flex items-center justify-center gap-2"
        >
          <span>💣 {isLocked ? "FIRING..." : "FIRE BOMB SALVO!"}</span>
        </button>
        </div>

      </div>
    </div>
  );
}
