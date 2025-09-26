import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type DeepPartial,
  type ChartOptions,
  type CandlestickSeriesOptions,
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
} from "lightweight-charts";

/**
 * Description placeholder
 *
 * @interface ChartProps
 * @typedef {ChartProps}
 */
interface ChartProps {
  /**
   * Description placeholder
   *
   * @type {CandlestickData[]}
   */
  data: CandlestickData[];
  /**
   * Description placeholder
   *
   * @type {?string}
   */
  timeframe?: string;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  height?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  width?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  ethToUsdRate?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  totalSupply?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  barSpacing?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  rightOffset?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  minBarSpacing?: number;
  /**
   * Description placeholder
   *
   * @type {?string}
   */
  symbol?: string;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  currentPrice?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  priceChange?: number;
  /**
   * Description placeholder
   *
   * @type {?number}
   */
  priceChangePercent?: number;
  /**
   * Description placeholder
   *
   * @type {?string}
   */
  volume?: string;
  /**
   * Description placeholder
   *
   * @type {?string}
   */
  chain?: string;
}

/**
 * Description placeholder
 *
 * @export
 * @param {ChartProps} param0
 * @param {{}} param0.data
 * @param {number} [param0.height=500]
 * @param {number} param0.width
 * @param {number} [param0.ethToUsdRate=1]
 * @param {number} [param0.totalSupply=1]
 * @param {number} [param0.barSpacing=6]
 * @param {number} [param0.rightOffset=20]
 * @param {number} [param0.minBarSpacing=6]
 * @param {string} param0.symbol
 * @param {string} param0.chain
 * @param {number} param0.currentPrice
 * @param {number} param0.priceChange
 * @param {number} param0.priceChangePercent
 * @param {string} [param0.volume='0%']
 * @returns {*}
 */
