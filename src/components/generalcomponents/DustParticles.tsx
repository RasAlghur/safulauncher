import { useMemo } from "react";

const DustParticles = () => {
  const particles = useMemo(() => {
    return new Array(80).fill(0).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.6 + 0.2,
      duration: `${2 + Math.random() * 3}s`,
      delay: `${Math.random() * 4}s`,
    }));
  }, []); // Only computed once

  return (
    <div className="w-full h-full">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute w-[2px] h-[2px] dark:bg-gray-200 rounded-full animate-twinkle"
          style={{
            top: p.top,
            left: p.left,
            opacity: p.opacity,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

export default DustParticles;
