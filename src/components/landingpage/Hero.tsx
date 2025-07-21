import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
// import moon from "../../assets/moon.png";
import rocket from "../../assets/rocket.png";
import DustParticles from "../generalcomponents/DustParticles";
import spinningMoon from "../../assets/spinning-moon.webm";

const Hero = () => {
  const headlineRef = useRef(null);
  const paragraphRef = useRef(null);
  const buttonsRef = useRef(null);
  const moonRef = useRef(null);
  const ringsRef = useRef<HTMLDivElement[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        headlineRef.current,
        {
          opacity: 0,

          duration: 1,
        },
        { opacity: 1 }
      )
        .from(
          paragraphRef.current,
          {
            opacity: 0,
            y: 30,
            duration: 1,
          },
          "-=0.5"
        ) // starts halfway through the previous animation
        .from(
          buttonsRef.current,
          {
            opacity: 0,
            y: 20,
            duration: 1,
          },
          "-=0.6"
        ) // overlaps even more
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
        ); // overlaps with the button animation

      // Moon floating animation (not part of timeline — looped)
      gsap.to(moonRef.current, {
        y: 10,
        repeat: -1,
        yoyo: true,
        duration: 2,
        ease: "sine.inOut",
      });
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <section className="pb-[50px] pt-[100px] lg:pt-[20px] xl:pt-[50px] lg:h-screen overflow-hidden relative z-[10] hero-white-background">
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 px-4 lg:px-[80px] lg:py-[28px] gap-10 lg:mt-16">
        {/* Left Text Section */}
        <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
          <h1
            ref={headlineRef}
            className="text-[38px] sm:text-[44px] md:text-[50px] lg:text-[60px] xl:text-[70px] lg:leading-[1] font-black mb-6 dark:text-white text-black leading-tight font-raleway"
          >
            Launch Your <span className="text-[#0C8CE0]">Token with</span>{" "}
            Confidence
          </h1>

          <p
            ref={paragraphRef}
            className="text-base sm:text-lg md:text-2xl lg:text-lg mb-6 text-black dark:text-[#B6B6B6] max-w-md md:max-w-[700px] lg:max-w-none"
          >
            Community - powered liquidity, automatic DEX listing, and built-in
            safety — no up-front funding needed.
          </p>
          <p
            ref={paragraphRef}
            className="text-base sm:text-lg md:text-xl lg:text-lg mb-6 text-black dark:text-[#B6B6B6] max-w-md md:max-w-[700px] lg:max-w-none"
          >
            SafuLauncher is a launchpad and trading platform that makes it easy
            for anyone to participate in new token launches. It guides a token
            from its very first sale through to listing on a decentralized
            exchange—without requiring developers to front-fund liquidity or
            rely on multiple tools.
          </p>
          <div
            ref={buttonsRef}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-[34px]"
          >
            <Link
              to={"/launchintro"}
              className="w-[200px] text-[1rem] font-bold px-[24px] py-[13px] flex items-center justify-center text-white cursor-pointer gap-3 hero-cta dark:bg-[#0C8CE0] rounded-full"
            >
              <img src={rocket} alt="rocket" className="w-4 h-4" />
              <p>Launch App</p>
            </Link>

            <a
              href="https://safulauncher-1.gitbook.io/safulauncher-docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-[200px] text-[1rem] font-bold px-[24px] py-[13px] flex items-center justify-center dark:text-white text-black cursor-pointer gap-3 bg-transparent rounded-full border-2 dark:border-white border-black"
            >
              <p>Read Doc</p>
            </a>
          </div>
        </div>

        {/* Right Image Section */}
        <div className="flex justify-center items-center relative mt-10 lg:mt-0">
          {/* Orbit Rings */}
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
                className="absolute rounded-full border-2 lg:border-l-2 border-[#172654] -z-20 hidden dark:block"
                style={{ width: size, height: size }}
              />
            );
          })}

          {/* Moon Image */}
          {/* Moon Image */}
          <video
            ref={moonRef}
            autoPlay
            loop
            muted
            playsInline
            className="rounded-full w-[300px] sm:size-[350px] lg:w-auto pr-[20px] hidden dark:block"
          >
            <source src={spinningMoon} type="video/webm" />
          </video>
          {/* Glow */}
          <div className="absolute right-10 top-1/3 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-[#3BC3DB]/10 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
