// src/pages/Home.tsx
import { useEffect } from 'react';
import {
    useReadContract,
} from 'wagmi';
import { LAUNCHER_ABI, SAFU_LAUNCHER_CA } from '../web3/config';
import { Link } from 'react-router-dom';

function Home() {
    const { data: getMetrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useReadContract(
        {
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA as `0x${string}`,
            functionName: 'getMetrics'
        }
    );

    useEffect(() => {
        if (!isLoadingMetrics) {
            refetchMetrics();
        }
    }, [!isLoadingMetrics, refetchMetrics])


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
            <Link to={`/launch`} style={{ textDecoration: 'none', color: 'inherit' }}>
                Launch Token
            </Link>
            <p>
                totalVolumeETH: {getMetrics && getMetrics[0] !== undefined ? Number(getMetrics[0]) / 1e18: 'Loading...'} ETH
            </p>
            <p>
                totalFeesETH: {getMetrics && getMetrics[1] !== undefined ? Number(getMetrics[1]) / 1e18 : 'Loading...'} ETH
            </p>
            <p>
                totalTokensLaunched: {getMetrics?.[2]}
            </p>
            <p>
                totalTokensListed: {getMetrics?.[3]}
            </p>
            <p>
                totalTaxedTokens: {getMetrics?.[4]}
            </p>
            <p>
                totalZeroTaxTokens: {getMetrics?.[5]}
            </p>
        </div>
    )
}

export default Home;