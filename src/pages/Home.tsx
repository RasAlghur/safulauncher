import { useEffect, useRef, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { LAUNCHER_ABI_V1, LAUNCHER_ABI_V2, SAFU_LAUNCHER_CA_V1, SAFU_LAUNCHER_CA_V2 } from "../web3/config";
import { pureCombinedMetrics } from "../web3/readContracts";
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

gsap.registerPlugin(ScrollTrigger);


/**
 * Description placeholder
 *
 * @returns {*}
 */
function Home() {
  const { isConnected, address } = useAccount();
  const { saveOrFetchUser } = useUser();
  const {
    data: getV2Metrics,
    isLoading: isLoadingV2Metrics,
    refetch: refetchV2Metrics,
  } = useReadContract({
    ...LAUNCHER_ABI_V2,
    address: SAFU_LAUNCHER_CA_V2 as `0x${string}`,
    functionName: "getMetrics",
  });

  const {
    data: getMetrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useReadContract({
    ...LAUNCHER_ABI_V1,
    address: SAFU_LAUNCHER_CA_V1 as `0x${string}`,
    functionName: "getMetrics",
  });

  const ringRefs = useRef<HTMLDivElement[]>([]);

  const shouldRefetch = !isLoadingMetrics;

  const combinedMetrics = useMemo(() => {
    if (!getMetrics || !getV2Metrics) return null;

    // Convert to mutable arrays
    const v1Metrics = Array.from(getMetrics);
    const v2Metrics = Array.from(getV2Metrics);

    return v1Metrics.map((val, idx) =>
      val + (v2Metrics[idx] || 0n)
    );
  }, [getMetrics, getV2Metrics]);

  // Determine what to display
  const displayMetrics = useMemo(() => {
    if (isConnected) {
      if (combinedMetrics) return combinedMetrics;
      if (getMetrics) return Array.from(getMetrics) as bigint[];
    }
    return pureCombinedMetrics as bigint[];
  }, [isConnected, combinedMetrics, getMetrics]);

  useEffect(() => {
    let isMounted = true;

    if (!isLoadingMetrics) refetchMetrics();
    if (!isLoadingV2Metrics) refetchV2Metrics();

    if (isConnected && isMounted) {
      saveOrFetchUser(String(address));
    }

    return () => {
      isMounted = false;
    };
  }, [shouldRefetch, refetchMetrics, isConnected, saveOrFetchUser, address]);

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
        <p>
          totalVolumeETH: {Number(displayMetrics?.[0] || 0) / 1e18} ETH
        </p>
        <p>
          totalFeesETH: {Number(displayMetrics?.[1] || 0) / 1e18} ETH
        </p>
        <p>
          totalTokensLaunched: {displayMetrics?.[2]?.toString()}
        </p>
        <p>
          totalTokensListed: {displayMetrics?.[3]?.toString()}
        </p>
        <p>
          totalTaxedTokens: {displayMetrics?.[4]?.toString()}
        </p>
        <p>
          totalZeroTaxTokens: {displayMetrics?.[5]?.toString()}
        </p>
        <p>
          DevRewardETH: {Number(displayMetrics?.[6] || 0) / 1e18} ETH
        </p>
      </div>
      <Navbar />
      <Hero />
      <PlatformStats metrics={displayMetrics} />

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
