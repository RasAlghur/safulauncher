import { useEffect, useRef, lazy, Suspense } from "react";
import { useInView } from "react-intersection-observer";
import { useAccount, useReadContract } from "wagmi";
import { LAUNCHER_ABI, SAFU_LAUNCHER_CA } from "../web3/config";
import { pureMetrics } from "../web3/readContracts";
import Navbar from "../components/landingpage/Navbar";
import Hero from "../components/landingpage/Hero";
// import KeyBenefits from "../components/landingpage/KeyBenefits";
// import HowItWorks from "../components/generalcomponents/HowItWorks";
// import Tokenomics from "../components/landingpage/Tokenomics";
// import WhySafu from "../components/landingpage/WhySafu";
import Footer from "../components/generalcomponents/Footer";
// import Roadmap from "../components/landingpage/Roadmap";
// import PlatformStats from "../components/landingpage/PlatformStats";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useUser } from "../context/user.context";
const LazyPlatformStats = lazy(
  () => import("../components/landingpage/PlatformStats")
);
const LazyKeyBenefits = lazy(
  () => import("../components/landingpage/KeyBenefits")
);
const LazyTokenomics = lazy(
  () => import("../components/landingpage/Tokenomics")
);
const LazyRoadmap = lazy(() => import("../components/landingpage/Roadmap"));
const LazyHowItWorks = lazy(
  () => import("../components/generalcomponents/HowItWorks")
);
const LazyWhySafu = lazy(() => import("../components/landingpage/WhySafu"));

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
    data: getMetrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useReadContract({
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA as `0x${string}`,
    functionName: "getMetrics",
  });

  const ringRefs = useRef<HTMLDivElement[]>([]);
  const { ref: statsRef, inView: showStats } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const { ref: benefitsRef, inView: showBenefits } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const { ref: tokenomicsRef, inView: showTokenomics } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const { ref: roadmapRef, inView: showRoadmap } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const { ref: howItWorksRef, inView: showHowItWorks } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const { ref: whySafuRef, inView: showWhySafu } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const shouldRefetch = !isLoadingMetrics;

  useEffect(() => {
    let isMounted = true;
    if (shouldRefetch) {
      refetchMetrics();
    }

    if (isConnected && isMounted) {
      saveOrFetchUser(String(address));
    }

    return () => {
      isMounted = false;
    };
  }, [shouldRefetch, refetchMetrics, isConnected, saveOrFetchUser, address]);

  // const { data: totalVolumeETH, isLoading: isLoadingTotalVolumeETH, refetch: refetchTotalVolumeETH } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalVolumeETH'
  //     }
  // );
  // const { data: totalFeesETH, isLoading: isLoadingTotalFeesETH, refetch: refetchTotalFeesETH } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalFeesETH'
  //     }
  // );
  // const { data: totalTokensLaunched, isLoading: isLoadingTotalTokensLaunched, refetch: refetchTotalTokensLaunched } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalTokensLaunched'
  //     }
  // );
  // const { data: totalTokensListed, isLoading: isLoadingTotalTokensListed, refetch: refetchTotalTokensListed } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalTokensListed'
  //     }
  // );
  // const { data: totalTaxedTokens, isLoading: isLoadingTotalTaxedTokens, refetch: refetchTotalTaxedTokens } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalTaxedTokens'
  //     }
  // );
  // const { data: totalZeroTaxTokens, isLoading: isLoadingTotalZeroTaxTokens, refetch: refetchTotalZeroTaxTokens } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalZeroTaxTokens'
  //     }
  // );

  // console.log(getMetrics);
  // console.log("totalVolumeETH", totalVolumeETH);
  // console.log("totalFeesETH", totalFeesETH);
  // console.log("totalTokensLaunched", totalTokensLaunched);
  // console.log("totalTokensListed", totalTokensListed);
  // console.log("totalTaxedTokens", totalTaxedTokens);
  // console.log("totalZeroTaxTokens", totalZeroTaxTokens);

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
          totalVolumeETH:{" "}
          {isConnected && getMetrics && getMetrics[0] !== undefined
            ? Number(getMetrics[0]) / 1e18
            : pureMetrics[0] !== undefined
            ? Number(pureMetrics[0]) / 1e18
            : 0}{" "}
          ETH
        </p>
        <p>
          totalFeesETH:{" "}
          {isConnected && getMetrics && getMetrics[1] !== undefined
            ? Number(getMetrics[1]) / 1e18
            : pureMetrics[1] !== undefined
            ? Number(pureMetrics[1]) / 1e18
            : 0}{" "}
          ETH
        </p>
        <p>
          totalTokensLaunched:{" "}
          {isConnected ? getMetrics?.[2] : pureMetrics?.[2]}
        </p>
        <p>
          totalTokensListed: {isConnected ? getMetrics?.[3] : pureMetrics?.[3]}
        </p>
        <p>
          totalTaxedTokens: {isConnected ? getMetrics?.[4] : pureMetrics?.[4]}
        </p>
        <p>
          totalZeroTaxTokens: {isConnected ? getMetrics?.[5] : pureMetrics?.[5]}
        </p>
        <p>
          DevRewardETH:{" "}
          {isConnected && getMetrics && getMetrics[6] !== undefined
            ? Number(getMetrics[6]) / 1e18
            : pureMetrics[1] !== undefined
            ? Number(pureMetrics[6]) / 1e18
            : 0}{" "}
          ETH
        </p>
      </div>
      <Navbar />
      <Hero />
      <div ref={statsRef}>
        {showStats && (
          <Suspense fallback={null}>
            <LazyPlatformStats />
          </Suspense>
        )}
      </div>

      <div className="mountain dark:bg-none">
        <div className="relative z-10 overflow-x-hidden">
          <div ref={benefitsRef}>
            {showBenefits && (
              <Suspense fallback={null}>
                <LazyKeyBenefits />
              </Suspense>
            )}
          </div>
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
          <div ref={howItWorksRef}>
            {showHowItWorks && (
              <Suspense fallback={null}>
                <LazyHowItWorks />
              </Suspense>
            )}
          </div>
        </div>
        <div ref={tokenomicsRef}>
          {showTokenomics && (
            <Suspense fallback={null}>
              <LazyTokenomics />
            </Suspense>
          )}
        </div>
      </div>
      <div ref={whySafuRef}>
        {showWhySafu && (
          <Suspense fallback={null}>
            <LazyWhySafu />
          </Suspense>
        )}
      </div>

      <div ref={roadmapRef}>
        {showRoadmap && (
          <Suspense fallback={null}>
            <LazyRoadmap />
          </Suspense>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Home;
