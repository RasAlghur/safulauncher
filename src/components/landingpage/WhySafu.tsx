import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import community from "../../assets/community.png";
import automation from "../../assets/bot.png";
import trust from "../../assets/handshake.png";
import ecosystem from "../../assets/ecosystem.png";
import DustParticles from "../generalcomponents/DustParticles";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Community- First Launches",
    description:
      "Everyone trades on the same curve — no private rounds or “snipers.”",
    icon: community,
  },
  {
    title: "Hands-Off Automation",
    description:
      "From token deploy to Uniswap listing, every step runs on-chain with zero manual intervention.",
    icon: automation,
  },
  {
    title: "Built-In Trust",
    description:
      "LP lock/burn and ownership renouncement guard against rug pulls.",
    icon: trust,
  },
  {
    title: "$SAFU Ecosystem",
    description: "Holders gain priority launch access and future fee rebates.",
    icon: ecosystem,
  },
];

const WhySafu = () => {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const buttonRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate cards with stagger
      gsap.to(cardsRef.current, {
        opacity: 1,
        scale: 1,

        duration: 0.7,
        ease: "power3.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });

      // Animate button after cards
      gsap.to(buttonRef.current, {
        opacity: 1,

        scale: 1,
        duration: 0.6,
        delay: 0.2,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: buttonRef.current,
          start: "top 95%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="whysafu"
      className="lg:py-20 relative overflow-x-hidden"
      ref={sectionRef}
    >
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        <DustParticles />
      </div>

      <div className="bg-[#0A0E1A] text-white py-16 px-6 md:px-20 text-center">
        <h2 className="text-3xl font-bold mb-12">Why Safu Launcher?</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="bg-[#0F172A] border border-blue-900 rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg transition duration-300"
            >
              <img
                src={feature.icon}
                alt={feature.title}
                className="mb-4 w-14 h-14"
              />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center">
          <button
            ref={buttonRef}
            className="text-[1rem] font-bold px-[24px] py-[13px] text-white cursor-pointer gap-3 bg-[#0C8CE0] rounded-full"
          >
            <p>Connect Wallet</p>
          </button>
        </div>
      </div>
    </section>
  );
};

export default WhySafu;
