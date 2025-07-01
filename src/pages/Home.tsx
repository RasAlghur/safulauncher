// src/pages/Home.tsx
import { useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { LAUNCHER_ABI, SAFU_LAUNCHER_CA } from "../web3/config";
import { Link } from "react-router-dom";
import { pureMetrics } from "../web3/readContracts";

/**
 * Description placeholder
 *
 * @returns {*}
 */
function Home() {
  const { isConnected } = useAccount();
  const {
    data: getMetrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useReadContract({
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA as `0x${string}`,
    functionName: "getMetrics",
  });

  useEffect(() => {
    if (!isLoadingMetrics) {
      refetchMetrics();
    }
  }, [!isLoadingMetrics, refetchMetrics]);

  // const { data: totalVolumeETH, isLoading: isLoadingTotalVolumeETH, refetch: refetchTotalVolumeETH } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalVolumeETH'
  //     }
  // );
  // const { data: totalFeesETH, isLoading: isLoadingTotalFeesETH, refetch: refetchTotalFeesETH } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalFeesETH'
  //     }
  // );
  // const { data: totalTokensLaunched, isLoading: isLoadingTotalTokensLaunched, refetch: refetchTotalTokensLaunched } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalTokensLaunched'
  //     }
  // );
  // const { data: totalTokensListed, isLoading: isLoadingTotalTokensListed, refetch: refetchTotalTokensListed } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalTokensListed'
  //     }
  // );
  // const { data: totalTaxedTokens, isLoading: isLoadingTotalTaxedTokens, refetch: refetchTotalTaxedTokens } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalTaxedTokens'
  //     }
  // );
  // const { data: totalZeroTaxTokens, isLoading: isLoadingTotalZeroTaxTokens, refetch: refetchTotalZeroTaxTokens } = useReadContract(
  //     {
  //         ...LAUNCHER_ABI,
  //         address: SAFU_LAUNCHER_CA as `0x${string}`,
  //         functionName: 'totalZeroTaxTokens'
  //     }
  // );

  // console.log(getMetrics);
  // console.log("totalVolumeETH", totalVolumeETH);
  // console.log("totalFeesETH", totalFeesETH);
  // console.log("totalTokensLaunched", totalTokensLaunched);
  // console.log("totalTokensListed", totalTokensListed);
  // console.log("totalTaxedTokens", totalTaxedTokens);
  // console.log("totalZeroTaxTokens", totalZeroTaxTokens);

  return (
    <div>
      <Link to={`/launch`} style={{ textDecoration: "none", color: "inherit" }}>
        Launch Token
      </Link>
      <p>
        totalVolumeETH:{" "}
        {isConnected && getMetrics && getMetrics[0] !== undefined
          ? Number(getMetrics[0]) / 1e18
          : pureMetrics[0] !== undefined
          ? Number(pureMetrics[0]) / 1e18
          : 0}{" "}
        ETH
      </p>
      <p>
        totalFeesETH:{" "}
        {isConnected && getMetrics && getMetrics[1] !== undefined
          ? Number(getMetrics[1]) / 1e18
          : pureMetrics[1] !== undefined
          ? Number(pureMetrics[1]) / 1e18
          : 0}{" "}
        ETH
      </p>
      <p>
        totalTokensLaunched: {isConnected ? getMetrics?.[2] : pureMetrics?.[2]}
      </p>
      <p>
        totalTokensListed: {isConnected ? getMetrics?.[3] : pureMetrics?.[3]}
      </p>
      <p>
        totalTaxedTokens: {isConnected ? getMetrics?.[4] : pureMetrics?.[4]}
      </p>
      <p>
        totalZeroTaxTokens: {isConnected ? getMetrics?.[5] : pureMetrics?.[5]}
      </p>
      <p>
        DevRewardETH:{" "}
        {isConnected && getMetrics && getMetrics[6] !== undefined
          ? Number(getMetrics[6]) / 1e18
          : pureMetrics[1] !== undefined
          ? Number(pureMetrics[6]) / 1e18
          : 0}{" "}
        ETH
      </p>
    </div>
  );
}

export default Home;
