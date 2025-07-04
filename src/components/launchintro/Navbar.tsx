import { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import logo from "../../assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useTokenContext } from "../../context/TokenContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { TokenMetadata } from "../../pages/Tokens";
import ThemeToggle from "../../lib/ThemeToggle";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);

  const { searchTerm, setSearchTerm, tokens } = useTokenContext();
  const [isOpen, setIsOpen] = useState(false);
  const [navBg, setNavBg] = useState(false);
  const [filteredResults, setFilteredResults] = useState<TokenMetadata[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const location = useLocation();

  const selectedMenu = (() => {
    switch (location.pathname) {
      case "/tokens":
        return "Token";
      case "/launch":
        return "Launch";
      case "/leaderboard":
        return "Leaderboard";
      case "/profile":
        return "Profile";
      default:
        return "Home";
    }
  })();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }

      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    if (term) {
      const results = tokens.filter((token) =>
        [token.name, token.symbol, token.tokenCreator, token.tokenAddress].some(
          (field) => field.toLowerCase().includes(term)
        )
      );
      setFilteredResults(results.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setFilteredResults([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, tokens]);

  return (
    <>
      <header
        className={`py-3 lg:px-6 px-3 md:px-[79px] ${
          navBg
            ? "bg-Dark-Purple"
            : "bg-[#ffffff0d] backdrop-blur-[40px] shadow"
        } fixed w-full top-0 left-0 z-50 transition-all duration-300 backdrop-blur-[20px]`}
      >
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="Safu Logo" width={40} height={40} />
          </a>

          {/* Main Controls */}
          <div className="flex items-center w-full max-w-[10rem] lg:max-w-[700px] mx-2 lg:mx-6">
            {/* Dropdown Button */}
            <div className="relative z-50" ref={dropdownRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center dark:bg-[#0C8CE0]/43 bg-[#0C8CE0] text-white px-2 py-3 lg:px-4 lg:py-3 rounded-l-lg text-sm font-medium cursor-pointer"
              >
                {selectedMenu} <FaChevronDown className="ml-2 text-xs" />
              </button>
              {showMenu && (
                <div className="absolute z-60 top-full bg-white/80 shadow-2xl backdrop-blur-[40px] mt-3 w-64 dark:border border-white/20 rounded-2xl space-y-1 text-black dark:bg-[#02071E]/95 dark:backdrop-blur-none dark:text-white overflow-hidden">
                  {/* Menu content */}
                  <div className="relative z-10">
                    {[
                      {
                        to: "/launchintro",
                        title: "Home",
                        desc: "Launch tokens with confidence",
                      },
                      {
                        to: "/tokens",
                        title: "Token",
                        desc: "Discover tokens through lists",
                      },

                      {
                        to: "/launch",
                        title: "Launch",
                        desc: "Create tokens to the moon with confidence!",
                      },
                      {
                        to: "/leaderboard",
                        title: "Leaderboard",
                        desc: "Find the top trades & traders",
                      },
                      {
                        to: "/profile",
                        title: "Profile",
                        desc: "Keep a pulse on Safu to the World",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setShowMenu(false);
                          navigate(item.to);
                        }}
                        className="block px-5 py-3 transition duration-200 hover:bg-[#147ABD]/20 rounded-xl cursor-pointer"
                      >
                        <p className="text-base font-medium dark:text-white text-black">
                          {item.title}
                        </p>
                        <p className="text-sm dark:text-white/60 text-[#141313]/64">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div
              className="relative lg:flex-1 max-w-[10rem] lg:max-w-none"
              ref={suggestionsRef}
            >
              <div className="flex items-center dark:bg-[#071129] px-4 py-3 rounded-r-lg w-full bg-black/5">
                <FaSearch className="dark:text-gray-400 text-[#141313]/40" />
                <input
                  type="text"
                  placeholder="Search for tokens & profiles"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="ml-2 bg-transparent text-sm dark:text-white text-black dark:placeholder-gray-400 placeholder-[#141313]/40 outline-none w-full"
                />
                {/* <FaTh className="dark:text-gray-400 text-white ml-2" /> */}
              </div>

              {showSuggestions && filteredResults.length > 0 && (
                <div className="absolute top-full -left-[5rem] mt-3 w-64 bg-white/30 backdrop-blur-[20px] dark:bg-[#02071E]/95 dark:backdrop-blur-none border border-white/10 text-white shadow-2xl rounded-2xl z-50 space-y-1">
                  {filteredResults.map((token) => (
                    <div
                      key={token.tokenAddress}
                      onClick={() => {
                        navigate(`/trade/${token.tokenAddress}`);
                        setSearchTerm("");
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-3 hover:bg-[#1A1A3D] cursor-pointer flex items-center justify-between"
                    >
                      <p className="text-sm font-medium text-black dark:text-white">
                        {token.name} ({token.symbol})
                      </p>
                      <p className="text-xs text-gray-400">
                        {token.tokenAddress.slice(0, 6)}...
                        {token.tokenAddress.slice(-4)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <ConnectButton />
            </div>
            <ThemeToggle />
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
              {[
                {
                  to: "/launchintro",
                  title: "Home",
                  desc: "Launch tokens with confidence",
                },
                {
                  to: "/tokens",
                  title: "Token",
                  desc: "Discover tokens through lists",
                },

                {
                  to: "/launch",
                  title: "Launch",
                  desc: "Create tokens to the moon with confidence!",
                },
                {
                  to: "/leaderboard",
                  title: "Leaderboard",
                  desc: "Find the top trades & traders",
                },
                {
                  to: "/profile",
                  title: "Profile",
                  desc: "Keep a pulse on Safu to the World",
                },
              ].map(({ to, title }) => (
                <a
                  key={title}
                  href={to}
                  className="text-lg uppercase tracking-widest dark:text-white text-black font-raleway"
                  onClick={() => {
                    setShowMenu(false);
                    navigate(to);
                  }}
                >
                  {title}
                </a>
              ))}
              <ConnectButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
