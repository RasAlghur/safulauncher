import {
    useRef,
    useEffect,
    useState,
    useMemo,
    useCallback,
    useLayoutEffect,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    pureCombinedMetrics,  // Import combined metrics
    pureGetLatestETHPrice,
    pureCombinedUniqueTraderCount,
} from "../../web3/readContracts";  // Remove totalTokensListed import
import { ETH_USDT_PRICE_FEED } from "../../web3/config";

import cloudRight from "../../assets/cloud-right.png";
import cloudLeft from "../../assets/cloud-left.png";
import { base } from "../../lib/api";

import VolumeIcon from "../svgcomponents/Volume";
import FeeCollected from "../svgcomponents/FeeCollected";
import TokensLaunched from "../svgcomponents/TokensLaunched";
import TokensListed from "../svgcomponents/TokensListed";
import AverageBonding from "../svgcomponents/AverageBonding";
import TaxTokens from "../svgcomponents/TaxTokens";
import ZeroTaxTokens from "../svgcomponents/ZeroTaxTokens";
import SafuHolders from "../svgcomponents/SafuHolders";
import DustParticles from "../generalcomponents/DustParticles";
import Reward from "../svgcomponents/Reward";
import AverageVolume from "../svgcomponents/AverageVolume";

gsap.registerPlugin(ScrollTrigger);

export interface TokenMetadata {
    name: string;
    symbol: string;
    website?: string;
    description?: string;
    tokenAddress: string;
    tokenCreator: string;
    logoFilename?: string;
    createdAt?: string;
    expiresAt?: string;
}

interface PlatformStatsProps {
  metrics?: readonly bigint[] | undefined;
}

