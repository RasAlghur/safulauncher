// src/components/ThemeToggle.tsx
import { useEffect, useState } from "react";
import { CiLight } from "react-icons/ci";
import { FaMoon } from "react-icons/fa";
import moon from "../assets/moon-toggle.png";
import sun from "../assets/sun.png";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldUseDark = stored === "dark" || (!stored && prefersDark);

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
      className={`w-[60px] h-8 flex items-center p-1 rounded-full transition-colors duration-300 cursor-pointer ${
        !isDark ? "bg-[#EDF8FF]" : "bg-[#0A1022]"
      }`}
      aria-label="Toggle Dark Mode"
    >
      <div
        className={`w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          isDark ? "translate-x-0" : "translate-x-7"
        }`}
      >
        {!isDark ? <img src={sun} alt="" /> : <img src={moon} alt="" />}
      </div>
    </button>
  );
};

export default ThemeToggle;
