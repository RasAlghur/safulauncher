import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DustParticles from "../generalcomponents/DustParticles";

gsap.registerPlugin(ScrollTrigger);

const KeyBenefits = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".fade-in-up").forEach((el, index) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 50 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
            delay: index * 0.1,
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative dark:text-white text-black py-20 px-6 lg:px-32 lg:pt-28 overflow-hidden"
      id="benefit"
    >
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center fade-in-up">
        <h2 className="text-3xl font-bold mb-12">Key Benefits</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left">
          {/* Users */}
          <div className="flex justify-between fade-in-up">
            <div>
              <h3 className="text-xl font-semibold mb-4">For Users</h3>
              <ul className="space-y-4">
                <li>Invest with peace of mind — rug pulls are impossible.</li>
                <li>Secure an early position before public listing.</li>
                <li>Trade freely in the pre-DEX pool — no locked presales.</li>
                <li>
                  Full transparency — every feature (bundles, whitelist, tax) is
                  on-chain and visible on each token’s trading page.
                </li>
              </ul>
            </div>
            <div className="h-full w-[1px] lg:block hidden bg-Primary" />
          </div>

          <div className="h-[1px] w-full block lg:hidden bg-Primary fade-in-up" />

          {/* Developers */}
          <div className="fade-in-up">
            <h3 className="text-xl font-semibold mb-4">For Developers</h3>
            <ul className="space-y-4">
              <li>
                Earn 0.2 ETH immediately when your token hits the bonding curve.
              </li>
              <li>
                Launch with zero upfront capital — community funds your
                liquidity.
              </li>
              <li>Instant exposure to the SAFU community at token creation.</li>
              <li>
                Hands-off operation—once deployed, the contract automates
                listing, fees, and liquidity.
              </li>
              <li>
                Flexible setup—toggle whitelist, tax, or bundle allocations as
                needed.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KeyBenefits;
