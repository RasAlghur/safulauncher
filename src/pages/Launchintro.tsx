import Footer from "../components/generalcomponents/Footer";
import Hero from "../components/launchintro/Hero";
import PlatformStats from "../components/generalcomponents/PlatformStats";
import HowItWorks from "../components/generalcomponents/HowItWorks";
import Navbar from "../components/launchintro/Navbar";

const LaunchIntro = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <div className="mountain dark:bg-none">
        <PlatformStats />
        <HowItWorks />
      </div>
      <Footer />
    </div>
  );
};

export default LaunchIntro;
