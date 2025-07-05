// src/components/ThemeToggle.tsx
import { useEffect, useState } from "react";

import moon from "../assets/moon-toggle.png";
import { IoSunny } from "react-icons/io5";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const shouldUseDark = stored !== "light"; // default to dark unless explicitly light

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative group w-[66px] h-[32px] rounded-full p-1 cursor-pointer flex items-center transition-colors duration-300 
    ${isDark ? "bg-[#0A1022]" : "bg-[#EDF8FF]"} shadow-inner`}
      aria-label="Toggle Dark Mode"
    >
      {/* Sliding knob */}
      <div
        className={`absolute z-20 left-1 w-[28px] h-[28px] rounded-full flex items-center justify-center
      transition-transform duration-300 ease-in-out
      ${isDark ? "translate-x-0 bg-[#D9D9D9]" : "translate-x-[32px] bg-white"}`}
      >
        {isDark ? (
          <img src={moon} alt="Moon" className="w-3 h-3" />
        ) : (
          <IoSunny className="text-black text-lg" />
        )}
      </div>

      {/* Static sun icon on left */}
      <div className="absolute left-[10px] flex items-center justify-center size-3 z-10">
        <img src={moon} alt="MOon" className="w-3 h-3" />
      </div>

      {/* Static moon icon on right */}
      <div className="absolute right-[10px] z-10">
        <IoSunny className="text-white text-lg" />
      </div>
    </button>
  );
};

export default ThemeToggle;
