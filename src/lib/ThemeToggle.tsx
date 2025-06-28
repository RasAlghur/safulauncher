// src/components/ThemeToggle.tsx
import { useEffect, useState } from "react";
import { CiLight } from "react-icons/ci";
import { FaMoon } from "react-icons/fa";

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
      className={`w-16 h-9 flex items-center p-1 rounded-full transition-colors duration-300 cursor-pointer ${
        isDark ? "bg-Primary" : "bg-Primary"
      }`}
      aria-label="Toggle Dark Mode"
    >
      <div
        className={`w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <FaMoon className="text-gray-700 text-sm" />
        ) : (
          <CiLight className=" text-sm" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
