import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import logo from "../../assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ThemeToggle from "../../lib/ThemeToggle";
import { FiMenu, FiX } from "react-icons/fi";
import { base } from "../../lib/api";
import { debounce } from "lodash";
import axios from "axios";

interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  tokenImageId?: string;
  image?: {
    name: string;
    path: string;
  };
  createdAt?: string;
  expiresAt?: string;
}

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navBg, setNavBg] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
    const handler = () => setNavBg(window.scrollY >= 90);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

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

  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchToken = useCallback(async (text: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!text.trim()) return;

      const res = await base.get("tokens", {
        params: { includes: "image", search: text, limit: 5 },
        signal: controller.signal,
      });

      const { data } = res.data.data;
      setFilteredResults(data);
      setShowSuggestions(true);
    } catch (error: unknown) {
      if (
        axios.isCancel(error) ||
        (typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name?: string }).name === "CanceledError")
      ) {
        // Request canceled
      } else {
        console.error("API Error:", error);
      }
      setFilteredResults([]);
      setShowSuggestions(false);
    }
  }, []);

  const debouncedFetch = useMemo(
    () =>
      debounce((query: string) => {
        searchToken(query);
      }, 300),
    [searchToken]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedFetch(value);
  };

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

          {/* Dropdown & Search */}
          <div className="flex items-center w-full max-w-[10rem] lg:max-w-[700px] mx-2 lg:mx-6">
            {/* Dropdown */}
            <div className="relative z-50" ref={dropdownRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center dark:bg-[#0C8CE0]/43 bg-[#0C8CE0] text-white px-2 py-3 lg:px-4 lg:py-3 rounded-l-lg text-sm font-medium cursor-pointer"
              >
                {selectedMenu} <FaChevronDown className="ml-2 text-xs" />
              </button>
              {showMenu && (
                <div className="absolute z-60 top-full bg-white/80 shadow-2xl backdrop-blur-[40px] mt-3 w-64 dark:border border-white/20 rounded-2xl space-y-1 text-black dark:bg-[#02071E]/95 dark:backdrop-blur-none dark:text-white overflow-hidden">
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

            {/* Search */}
            <div
              className="relative lg:flex-1 max-w-[10rem] lg:max-w-none"
              ref={suggestionsRef}
            >
              <div className="flex items-center dark:bg-[#071129] px-4 py-3 rounded-r-lg w-full bg-black/5">
                <FaSearch className="dark:text-gray-400 text-[#141313]/40" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for tokens & profiles"
                  value={searchTerm}
                  onChange={handleChange}
                  onFocus={() => setShowSuggestions(true)}
                  className="ml-2 bg-transparent text-sm dark:text-white text-black dark:placeholder-gray-400 placeholder-[#141313]/40 outline-none w-full"
                />
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

          {/* Connect & Theme */}
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

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="block xl:hidden fixed inset-0 z-30 transition-all duration-300"
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
                { to: "/launchintro", title: "Home" },
                { to: "/tokens", title: "Token" },
                { to: "/launch", title: "Launch" },
                { to: "/leaderboard", title: "Leaderboard" },
                { to: "/profile", title: "Profile" },
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
