import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import moon from "../../assets/moon.png";
import DustParticles from "../generalcomponents/DustParticles";

const Hero = () => {
  const headlineRef = useRef(null);
  const paragraphRef1 = useRef(null);
  const paragraphRef2 = useRef(null);
  const buttonsRef = useRef(null);
  const moonRef = useRef(null);
  const ringsRef = useRef<HTMLDivElement[]>([]);
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(headlineRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
      })
        .from(
          paragraphRef1.current,
          {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.5"
        ) // starts halfway through the previous animation
        .from(
          paragraphRef2.current,
          {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.5"
        )
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

  return (
    <section className="py-[100px] lg:h-screen relative hero-white-background">
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] z-30 left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:px-[80px] lg:py-[28px]">
        <div className="lg:mt-20">
          <h1
            ref={headlineRef}
            className="lg:text-[70px]  mb-[34px] text-Primary font-black leading-[1.1] font-raleway tracking"
          >
            Safu
            <span className="dark:text-white text-[#01061C] font-bold">
              Launcher
            </span>
          </h1>
          <h2
            ref={paragraphRef1}
            className="text-[36px] dark:text-white text-black font-semibold mb-[34px] leading-[44px]"
          >
            Launch tokens to the moon with confidence.
          </h2>
          <p
            ref={paragraphRef2}
            className="text-[19px] mb-[34px] dark:text-[#B6B6B6] text-black"
          >
            We bond your community before liftoff, then seamlessly list on
            Uniswap once you hit orbit.
          </p>
          <div className="flex items-center gap-[34px]">
            <Link
              to={"/launch"}
              className="text-[1rem] font-bold px-[36px] py-[16px] lg:flex items-center justify-center text-white cursor-pointer gap-3 bg-[#0C8CE0] rounded-[18px]"
            >
              <p>Get Started</p>
            </Link>
          </div>
        </div>
        <div className="flex justify-end items-start relative">
          <div className="absolute right-20 top-1/3 w-[400px] h-[400px] bg-[#3BC3DB]/10 rounded-full blur-3xl" />
          <img
            ref={moonRef}
            src={moon}
            alt="moon"
            className="rounded-full pr-[20px] hidden dark:block"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
