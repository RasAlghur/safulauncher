// safulauncher/src/pages/home.tsx
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { getPureMetrics } from "../web3/readContracts";
import Navbar from "../components/landingpage/Navbar";
import Hero from "../components/landingpage/Hero";
import KeyBenefits from "../components/landingpage/KeyBenefits";
import HowItWorks from "../components/generalcomponents/HowItWorks";
import Tokenomics from "../components/landingpage/Tokenomics";
import WhySafu from "../components/landingpage/WhySafu";
import Footer from "../components/generalcomponents/Footer";
import Roadmap from "../components/landingpage/Roadmap";
import PlatformStats from "../components/landingpage/PlatformStats";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useUser } from "../context/user.context";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";

gsap.registerPlugin(ScrollTrigger);

/**
 * Description placeholder
 *
 * @returns {*}
 */
function Home() {
  const [combinedMetrics, setCombinedMetrics] = useState<bigint[] | null>(null);
  const { isConnected, address } = useAccount();
  const { saveOrFetchUser } = useUser();
  const networkInfo = useNetworkEnvironment();

  const ringRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    let isMounted = true;

    if (isConnected && isMounted) {
      saveOrFetchUser(String(address));
    }

    return () => {
      isMounted = false;
    };
  }, [
    isConnected,
    saveOrFetchUser,
    address,
  ]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const metrics = await getPureMetrics(networkInfo.chainId);
      setCombinedMetrics(metrics);
    };

    fetchMetrics();
  }, [networkInfo.chainId]);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    if (!isDark) return;

    const ctx = gsap.context(() => {
      gsap.from(ringRefs.current, {
        scrollTrigger: {
          trigger: ringRefs.current[0],
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        scale: 0.8,
        opacity: 0,
        stagger: 0.15,
        duration: 1.4,
        ease: "power2.out",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="overflow-x-hidden">
      <div className="hidden">
        <p>totalVolumeETH: {Number(combinedMetrics?.[0] || 0) / 1e18} ETH</p>
        <p>totalFeesETH: {Number(combinedMetrics?.[1] || 0) / 1e18} ETH</p>
        <p>totalTokensLaunched: {combinedMetrics?.[2]?.toString()}</p>
        <p>totalTokensListed: {combinedMetrics?.[3]?.toString()}</p>
        <p>totalTaxedTokens: {combinedMetrics?.[4]?.toString()}</p>
        <p>totalZeroTaxTokens: {combinedMetrics?.[5]?.toString()}</p>
        <p>DevRewardETH: {Number(combinedMetrics?.[6] || 0) / 1e18} ETH</p>
      </div>
      <Navbar />
      <Hero />
      <PlatformStats />

      <div className="mountain dark:bg-none">
        <div className="relative z-10 overflow-x-hidden">
          <KeyBenefits />
          {/* Animated orbital rings (dark mode only) */}
          {[500, 650, 800, 950].map((size, i) => (
            <div
              key={i}
              ref={(el) => {
                ringRefs.current[i] = el!;
              }}
              className="absolute left-0 rounded-full border-r-3 border-[#172654] hidden dark:block -z-10"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                top: `${400 - size / 2}px`,
              }}
            />
          ))}
          <HowItWorks />
        </div>
        <Tokenomics />
      </div>
      <WhySafu />
      <Roadmap />
      <Footer />
    </div>
  );
}

export default Home;
