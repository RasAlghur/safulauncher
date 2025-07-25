const RocketSpinner2 = () => {
  const dotCount = 8;
  const dots = Array.from({ length: dotCount });

  return (
    <div className="relative w-20 h-20">
      {dots.map((_, i) => (
        <span
          key={i}
          className="absolute w-3 h-3 bg-white rounded-full animate-roller"
          style={{
            transformOrigin: "40px 40px",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}

      <style>
        {`
          @keyframes roller {
            0% {
              transform: rotate(0deg) translateX(40px) rotate(0deg);
              opacity: 0.2;
            }
            50% {
              transform: rotate(180deg) translateX(40px) rotate(-180deg);
              opacity: 1;
            }
            100% {
              transform: rotate(360deg) translateX(40px) rotate(-360deg);
              opacity: 0.2;
            }
          }

          .animate-roller {
            animation: roller 1.2s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default RocketSpinner2;
