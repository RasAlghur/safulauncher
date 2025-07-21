import { useInView } from "react-intersection-observer";
import { useEffect, useState, lazy, Suspense } from "react";
import Footer from "../components/generalcomponents/Footer";
import Hero from "../components/launchintro/Hero";
// import PlatformStats from "../components/generalcomponents/PlatformStats";
// import HowItWorks from "../components/generalcomponents/HowItWorks";
import Navbar from "../components/launchintro/Navbar";
import RocketLoader from "../components/generalcomponents/Loader";
const LazyPlatformStats = lazy(
  () => import("../components/generalcomponents/PlatformStats")
);
const LazyHowItWorks = lazy(
  () => import("../components/generalcomponents/HowItWorks")
);

const LaunchIntro = () => {
  const [loading, setLoading] = useState(true);
  const { ref: statsRef, inView: showStats } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  const { ref: howItWorksRef, inView: showHowItWorks } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) return <RocketLoader />;

  return (
    <div>
      <Navbar />
      <Hero />
      <div className="mountain dark:bg-none relative">
        <div ref={statsRef}>
          {showStats && (
            <Suspense fallback={null}>
              <LazyPlatformStats />
            </Suspense>
          )}
        </div>
        <div ref={howItWorksRef}>
          {showHowItWorks && (
            <Suspense fallback={null}>
              <LazyHowItWorks />
            </Suspense>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LaunchIntro;
