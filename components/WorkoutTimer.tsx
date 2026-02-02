import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface WorkoutTimerProps {
  initialTime?: number; // in seconds
  onTimeUpdate?: (time: number) => void;
  isRunning?: boolean;
  mode?: 'stopwatch' | 'timer';
  className?: string;
  showControls?: boolean;
}

const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ 
    initialTime = 0, 
    onTimeUpdate, 
    mode = 'stopwatch',
    className = '',
    showControls = true
}) => {
  const [time, setTime] = useState(initialTime);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setTime((prev) => {
            const next = mode === 'stopwatch' ? prev + 1 : prev - 1;
            if (next < 0 && mode === 'timer') {
                setRunning(false);
                return 0;
            }
            return next;
        });
      }, 1000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  useEffect(() => {
      if(onTimeUpdate) onTimeUpdate(time);
  }, [time, onTimeUpdate]);

  const toggle = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent block expansion/collapse
      setRunning(!running);
  };

  const reset = (e: React.MouseEvent) => {
      e.stopPropagation();
      setRunning(false);
      setTime(initialTime);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="font-mono font-bold text-xl tabular-nums tracking-wide">
        {formatTime(time)}
      </div>
      {showControls && (
          <div className="flex gap-1">
            <button 
                onClick={toggle}
                className={`p-1.5 rounded-full transition-colors ${running ? 'bg-zinc-800 text-yellow-500' : 'bg-zinc-800 text-[#00FF00]'}`}
            >
                {running ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button 
                onClick={reset}
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
                <RotateCcw size={14} />
            </button>
          </div>
      )}
    </div>
  );
};

export default WorkoutTimer;