import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const Digit = ({ value }: { value: string }) => (
  <div className="relative bg-[#0A0A0C] border border-[#242429] rounded-xl flex-1 aspect-[0.74] max-w-[82px] sm:max-w-[92px] min-w-[44px] flex items-center justify-center overflow-hidden shadow-md">
    {/* Subtle top bevel */}
    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent border-b border-black/80 z-0" />
    {/* Center hinge hairline */}
    <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-black/90 z-20 -translate-y-1/2 shadow-[0_1px_1px_rgba(255,255,255,0.04)]" />

    <span className="text-[32px] sm:text-[48px] lg:text-[56px] font-bold text-[#00BCC5] tracking-tight z-10 font-mono tabular-nums leading-none">
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
    <div className="flex items-center justify-center w-full max-w-[390px] mx-auto gap-1.5 sm:gap-2.5">
      <Digit value={hours[0]} />
      <Digit value={hours[1]} />

      <div className="flex flex-col gap-2 sm:gap-2.5 mx-0.5 sm:mx-1.5 shrink-0" aria-hidden="true">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00BCC5]/55" />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00BCC5]/55" />
      </div>

      <Digit value={minutes[0]} />
      <Digit value={minutes[1]} />
    </div>
  );
}
