import telegram from "../../assets/telegram.png";
import twitter from "../../assets/twitter.png";
import discord from "../../assets/discord.png";
import linkedin from "../../assets/linkedin.png";
import facebook from "../../assets/facebook.png";
import youtube from "../../assets/youtube.png";
import logo from "../../assets/logo.png";
import DustParticles from "./DustParticles";

const footerItems = [
  {
    icon: twitter,
    link: "#",
  },
  {
    icon: telegram,
    link: "#",
  },
  {
    icon: discord,
    link: "#",
  },
  {
    icon: linkedin,
    link: "#",
  },
  {
    icon: facebook,
    link: "#",
  },
  {
    icon: youtube,
    link: "#",
  },
];

const Footer = () => {
  return (
    <footer className="lg:px-[40px] py-[30px] lg:py-[60px] border-t border-t-[#0C8CE0]/10 relative">
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className="lg:size-[30rem] lg:w-[50rem] lg:h-[15rem] rounded-full bg-[#3BC3DB]/10 absolute top-6 -right-40 blur-3xl hidden dark:block"></div>
      <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-10 max-w-[1300px] mx-auto">
        {/* Left column */}
        <div className="flex flex-col items-center lg:items-start">
          <a href="/" className="flex items-center gap-2 mb-4">
            <img src={logo} alt="Safu Logo" className="" />
            <p className="text-2xl font-bold dark:text-white text-[#01061C]">
              Safu Launcher
            </p>
          </a>
          {/* Social links */}
          <div className="flex items-center space-x-4 mb-[32px]">
            {footerItems.map(({ icon, link }, index) => (
              <a
                key={index}
                href={link}
                className="flex items-center justify-center size-[34px] rounded-full"
              >
                <img src={icon} alt="" />
              </a>
            ))}
          </div>
          <p className="dark:text-white text-[#141313] hidden lg:block text-left">
            2025 Safu Launcher. All rights reserved
          </p>
        </div>

        {/* Right column */}
        <div className="flex flex-row gap-4 sm:gap-10 md:gap-14 lg:gap-20 xl:gap-[150px] w-full justify-center lg:justify-end">
          {["About Us", "Services", "Learn"].map((section, idx) => (
            <div key={idx}>
              <h3 className="font-raleway dark:text-[#ECF1F0] text-black font-semibold mb-5 text-left">
                {section}
              </h3>
              <ul className="flex flex-col items-start gap-5 text-white">
                {idx === 0 &&
                  ["About", "Platform Stats", "Legal & Privacy"].map(
                    (item, i) => (
                      <li key={i}>
                        <a
                          href="#"
                          className="text-[#141313] dark:text-[#B6B6B6]"
                        >
                          {item}
                        </a>
                      </li>
                    )
                  )}
                {idx === 1 &&
                  ["Key Benefits", "Leaderboard", "Tokenomics"].map(
                    (item, i) => (
                      <li key={i}>
                        <a
                          href="#"
                          className="text-[#141313] dark:text-[#B6B6B6]"
                        >
                          {item}
                        </a>
                      </li>
                    )
                  )}
                {idx === 2 &&
                  ["How it works", "Roadmap", "MarketUpdates"].map(
                    (item, i) => (
                      <li key={i}>
                        <a
                          href="#"
                          className="text-[#141313] dark:text-[#B6B6B6]"
                        >
                          {item}
                        </a>
                      </li>
                    )
                  )}
              </ul>
            </div>
          ))}
        </div>
        <p className="dark:text-white text-[#141313] text-sm block lg:hidden ">
          2025 Safu Launcher. All rights reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
