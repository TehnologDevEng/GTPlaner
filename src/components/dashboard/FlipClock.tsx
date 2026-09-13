import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const Digit = ({ value }: { value: string }) => (
  <div className="relative bg-[#0A0A0B] border border-[#2A2A2A] rounded-xl flex-1 aspect-[0.72] max-w-[80px] sm:max-w-[96px] min-w-[30px] flex items-center justify-center overflow-hidden shadow-lg">
    {/* Top Gradient for 3D effect */}
    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.05] to-transparent border-b border-black/80 z-0"></div>
    {/* The center hinge line */}
    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/90 z-20 translate-y-[-50%] shadow-[0_1px_1px_rgba(255,255,255,0.05)]"></div>
    
    <span className="text-[28px] sm:text-[48px] md:text-[64px] font-bold text-[#00BCC5] tracking-tighter z-10 font-mono leading-none">
      {value}
    </span>
  </div>
);

export function FlipClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = format(time, 'HH').split('');
  const minutes = format(time, 'mm').split('');

  return (
    <div className="flex items-center w-full max-w-[360px] gap-1 sm:gap-2">
      <Digit value={hours[0]} />
      <Digit value={hours[1]} />
      
      <div className="flex flex-col gap-1.5 sm:gap-2 mx-0.5 sm:mx-2 animate-pulse shrink-0">
        <div className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-[#00BCC5]/60"></div>
        <div className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-[#00BCC5]/60"></div>
      </div>
      
      <Digit value={minutes[0]} />
      <Digit value={minutes[1]} />
    </div>
  );
}
