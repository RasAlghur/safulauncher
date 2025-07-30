/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from "react";
import Moralis from "moralis";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const apiKey = import.meta.env.VITE_MORALIS_API_KEY;

interface Holder {
  owner: string;
  percent: number;
}

interface TopHoldersTableProps {
  tokenAddress: string;
  creatorAdress: string;
  bondingAddr: string;
}

export function TopHoldersTable({
  tokenAddress,
  creatorAdress,
  bondingAddr,
}: TopHoldersTableProps) {
  const [topHolders, setTopHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const fetchTopHolders = useCallback(async () => {
    if (!tokenAddress) return;

    setLoading(true);
    setError(null);

    try {
      if (!Moralis.Core.isStarted) {
        await Moralis.start({ apiKey });
      }

      const response = await Moralis.EvmApi.token.getTokenOwners({
        chain: "0xaa36a7", // Sepolia
        order: "DESC",
        tokenAddress,
      });

      const data = response.raw().result;
      const holders: Holder[] = data.map((h: any) => ({
        owner: h.owner_address,
        percent: h.percentage_relative_to_total_supply,
      }));

      setTopHolders(holders);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  useEffect(() => {
    if (tokenAddress) {
      fetchTopHolders();
    }
  }, [tokenAddress, fetchTopHolders]);

  // Add this with other state declarations
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  // Calculate total pages
  const totalPages = Math.ceil(topHolders.length / rowsPerPage);

  // Slice holders based on pagination
  const paginatedHolders = topHolders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Tooltip component (hover on desktop, click on mobile)
  const IconWithTooltip = ({
    tooltip,
    children,
  }: {
    tooltip: string;
    children: React.ReactNode;
  }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleHover = (val: boolean) => {
      if (window.innerWidth >= 768) setShowTooltip(val);
    };

    const handleClick = () => {
      if (window.innerWidth < 768) setShowTooltip((prev) => !prev);
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setShowTooltip(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // console.log(topHolders);

    return (
      <div
        className="relative inline-flex items-center ml-2 cursor-pointer"
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
        onClick={handleClick}
      >
        {children}
        {showTooltip && (
          <span className="absolute bottom-full mb-1 px-2 py-1 text-xs text-white bg-black rounded shadow z-10 whitespace-nowrap">
            {tooltip}
          </span>
        )}
      </div>
    );
  };

  // Function to check address type and return appropriate icon
  const getAddressIcon = (address: string) => {
    const isCreator = address.toLowerCase() === creatorAdress.toLowerCase();
    const isBonding = address.toLowerCase() === bondingAddr.toLowerCase();

    if (isCreator) {
      return (
        <IconWithTooltip tooltip="Dev Wallet">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424zM6 11.459a29.848 29.848 0 00-2.455-1.158 41.029 41.029 0 00-.39 3.114.75.75 0 00.419.74c.528.256 1.046.53 1.554.82-.21-.899-.438-1.895-.518-3.516zM21.852 14.442a.75.75 0 00-.334-.815A47.077 47.077 0 0018 12.794v2.243a.75.75 0 01-1.5 0v-2.014a45.624 45.624 0 00-6.365-1.78.75.75 0 00-.186 1.491 44.137 44.137 0 016.034 1.735 6.932 6.932 0 01-2.373 3.133.75.75 0 01-.75 1.3 8.432 8.432 0 002.992-4.024c.06.135.124.27.191.403.204.406.449.803.738 1.184a.75.75 0 101.26-.827 14.95 14.95 0 01-.738-1.184 25.99 25.99 0 00-3.261-4.871z"
              clipRule="evenodd"
            />
          </svg>
        </IconWithTooltip>
      );
    }

    if (isBonding) {
      return (
        <IconWithTooltip tooltip="SafuLauncher Pool (tokens available for sale)">
          <svg
            className="w-4 h-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clipRule="evenodd"
            />
          </svg>
        </IconWithTooltip>
      );
    }

    return null;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-10 flex-col gap-4">
        <div className="h-12 w-12 border-4 border-dashed border-gray-300 dark:border-white/20 rounded-full animate-spin"></div>
        <p className="text-lg font-medium dark:text-white text-[#141313]">
          Loading top holders…
        </p>
      </div>
    );

  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="mt-14">
      <h2 className="text-lg md:text-xl font-semibold mb-2 dark:text-white text-black font-raleway">
        Top Holders
      </h2>

      <div className="tx-table overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="min-w-[400px] sm:min-w-[600px] md:min-w-full text-sm dark:text-white/80">
          <thead className="text-left dark:text-white/60 text-[#141313]/75 mb-4 border-black/10 border-b-2 dark:border-b-white/20">
            <tr className="text-black dark:text-white">
              <th className="py-3 pl-1">Address</th>
              <th className="py-3 px-2">% of Supply</th>
            </tr>
          </thead>
          <tbody>
            {paginatedHolders.map((holder, i) => (
              <tr
                key={i}
                className="mb-4 border-b-2 dark:border-b-white/20 border-black/10 last-of-type:border-none"
              >
                <td className="py-3 pl-1 flex items-center gap-1 font-mono dark:text-white/80 text-[#141313] font-semibold">
                  <span>
                    {holder.owner.slice(0, 6)}…{holder.owner.slice(-4)}
                  </span>
                  {getAddressIcon(holder.owner)}
                </td>
                <td className="py-3 px-2 dark:text-white/80 text-[#141313] font-semibold">
                  {holder.percent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 bg-[#0C8CE0] text-white rounded-full disabled:opacity-50"
        >
          <FaChevronLeft />
        </button>

        <span className="px-2 text-sm text-gray-600 dark:text-white/70">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-2 bg-[#0C8CE0] text-white rounded-full disabled:opacity-50"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}
