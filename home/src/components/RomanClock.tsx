import { useState, useEffect, useRef } from 'react';
import './RomanClock.css';

// --- Custom Hook for the 3D Tilt Effect ---
const useTilt = (maxTilt = 8) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      const tiltX = y * maxTilt * -1;
      const tiltY = x * maxTilt;
      setTilt({ x: tiltX, y: tiltY });
    };

    const handleMouseLeave = () => {
      setTilt({ x: 0, y: 0 });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt]);

  return { ref, tilt };
};
// ------------------------------------------

export const RomanClock = () => {
  const { ref, tilt } = useTilt(10);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerID = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerID);
  }, []);

  // --- Time Calculation ---
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + (seconds / 60) * 6;
  const hourDeg = hours * 30 + (minutes / 60) * 30;

  const romanNumerals = [
    'XII', 'I', 'II', 'III', 'IV', 'V', 'VI',
    'VII', 'VIII', 'IX', 'X', 'XI'
  ];

  return (
    <div className="clock-stage">
      <div
        ref={ref}
        className="clock-container"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.5s ease-out',
        }}
      >
        {/* The metallic Bezel (الإطار المعدني) */}
        <div className="clock-bezel"></div>
        
        <div className="clock-face">
          {/* Inner Dial Texture (النسيج المشع الداخلي) */}
          <div className="inner-texture"></div>

          {/* Roman Numerals (الأرقام الرومانية) */}
          {romanNumerals.map((numeral, index) => (
            <div
              key={numeral}
              className="roman-numeral-holder"
              style={{
                transform: `rotate(${index * 30}deg) translate(0, -45%)`,
              }}
            >
              <span className="roman-numeral-text" style={{ transform: `rotate(${-index * 30}deg)` }}>
                {numeral}
              </span>
            </div>
          ))}

          {/* Clock Hands (العقارب) */}
          <div
            className="hand hour-hand"
            style={{ transform: `rotateZ(${hourDeg}deg)` }}
          ></div>
          <div
            className="hand minute-hand"
            style={{ transform: `rotateZ(${minuteDeg}deg)` }}
          ></div>
          <div
            className="hand second-hand"
            style={{ transform: `rotateZ(${secondDeg}deg)` }}
          ></div>

          {/* Center Cap (غطاء المنتصف) */}
          <div className="center-cap"></div>
        </div>
      </div>
    </div>
  );
};
