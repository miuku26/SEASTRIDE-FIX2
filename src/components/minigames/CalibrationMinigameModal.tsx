import React, { useState, useEffect, useRef } from "react";
import { Crosshair, Timer } from "lucide-react";

interface Props {
  onComplete: (isWin: boolean) => void;
}

export const CalibrationMinigameModal: React.FC<Props> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [needlePos, setNeedlePos] = useState(0); // 0 to 100
  const [isLocked, setIsLocked] = useState(false);
  const requestRef = useRef<number>();
  const direction = useRef<number>(1);
  const lastTimeRef = useRef<number>();

  const speed = 0.15; // pos per ms

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
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(interval);
          handleLock(true); // Auto-fail
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isLocked]);

  const handleLock = (isTimeout: boolean = false) => {
    if (isLocked) return;
    setIsLocked(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    let isWin = false;
    if (!isTimeout) {
      // Check if needle is between 40 and 60
      setNeedlePos(currentPos => {
        isWin = currentPos >= 40 && currentPos <= 60;
        return currentPos;
      });
    }

    setTimeout(() => {
      onComplete(isWin);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-[#1a0f0d]/90 border border-[#fde68a]/30 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center">
        {/* Timer */}
        <div className="flex items-center gap-2 mb-6 text-red-400 font-mono text-3xl font-black bg-black/50 px-4 py-2 rounded-xl border border-red-900/50 shadow-inner">
          <Timer className="w-6 h-6 animate-pulse" />
          {timeLeft.toFixed(1)}s
        </div>

        <div className="text-[#fde68a] font-serif font-black uppercase tracking-wider mb-2 text-center text-xl">
          Calibrate Targeting
        </div>
        <p className="text-xs text-amber-200/70 font-bold mb-8 text-center max-w-[200px]">
          Lock the needle in the green zone before time runs out!
        </p>

        {/* Gauge */}
        <div className="w-full h-12 bg-black rounded-full border-4 border-[#4a2c17] relative overflow-hidden mb-10 shadow-inner">
          <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-green-500/80 border-x-2 border-green-300" />
          <div className="absolute top-0 bottom-0 left-[49%] right-[49%] bg-yellow-400 z-10" />
          <div 
            className="absolute top-0 bottom-0 w-2 bg-red-600 z-20 shadow-[0_0_10px_rgba(220,38,38,1)]"
            style={{ left: `${needlePos}%`, transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Button */}
        <button
          onClick={() => handleLock(false)}
          disabled={isLocked}
          className="w-full py-5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 active:scale-95 active:translate-y-1 transition-all rounded-2xl border-b-4 border-amber-900 font-black uppercase tracking-widest text-black flex items-center justify-center gap-2 text-xl"
        >
          <Crosshair className="w-7 h-7" />
          {isLocked ? "LOCKED" : "LOCK"}
        </button>

        {isLocked && (
          <div className="mt-6 text-2xl font-black uppercase animate-bounce text-center">
            {needlePos >= 40 && needlePos <= 60 ? (
              <span className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,1)]">PERFECT HIT!</span>
            ) : (
              <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]">GLANCED!</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
