import { useEffect, useState } from "react";
import Footer from "../components/launchintro/Footer";
import Hero from "../components/launchintro/Hero";
import PlatformStats from "../components/generalcomponents/PlatformStats";
import HowItWorks from "../components/generalcomponents/HowItWorks";
import Navbar from "../components/launchintro/Navbar";
import RocketLoader from "../components/generalcomponents/Loader";

const LaunchIntro = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
        <PlatformStats />
        <HowItWorks />
      </div>
      <Footer />
    </div>
  );
};

export default LaunchIntro;
