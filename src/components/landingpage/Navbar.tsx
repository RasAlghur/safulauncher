import { useState, useEffect } from "react";
import { FiMenu, FiX } from "react-icons/fi";

import logo from "../../assets/logo.png";
import rocket from "../../assets/rocket.png";
import { Link } from "react-router-dom";
import ThemeToggle from "../../lib/ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [navBg, setNavBg] = useState(false);
  const [activeLink, setActiveLink] = useState("#home");

  useEffect(() => {
    const handler = () => {
      if (window.scrollY >= 90) {
        setNavBg(true);
      } else {
        setNavBg(false);
      }
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleSetActive = (link: string) => {
    setActiveLink(link);
    setIsOpen(false); // Close mobile menu on selection
  };

  return (
    <>
      <header
        className={`py-5 px-6 md:px-[79px] ${
          navBg ? "bg-Dark-Purple" : "bg-[#ffffff0d] backdrop-blur-[40px]"
        } fixed w-full top-0 left-0 z-50 transition-all duration-300 backdrop-blur-[20px]`}
      >
        <nav className="flex justify-between items-center">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="Safu Logo" className="" />
            <p className="text-2xl font-bold dark:text-white text-black">
              Safu Launcher
            </p>
          </a>

          {/* Desktop Menu */}
          <ul className="hidden lg:flex space-x-[30px] items-center text-lg font-raleway font-medium">
            {[
              { label: "Platform Stats", href: "#stats" },
              { label: "Key Benefit", href: "#benefit" },
              { label: "How it works", href: "#howitworks" },
              { label: "Tokenomics", href: "#tokenomics" },
              { label: "Why Safu Launcher", href: "#whysafu" },
              { label: "Roadmap", href: "#roadmap" },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`transition ${
                    activeLink === item.href
                      ? "text-[#0C8CE0]"
                      : "dark:text-white text-black"
                  } hover:text-Purple`}
                  onClick={() => handleSetActive(item.href)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <Link
            to={"/launchintro"}
            className="hidden text-[1rem] font-bold px-[24px] py-[13px] lg:flex items-center justify-center text-white cursor-pointer gap-3 bg-[#0C8CE0] rounded-full"
          >
            <img src={rocket} alt="" />
            <p>Launch App</p>
          </Link>

          <ThemeToggle />

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-Light-Gray text-3xl z-50 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FiX /> : <FiMenu className="text-white" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <div
          className={`fixed top-0 left-0 w-full h-full bg-black/30 backdrop-blur-md transform ${
            isOpen ? "translate-x-0" : "translate-x-full"
          } transition-transform duration-300 lg:hidden`}
          onClick={() => setIsOpen(false)}
        >
          <ul
            className="absolute top-0 right-0 w-64 h-full bg-Dark-Purple text-Light-Gray pt-20 px-6 flex flex-col space-y-10 text-lg font-raleway font-medium shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { label: "", href: "#home" },
              { label: "How it Works", href: "#howitworks" },
              { label: "Statistics", href: "#statistics" },
              { label: "How to Win", href: "#howtowin" },
              { label: "Ready to Play", href: "#readytoplay" },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`transition ${
                    activeLink === item.href ? "text-Primary" : "text-white"
                  } hover:text-Purple`}
                  onClick={() => handleSetActive(item.href)}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <button className="flex text-[1rem] font-semibold rounded-[40px] px-[24px] py-[13px] lg:hidden items-center justify-center text-white bg-Purple cursor-pointer">
              <img src={rocket} alt="" />
              <p>Launch App</p>
            </button>
          </ul>
        </div>
      </header>
    </>
  );
};

export default Navbar;
