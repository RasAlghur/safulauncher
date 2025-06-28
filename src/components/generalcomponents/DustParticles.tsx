const DustParticles = () => {
  const particles = new Array(80).fill(0);

  return (
    <div className="w-full h-full">
      {particles.map((_, i) => (
        <span
          key={i}
          className="absolute w-[2px] h-[2px] dark:bg-gray-200 rounded-full animate-twinkle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.2,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
};

export default DustParticles;
