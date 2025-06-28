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
      <PlatformStats />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default LaunchIntro;
