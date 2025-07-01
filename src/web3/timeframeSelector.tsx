import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Description placeholder
 *
 * @interface TimeframeOption
 * @typedef {TimeframeOption}
 */
interface TimeframeOption {
  /**
   * Description placeholder
   *
   * @type {string}
   */
  label: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  value: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  resolution: string;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  days?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  hours?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  minutes?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  seconds?: number;
}

/**
 * Description placeholder
 *
 * @type {TimeframeOption[]}
 */
const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  // Seconds
  { label: "1s", value: "1s", resolution: "1s", seconds: 1 },

  // Minutes
  { label: "1m", value: "1m", resolution: "1m", minutes: 1 },
  { label: "5m", value: "5m", resolution: "5m", minutes: 5 },
  { label: "15m", value: "15m", resolution: "15m", minutes: 15 },
  { label: "30m", value: "30m", resolution: "30m", minutes: 30 },

  // Hours
  { label: "1h", value: "1h", resolution: "1h", hours: 1 },
  { label: "2h", value: "2h", resolution: "2h", hours: 2 },
  { label: "4h", value: "4h", resolution: "4h", hours: 4 },
  { label: "8h", value: "8h", resolution: "8h", hours: 8 },
  { label: "12h", value: "12h", resolution: "12h", hours: 12 },

  // Days
  { label: "1D", value: "1D", resolution: "1D", days: 1 },
  { label: "3D", value: "3D", resolution: "3D", days: 3 },

  // Weeks
  { label: "1W", value: "1W", resolution: "1W", days: 7 },

  // Months
  { label: "1M", value: "1M", resolution: "1M", days: 30 },
];

/**
 * Description placeholder
 *
 * @interface TimeframeSelectorProps
 * @typedef {TimeframeSelectorProps}
 */
interface TimeframeSelectorProps {
  /**
   * Description placeholder
   *
   * @type {TimeframeOption}
   */
  selectedTimeframe: TimeframeOption;
  /**
   * Description placeholder
   *
   * @type {(timeframe: TimeframeOption) => void}
   */
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  /**
   * Description placeholder
   *
   * @type {?boolean}
   */
  disabled?: boolean;
}

/**
 * Description placeholder
 *
 * @export
 * @param {TimeframeSelectorProps} param0
 * @param {TimeframeOption} param0.selectedTimeframe
 * @param {(timeframe: TimeframeOption) => void} param0.onTimeframeChange
 * @param {boolean} [param0.disabled=false]
 * @returns {*}
 */
export default function TimeframeSelector({
  selectedTimeframe,
  onTimeframeChange,
  disabled = false,
}: TimeframeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (timeframe: TimeframeOption) => {
    onTimeframeChange(timeframe);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
                    flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg
                    border border-gray-600 hover:bg-gray-700 transition-colors
                    ${
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                    ${isOpen ? "bg-gray-700 border-blue-500" : ""}
                    min-w-[60px] justify-between
                `}
      >
        <span className="font-medium">{selectedTimeframe.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[120px]">
          <div className="py-1 max-h-64 overflow-y-auto">
            {/* Group timeframes by category */}
            <div className="px-3 py-1 text-xs text-gray-400 uppercase tracking-wide">
              Seconds
            </div>
            {TIMEFRAME_OPTIONS.filter((tf) => tf.seconds).map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => handleSelect(timeframe)}
                className={`
                                    w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors
                                    ${
                                      selectedTimeframe.value ===
                                      timeframe.value
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-300"
                                    }
                                `}
              >
                {timeframe.label}
              </button>
            ))}

            <div className="border-t border-gray-700 my-1"></div>
            <div className="px-3 py-1 text-xs text-gray-400 uppercase tracking-wide">
              Minutes
            </div>
            {TIMEFRAME_OPTIONS.filter((tf) => tf.minutes).map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => handleSelect(timeframe)}
                className={`
                                    w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors
                                    ${
                                      selectedTimeframe.value ===
                                      timeframe.value
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-300"
                                    }
                                `}
              >
                {timeframe.label}
              </button>
            ))}

            <div className="border-t border-gray-700 my-1"></div>
            <div className="px-3 py-1 text-xs text-gray-400 uppercase tracking-wide">
              Hours
            </div>
            {TIMEFRAME_OPTIONS.filter((tf) => tf.hours).map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => handleSelect(timeframe)}
                className={`
                                    w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors
                                    ${
                                      selectedTimeframe.value ===
                                      timeframe.value
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-300"
                                    }
                                `}
              >
                {timeframe.label}
              </button>
            ))}

            <div className="border-t border-gray-700 my-1"></div>
            <div className="px-3 py-1 text-xs text-gray-400 uppercase tracking-wide">
              Days & More
            </div>
            {TIMEFRAME_OPTIONS.filter((tf) => tf.days).map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => handleSelect(timeframe)}
                className={`
                                    w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors
                                    ${
                                      selectedTimeframe.value ===
                                      timeframe.value
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-300"
                                    }
                                `}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
