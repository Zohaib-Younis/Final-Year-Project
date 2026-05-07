import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface CountdownProps {
  targetDate: string;
  onEnd?: () => void;
}

export default function Countdown({ targetDate, onEnd }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference <= 0) {
        if (!timeLeft.isExpired && onEnd) onEnd();
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (updated.isExpired) clearInterval(timer);
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs uppercase tracking-wider">
        <Timer size={14} />
        <span>Closed</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-superior font-bold text-xs uppercase tracking-wider">
        <Timer size={14} className="animate-pulse" />
        <span>Time Left</span>
      </div>
      <div className="flex gap-1">
        {[
          { label: 'd', val: timeLeft.days },
          { label: 'h', val: timeLeft.hours },
          { label: 'm', val: timeLeft.minutes },
          { label: 's', val: timeLeft.seconds }
        ].map((unit, idx) => (
          unit.val > 0 || idx >= 2 ? (
            <div key={unit.label} className="bg-superior/5 px-2 py-1 rounded border border-superior/10 flex items-baseline gap-0.5">
              <span className="text-sm font-black text-superior tabular-nums leading-none">{unit.val.toString().padStart(2, '0')}</span>
              <span className="text-[10px] font-bold text-superior/60 uppercase">{unit.label}</span>
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
}
