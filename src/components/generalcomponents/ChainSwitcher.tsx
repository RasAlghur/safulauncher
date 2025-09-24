

/**
 * Chain Switcher Component
 */

import { useChainId, useSwitchChain } from "wagmi";
import { SiEthereum } from "react-icons/si";
import { SiBinance } from "react-icons/si";

const ChainSwitcher = () => {
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();


  // Define supported chains with their icons and names
  const supportedChains = [
    {
      id: 56, // BSC Mainnet
      name: "BNB Chain",
      icon: <SiBinance className="w-5 h-5" />
    },
    {
      id: 1, // Ethereum Mainnet
      name: "Ethereum",
      icon: <SiEthereum className="w-4 h-4" />
    }
  ];

  const getCurrentChain = () => {
    return supportedChains.find(chain =>
      chain.id === chainId
    ) || supportedChains[0]; // Default to BNB
  };

  const currentChain = getCurrentChain();


  const switchToChain = (targetChain: typeof supportedChains[0]) => {
    // Try to switch to mainnet first, fallback to testnet
    try {
      switchChain({ chainId: targetChain.id });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.warn(`Could not switch to mainnet`);
      try {
      } catch (testnetError) {
        console.error('Failed to switch chain:', testnetError);
      }
    }
  };

  return (
    <div className="flex justify-center mb-6 mt-4">
      <div className="flex bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-full p-1 border border-white/20">
        {supportedChains.map((chain) => {
          const isActive = chain.id === currentChain.id ||
            (chain.id === currentChain.id) 

          return (
            <button
              key={chain.id}
              onClick={() => switchToChain(chain)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-[#3BC3DB] to-[#0C8CE0] text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5'
                }
              `}
            >
              <span className={`${isActive ? 'text-white' : 'text-current'}`}>
                {chain.icon}
              </span>
              <span className="font-medium text-sm">{chain.name}</span>
              {isActive && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ChainSwitcher;