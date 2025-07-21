import { useEffect, useRef } from "react";
import rocket from "../../assets/rocket-1.png";

const RocketLoader = () => {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const count = 50;
    const scene = sceneRef.current;

    if (!scene) return;

    // Clean up old stars
    scene.querySelectorAll("i").forEach((el) => el.remove());

    for (let i = 0; i < count; i++) {
      const star = document.createElement("i");
      const x = Math.floor(Math.random() * window.innerWidth);
      const duration = Math.random() * 2 + 1;
      const delay = Math.random() * 3;
      const h = Math.random() * 100;

      star.style.left = `${x}px`;
      star.style.width = "1px";
      star.style.height = `${50 + h}px`;
      star.style.animationDuration = `${duration}s`;
      star.style.animationDelay = `${delay}s`;

      scene.appendChild(star);
    }
  }, []);

  return (
    <div
      className="scene flex flex-col items-center justify-center gap-3"
      ref={sceneRef}
    >
      <div className="rocket relative">
        <img
          src={rocket}
          alt="Launching Rocket"
          className=""
          fetchPriority="high"
        />
      </div>
      <p className="text-white font-semibold text-lg mt-2 animate-pulse">
        Launching...
      </p>
    </div>
  );
};

export default RocketLoader;