const PlatformStats = ({ metrics }: PlatformStatsProps) => {

    const containerRef = useRef<HTMLDivElement | null>(null);
    const headlineRef = useRef<HTMLHeadingElement | null>(null);
    const cardRefs = useRef<HTMLDivElement[]>([]);
    const [currentETHPrice, setCurrentETHPrice] = useState<number>(0);
    const [totalTokenCount, setTotalTokenCount] = useState<number>(0);

    // Fetch list of tokens
    useEffect(() => {
        (async () => {
            try {
                const response = await base.get("token-all");
                const data = response.data.data;

                console.log("Raw API response:", data);

                // Handle the nested array structure
                let flattenedTokens: TokenMetadata[] = [];

                if (Array.isArray(data)) {
                    // If data is an array of arrays, flatten it
                    flattenedTokens = data.flat();
                } else if (data && typeof data === "object") {
                    // If data is a single object, wrap it in an array
                    flattenedTokens = [data];
                }

                setTotalTokenCount(flattenedTokens.length);
            } catch (error) {
                console.error("Error fetching tokens:", error);
            }
        })();
    }, []);

    const safeMetrics = useMemo(() => {
        return metrics || pureCombinedMetrics;
    }, [metrics]);

    // Calculate average curve progress using safeMetrics
    const averageBondingProgress = useMemo(() => {
        return totalTokenCount > 0
            ? (Number(safeMetrics[3]) / totalTokenCount) * 100
            : 0;
    }, [safeMetrics, totalTokenCount]);

    // Calculate average volume using safeMetrics
    const averageVolume = useMemo(() => {
        return totalTokenCount > 0
            ? (safeMetrics[0] !== undefined ? Number(safeMetrics[0]) / 1e18 : 0) /
            totalTokenCount
            : 0;
    }, [safeMetrics, totalTokenCount]);

    // Fetch ETH price if not provided
    useEffect(() => {
        async function fetchETHPrice() {
            try {
                const raw = await pureGetLatestETHPrice(ETH_USDT_PRICE_FEED!);
                const price = (typeof raw === "number" ? raw : Number(raw)) / 1e8;
                setCurrentETHPrice(price);
            } catch (error) {
                console.error("Failed to fetch ETH price:", error);
            }
        }
        fetchETHPrice();
    }, []);


    const getMainValue = useCallback(
        (ethValue: number, fallbackValue: string) => {
            if (currentETHPrice === 0) return fallbackValue;
            const usdValue = ethValue * currentETHPrice;
            return `$${usdValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        },
        [currentETHPrice] // <- dependency
    );

    // Helper function to get ETH value for display

    const getETHDisplay = useCallback(
        (ethValue: number) => {
            if (currentETHPrice === 0) return "";
            return `(${ethValue.toFixed(2)} ETH)`;
        },
        [currentETHPrice]
    );

    // Stats array using safeMetrics
    const stats = useMemo(() => {
        return [
            {
                id: 1,
                title: "Total Volume",
                mainValue: getMainValue(
                    safeMetrics[0] !== undefined ? Number(safeMetrics[0]) / 1e18 : 0,
                    `${safeMetrics[0] !== undefined
                        ? (Number(safeMetrics[0]) / 1e18).toFixed(8)
                        : 0
                    } ETH`
                ),
                icon: VolumeIcon,
            },
            {
                id: 2,
                title: "Average Volume (Per Token)",
                mainValue: `$${getMainValue(averageVolume, averageVolume.toFixed(2))}`,
                ethValue: "",
                icon: AverageVolume,
            },
            {
                id: 3,
                title: "Fees Collected",
                mainValue: getMainValue(
                    safeMetrics[1] !== undefined ? Number(safeMetrics[1]) / 1e18 : 0,
                    `${safeMetrics[1] !== undefined
                        ? (Number(safeMetrics[1]) / 1e18).toFixed(8)
                        : 0
                    } ETH`
                ),
                icon: FeeCollected,
            },
            {
                id: 4,
                title: "Tokens Deployed",
                mainValue: `${safeMetrics[2]?.toString() || 0}`,
                ethValue: "",
                icon: TokensLaunched,
            },
            {
                id: 5,
                title: "Graduated Tokens",
                mainValue: `${safeMetrics[3]?.toString() || 0}`,
                ethValue: "",
                icon: TokensListed,
            },
            {
                id: 6,
                title: "Average Bonding",
                mainValue: `${isNaN(averageBondingProgress) ? 0 : averageBondingProgress.toFixed(2)
                    }%`,
                ethValue: "",
                icon: AverageBonding,
            },
            {
                id: 7,
                title: "Tax Tokens",
                mainValue: `${safeMetrics[4]?.toString() || 0}`,
                ethValue: "",
                icon: TaxTokens,
            },
            {
                id: 8,
                title: "0% Tax Tokens",
                mainValue: `${safeMetrics[5]?.toString() || 0}`,
                ethValue: "",
                icon: ZeroTaxTokens,
            },
            {
                id: 9,
                title: "$SAFU Holders",
                mainValue: "234", // This might need updating if you have real data
                ethValue: "",
                icon: SafuHolders,
            },
            {
                id: 10,
                title: "Paid Out Dev Reward",
                mainValue: getMainValue(
                    safeMetrics[6] !== undefined ? Number(safeMetrics[6]) / 1e18 : 0,
                    `${(safeMetrics[6] !== undefined
                        ? Number(safeMetrics[6]) / 1e18
                        : 0
                    ).toFixed(2)} ETH`
                ),
                ethValue: getETHDisplay(
                    Number(
                        safeMetrics[6] !== undefined
                            ? (Number(safeMetrics[6]) / 1e18).toFixed(2)
                            : 0
                    )
                ),
                icon: Reward,
            },
            {
                id: 9,
                title: "Total Unique Traders",
                mainValue: "",
                ethValue: Number(pureCombinedUniqueTraderCount), // This might need updating if you have real data
                icon: SafuHolders,
            },
        ];
    }, [averageBondingProgress, averageVolume, getETHDisplay, getMainValue, safeMetrics]);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap
                .timeline({
                    defaults: { ease: "power4.out" },
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 80%",
                        toggleActions: "play reverse play reverse",
                    },
                })
                .from(
                    headlineRef.current,
                    {
                        opacity: 0,
                        y: 20,
                        duration: 0.6,
                        ease: "power2.out",
                    },
                    "+=0.1"
                )
                .from(cardRefs.current, {
                    opacity: 0,
                    y: 50,
                    stagger: 0.15,
                    duration: 0.8,
                    ease: "power2.out",
                });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        stats.forEach((stat, index) => {
            const el = document.getElementById(`main-value-${index}`);
            if (!el) return;

            const raw = stat.mainValue;

            // Extract numeric part of the value
            const clean = parseFloat(raw.replace(/[^0-9.]/g, ""));
            const isCurrency = raw.includes("$");
            const isETH = raw.includes("ETH");
            const isPercent = raw.includes("%");

            gsap.fromTo(
                el,
                { innerText: 0 },
                {
                    innerText: clean,
                    duration: 2,
                    ease: "power3.out",
                    snap: { innerText: isPercent ? 0.1 : 1 },
                    onUpdate: function () {
                        const val = parseFloat(el.innerText);
                        if (isCurrency) {
                            el.innerText = `$${val.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}`;
                        } else if (isETH) {
                            el.innerText = `${val.toFixed(4)} ETH`;
                        } else if (isPercent) {
                            el.innerText = `${val.toFixed(1)}%`;
                        } else {
                            el.innerText = `${Math.floor(val)}`;
                        }
                    },
                    scrollTrigger: {
                        trigger: el,
                        start: "top 90%",
                        once: true,
                    },
                }
            );
        });
    }, [stats]);

    return (
        <section id="stats" className="mt-28 px-6 relative" ref={containerRef}>
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                    <DustParticles key={i} />
                ))}
            </div>

            <div className="dark:hidden block">
                <img
                    src={cloudLeft}
                    alt="This is the cloud on the left"
                    className="absolute bottom-0 -left-[1rem]"
                />
                <img
                    src={cloudRight}
                    alt="This is the cloud on the right"
                    className="absolute -top-[15rem] -right-[1rem] "
                />
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="dark:bg-[#9747FF]/15 bg-[#3AC2DB]/10 rounded-3xl px-6 py-4 lg:px-6 lg:py-6 lg:pb-2 text-white relative border-[2px] border-t-0 dark:border-[#9747FF]/10 border-Primary">
                    <div className="rounded-tab-inverted">
                        <h2
                            ref={headlineRef}
                            className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold dark:text-white text-black text-center mt-4"
                        >
                            Platform Stats
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-24 pb-8">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={index}
                                    ref={(el) => {
                                        if (el) cardRefs.current[index] = el;
                                    }}
                                    className="dark:bg-[#9747FF]/5 bg-[#064C7A]/10 px-2.5 py-8 rounded-xl flex flex-col items-center justify-center text-center"
                                >
                                    <div className="w-16 h-16 mb-4 relative">
                                        <Icon className="w-full h-full" />
                                        {stat.id === 8 && (
                                            <p className="text-white/60 font-bold text-[22px]  absolute bottom-6 left-[10px] dark:hidden block">
                                                TAX
                                            </p>
                                        )}
                                    </div>
                                    {/* Main value (USD for ETH values, original for others) */}
                                    <div className="text-lg font-semibold dark:text-white text-black mb-2">
                                        <span className="main-value" id={`main-value-${index}`}>
                                            {stat.mainValue}
                                        </span>
                                    </div>
                                    {/* Title */}
                                    <div className="text-sm dark:text-white/70 text-[#141313] leading-tight mb-2">
                                        {stat.title}
                                    </div>
                                    {/* ETH value in brackets (only for ETH-related stats) */}
                                    {stat.ethValue && (
                                        <div className="text-sm dark:text-white/60 text-black/60 font-medium">
                                            {stat.ethValue}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PlatformStats;