export default function LightweightChart({
  data,
  height = 500,
  width,
  ethToUsdRate = 1,
  totalSupply = 1,
  barSpacing = 6,
  rightOffset = 20,
  minBarSpacing = 6,
  symbol,
  currentPrice,
  priceChange,
  priceChangePercent,
  chain,
  volume = "0%",
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [currency, setCurrency] = useState<"chain" | "USD">("USD");
  const [metric, setMetric] = useState<"price" | "marketcap">("price");

  // Function to ensure candle continuity
  const ensureCandleContinuity = (
    candleData: CandlestickData[]
  ): CandlestickData[] => {
    if (!candleData || candleData.length <= 1) return candleData;

    const continuousData = [...candleData];

    for (let i = 1; i < continuousData.length; i++) {
      const prevCandle = continuousData[i - 1];
      const currentCandle = continuousData[i];

      // If there's a gap between the previous close and current open, adjust the current open
      if (Math.abs(currentCandle.open - prevCandle.close) > 0.000001) {
        // Small tolerance for floating point
        continuousData[i] = {
          ...currentCandle,
          open: prevCandle.close,
          // Ensure high and low accommodate the new open price
          high: Math.max(currentCandle.high, prevCandle.close),
          low: Math.min(currentCandle.low, prevCandle.close),
        };
      }
    }

    return continuousData;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const chartOptions: DeepPartial<ChartOptions> = {
      width: width || containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#0A0E17`" },
        textColor: "#D4D4D8",
        fontSize: 12,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: {
          visible: true,
          color: "#1E293B",
          style: LineStyle.Dotted,
        },
        horzLines: {
          visible: true,
          color: "#1E293B",
          style: LineStyle.Dotted,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: "#64748B",
          style: LineStyle.Solid,
          labelVisible: true,
          labelBackgroundColor: "#1E293B",
        },
        horzLine: {
          width: 1,
          color: "#64748B",
          style: LineStyle.Solid,
          labelVisible: true,
          labelBackgroundColor: "#1E293B",
        },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: false,
        mode: PriceScaleMode.Normal,
        autoScale: true,
        scaleMargins: { top: 0.08, bottom: 0.08 },
        // scaleMargins: { top: 0.01, bottom: 0.01 },
        textColor: "#9CA3AF",
        entireTextOnly: false,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: true,
        borderVisible: false,
        barSpacing,
        rightOffset,
        minBarSpacing,
        fixLeftEdge: false,
        fixRightEdge: false,
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1E293B",
        ticksVisible: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    };

    chartRef.current = createChart(containerRef.current, chartOptions);

    const seriesOptions: DeepPartial<CandlestickSeriesOptions> = {
      upColor: "#10B981",
      downColor: "#EF4444",
      wickUpColor: "#10B981",
      borderVisible: true,
      borderUpColor: "#10B981",
      borderDownColor: "#EF4444",
      wickDownColor: "#EF4444",
      priceFormat: {
        type: "price",
        precision: 8,
        minMove: 0.00000001,
      },
    };
    seriesRef.current = chartRef.current.addSeries(
      CandlestickSeries,
      seriesOptions
    );

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: width || containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, [height, width, barSpacing, minBarSpacing, rightOffset]);

  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return;

    const transformed = data
      .map((d) => {
        const { open: o, high: h, low: l, close: c } = d;
        let open: number, high: number, low: number, close: number;

        if (metric === "price") {
          if (currency === "USD") {
            open = o * ethToUsdRate;
            high = h * ethToUsdRate;
            low = l * ethToUsdRate;
            close = c * ethToUsdRate;
          } else {
            open = o;
            high = h;
            low = l;
            close = c;
          }
        } else {
          const multiplier =
            currency === "USD" ? ethToUsdRate * totalSupply : totalSupply;
          open = o * multiplier;
          high = h * multiplier;
          low = l * multiplier;
          close = c * multiplier;
        }

        return { time: d.time, open, high, low, close };
      })
      .filter((pt) =>
        [pt.open, pt.high, pt.low, pt.close].every(
          (v) => Number.isFinite(v) && v > 0
        )
      )
      .sort((a, b) => (a.time as number) - (b.time as number));

    // Ensure candle continuity before setting data
    const continuousData = ensureCandleContinuity(transformed);
    seriesRef.current.setData(continuousData);

    // Snap the last candle to the very right
    chartRef.current?.timeScale().scrollToRealTime();
  }, [data, currency, metric, ethToUsdRate, totalSupply]);

  const formatPrice = (price: number) => {
    if (currency === "USD") {
      return price < 0.01 ? `$${price.toFixed(6)}` : `$${price.toFixed(4)}`;
    }
    return `${price.toFixed(6)} ${chain}`;
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  };

  return (
    <div className="  text-white relative border border-white/10 rounded-b-xl overflow-hidden text-sm">
      {/* Header */}

      {/*Header and Controls */}
      <div className="flex items-center justify-between px-4 py-1 dark:bg-[#0B132B] border dark:border-white/10 border-black/50">
        <div className="flex items-center gap-4 ml-10 mt-1">
          {/* PRICE / MCAP Toggle */}
          <div className="text-sm dark:text-white/60 text-black/80">
            <span
              onClick={() => setMetric("price")}
              className={`cursor-pointer transition ${
                metric === "price"
                  ? " font-semibold"
                  : "dark:hover:text-white/80 hover:text-black/50"
              }`}
            >
              PRICE
            </span>
            <span className="mx-1 text-white/40">/</span>
            <span
              onClick={() => setMetric("marketcap")}
              className={`cursor-pointer transition ${
                metric === "marketcap"
                  ? "font-semibold"
                  : "dark:hover:text-white/80 hover:text-black/50"
              }`}
            >
              MCAP
            </span>
          </div>

          {/* ETH / USD Toggle */}
          <div className="text-sm dark:text-white/60 text-black/80">
            <span
              onClick={() => setCurrency(`chain`)}
              className={`cursor-pointer transition ${
               `${ currency === 'chain'
                  ? " font-semibold"
                  : "dark:hover:text-white/80 hover:text-black/50"}`
              }`}
            >
              {chain}
            </span>
            <span className="mx-1 text-white/40">/</span>
            <span
              onClick={() => setCurrency("USD")}
              className={`cursor-pointer transition ${
                currency === "USD"
                  ? "font-semibold"
                  : "dark:hover:text-white/80 hover:text-black/50"
              }`}
            >
              USD
            </span>
          </div>

          {/* Timestamp */}
          <span className="text-white/40 ml-2 text-sm">
            {new Date().toLocaleTimeString()} UTC
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-white/70 text-base">{symbol}/USD</span>
          {currentPrice !== undefined && (
            <span className="text-[18px] font-semibold text-white">
              {metric === "price"
                ? formatPrice(currentPrice)
                : formatMarketCap(currentPrice * totalSupply)}
            </span>
          )}
          {priceChange !== undefined && priceChangePercent !== undefined && (
            <span
              className={`text-sm font-medium ${
                priceChange >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {priceChange >= 0 ? "+" : ""}
              {formatPrice(priceChange)} ({priceChangePercent.toFixed(2)}%)
            </span>
          )}
        </div>
        <div className="hidden">
          <span>Vol:</span>
          <span className="text-white">{volume}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative z-20 dark:bg-[#0B132B] bg-white rounded-b-xl overflow-hidden">
        <div
          ref={containerRef}
          style={{ width: "100%", height: `${height}px` }}
        />
        {(!data || data.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">No chart data available</div>
              <div className="text-sm">Waiting for price data...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
