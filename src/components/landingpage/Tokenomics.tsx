import piechart from "../../assets/piechart.png";
import DustParticles from "../generalcomponents/DustParticles";

const Tokenomics = () => {
  return (
    <section id="tokenomics" className="lg:py-20 relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className=" py-12 px-6 md:px-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#01061C] dark:text-white">
          Tokenomics
        </h2>
        <div className="flex flex-col lg:flex-row items-center gap-12 justify-center">
          {/* Left Side */}
          <div className="space-y-4 text-[#141313] dark:text-white">
            <p>
              <span className="font-semibold">Token Name:</span> SafuLauncher
            </p>
            <p>
              <span className="font-semibold">Ticker:</span> SAFU
            </p>
            <p>
              <span className="font-semibold">Total Supply:</span> 1,000,000,000
            </p>
            <p>
              <span className="font-semibold">Decimal:</span> 5
            </p>
            <p>
              <span className="font-semibold">Tax:</span> 5/5
            </p>
          </div>
          {/* Right Side */}
          <div className="flex flex-col md:flex-row items-center justify-between lg:gap-8">
            {/* Pie Chart */}
            <img src={piechart} alt="" className="w-full" />
            {/* Distribution Info */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold font-raleway mb-6 text-black dark:text-white">
                Token Distribution
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-3 text-left">
                <div>
                  <div className="flex items-start gap-2 mb-[34px]">
                    <div className="w-3 h-3 rounded-full mt-1 bg-[#2883A3]" />
                    <div className="text-[#141313] dark:text-white">
                      <span className="font-semibold text-xl mb-[10px] text-black dark:text-white">
                        Liquidity
                      </span>
                      <br />
                      400,000,000 (40%)
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mb-[34px]">
                    <div className="w-3 h-3 rounded-full mt-1 bg-[#BD2624]" />
                    <div className="text-[#141313] dark:text-white">
                      <span className="font-semibold text-xl mb-[10px] text-black dark:text-white">
                        Marketing
                      </span>
                      <br />
                      250,000,000 (Vested) (25%)
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-2 mb-[34px]">
                    <div className="w-3 h-3 rounded-full mt-1 bg-[#2CB54A]" />
                    <div className="text-[#141313] dark:text-white">
                      <span className="font-semibold text-xl mb-[10px] text-black dark:text-white">
                        Future Plans
                      </span>
                      <br />
                      Such as CEX listing: 250,000,000 (Locked) (25%)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-full mt-1 bg-[#631DBE]" />
                    <div className="text-[#141313] dark:text-white">
                      <span className="font-semibold text-xl mb-[10px] text-black dark:text-white">
                        Team
                      </span>
                      <br />
                      100,000,000 (Locked) (10%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Tokenomics;
