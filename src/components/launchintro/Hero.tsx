import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
// import moon from "../../assets/moon.png";
import spinningMoon from "../../assets/spinning-moon.webm";
import rocketStartUp from "../../assets/rocket-start-up.png";

import DustParticles from "../generalcomponents/DustParticles";

const Hero = () => {
  const headlineRef = useRef(null);
  const paragraphRef = useRef(null);
  const buttonsRef = useRef(null);
  const moonRef = useRef(null);
  const rocketRef = useRef(null);
  const ringsRef = useRef<HTMLDivElement[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Track screen width to toggle mobile styles
  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    updateSize(); // Initial check
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // GSAP Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(paragraphRef.current, { opacity: 0, y: 30, duration: 1 }, "-=0.5")
        .from(buttonsRef.current, { opacity: 0, y: 20, duration: 1 }, "-=0.6")
        .from(
          ringsRef.current,
          {
            scale: 0.8,
            opacity: 0,
            stagger: 0.1,
            duration: 1.2,
            ease: "power2.out",
          },
          "-=0.8"
        );
      gsap.fromTo(
        rocketRef.current,
        { x: -500, y: 300, opacity: 0 },
        {
          x: 80,
          y: -150,
          opacity: 1,
          duration: 3,
          ease: "power1.inOut",
          repeat: -1,
          // yoyo: true,
        }
      );

      // Floating moon animation
      gsap.to(moonRef.current, {
        y: 10,
        repeat: -1,
        yoyo: true,
        duration: 2,
        ease: "sine.inOut",
      });
    });

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section className="pb-[50px] pt-[10px] lg:h-[80vh] overflow-hidden relative z-[10] hero-white-background">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 px-4 lg:py-[28px] gap-10 lg:mt-16 max-w-7xl mx-auto">
        {/* Left Section */}
        <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
          <h1
            ref={headlineRef}
            className="text-[42px] sm:text-[44px] md:text-[60px] xl:text-[70px] font-black mb-6  text-[#0C8CE0] leading-tight font-raleway"
          >
            Safu<span className="dark:text-white text-black">Launcher</span>
          </h1>
          <p
            ref={paragraphRef}
            className="text-[24px] sm:text-lg md:text-2xl lg:text-[36px] mb-6 text-black dark:text-[#B6B6B6] max-w-md lg:max-w-none font-bold"
          >
            Launch tokens to the moon with confidence.
          </p>
          <p
            ref={paragraphRef}
            className="text-base sm:text-lg lg:text-lg mb-6 text-black dark:text-[#B6B6B6] max-w-md lg:max-w-none"
          >
            We bond your community before liftoff, then seamlessly list on DEX
            once you hit orbit.
          </p>
          <div
            ref={buttonsRef}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-[34px]"
          >
            <Link
              to={"/launch"}
              className="text-[1rem] font-bold px-[24px] py-[13px] flex items-center justify-center text-white cursor-pointer gap-3 hero-cta dark:bg-[#0C8CE0] rounded-full"
            >
              <p>Get Started</p>
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex justify-center items-center relative mt-10 lg:mt-0">
          {/* Animated Orbit Rings */}
          {[0, 1, 2, 3, 4].map((i) => {
            const baseSize = isMobile ? 100 : 250;
            const gap = isMobile ? 100 : 200;
            const size = baseSize + i * gap;

            return (
              <div
                key={i}
                ref={(el) => {
                  if (el) ringsRef.current[i] = el;
                }}
                className="absolute rounded-full border-2 border-[#172654] -z-20 hidden dark:block"
                style={{ width: size, height: size }}
              />
            );
          })}

          {/* Moon Image */}
          {/* Moon */}

          <video
            ref={moonRef}
            autoPlay
            loop
            muted
            playsInline
            className="rounded-full w-[300px] sm:size-[350px] lg:w-auto pr-[20px] hidden dark:block z-10"
          >
            <source src={spinningMoon} type="video/webm" />
          </video>

          <img
            ref={rocketRef}
            src={rocketStartUp}
            alt="rocket"
            className="absolute bottom-[-50px] w-[80px] sm:w-[100px] lg:w-[140px] z-0 hidden dark:block"
          />

          {/* Glow Effect */}
          <div className="z-0 absolute right-10 top-1/3 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-[#3BC3DB]/10 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
