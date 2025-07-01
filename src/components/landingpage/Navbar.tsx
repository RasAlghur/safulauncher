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
      setNavBg(window.scrollY >= 90);
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleSetActive = (link: string) => {
    setActiveLink(link);
    setIsOpen(false);
  };

  const menuItems = [
    { label: "Platform Stats", href: "#stats" },
    { label: "Key Benefit", href: "#benefit" },
    { label: "How it works", href: "#howitworks" },
    { label: "Tokenomics", href: "#tokenomics" },
    { label: "Why Safu Launcher", href: "#whysafu" },
    { label: "Roadmap", href: "#roadmap" },
  ];

  return (
    <>
      <header
        className={`py-2 px-6 xl:px-[79px] fixed w-full top-0 left-0 z-50 transition-all duration-300 backdrop-blur-[20px] ${
          navBg ? "bg-Dark-Purple" : "bg-[#ffffff0d]"
        }`}
      >
        <nav className="flex justify-between items-center">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="Safu Logo" />
            <p className="text-2xl font-bold dark:text-white text-black hidden lg:block">
              Safu Launcher
            </p>
          </a>

          {/* Desktop Nav */}
          <ul className="hidden xl:flex xl:space-x-[30px] items-center font-raleway font-medium">
            {menuItems.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  className={`transition ${
                    activeLink === href
                      ? "text-[#0C8CE0]"
                      : "dark:text-white text-black"
                  } hover:text-Purple`}
                  onClick={() => handleSetActive(href)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <Link
            to={"/launchintro"}
            className="hidden text-[1rem] font-bold px-[24px] py-[13px] xl:flex items-center justify-center text-white cursor-pointer gap-3 bg-[#0C8CE0] rounded-full"
          >
            <img src={rocket} alt="" />
            <p>Launch App</p>
          </Link>

          <div className="flex items-center gap-3">
            <div className="">
              <ThemeToggle />
            </div>

            {/* Mobile menu toggle */}
            <button className="xl:hidden z-[60]">
              {isOpen ? (
                <FiX
                  className="dark:text-white text-black text-4xl cursor-pointer"
                  onClick={() => setIsOpen(false)}
                />
              ) : (
                <FiMenu
                  className="dark:text-white text-black text-4xl cursor-pointer"
                  onClick={() => setIsOpen(true)}
                />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay & Slide-In Panel */}
      {isOpen && (
        <div
          className={`block xl:hidden fixed inset-0 z-20 transition-all duration-300 `}
          onClick={() => setIsOpen(false)}
        >
          <div
            className={`absolute z-10 sm:w-1/2 bg-white/2 backdrop-blur-2xl text-black right-0 top-0 h-screen w-[70%] transform transition-transform duration-300 ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-4">
              <FiX
                className="text-white text-2xl cursor-pointer"
                onClick={() => setIsOpen(false)}
              />
            </div>
            <div className="flex flex-col px-6 gap-6 mt-20">
              {menuItems.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="text-lg uppercase tracking-widest dark:text-white text-black"
                  onClick={() => handleSetActive(href)}
                >
                  {label}
                </a>
              ))}

              <Link
                to="/launchintro"
                className="mt-6 w-fit flex items-center gap-2 bg-[#0C8CE0] text-white px-5 py-2 rounded-full text-sm font-semibold"
                onClick={() => setIsOpen(false)}
              >
                <img src={rocket} alt="Rocket Icon" className="w-4 h-4" />
                Launch App
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
