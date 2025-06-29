import chain1 from "../../assets/chain-1.png";
import chain2 from "../../assets/chain-2.png";
import DustParticles from "./DustParticles";

const HowItWorks = () => {
  return (
    <section
      className="lg:pb-20 lg:pt-28 relative overflow-x-hidden"
      id="howitworks"
    >
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <img
        src={chain1}
        // width={658}
        // height={658}
        alt=""
        className="absolute top-0 -left-[25rem] size-[658px]"
      />
      <img
        src={chain2}
        // width={658}
        // height={658}
        alt=""
        className="absolute bottom-0 -right-[25rem] size-[658px]"
      />
      <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 hidden dark:block blur-3xl"></div>
      <div className=" text-white px-6 py-12 md:px-20 md:py-10  max-w-[1000px] mx-auto subtract">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl max-w-[20rem] font-bold mb-10 dark:text-[#ECF1F0] text-black font-raleway">
            How It Works in 3 Easy Steps
          </h2>
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-10 ">
            {/* Step 1 */}
            <div className="flex flex-col gap-[34px]">
              <div>
                <div className="flex items-center mb-4">
                  <span className="bg-[#0C8CE0] text-white font-bold font-raleway rounded-md px-2 py-1 text-sm mr-3">
                    01
                  </span>
                  <h3 className="text-xl font-semibold font-raleway dark:text-white text-black">
                    Configure & Deploy
                  </h3>
                </div>
                <p className="dark:text-white text-[#141313]">
                  Fill out a simple form - name, supply, optional tax settings,
                  whitelist and bundle options.
                </p>
              </div>
              {/* Step 2 */}
              <div>
                <div className="flex items-center mb-4">
                  <span className="bg-[#0C8CE0] text-white font-bold font-raleway rounded-md px-2 py-1 text-sm mr-3">
                    02
                  </span>
                  <h3 className="text-xl font-semibold font-raleway dark:text-white text-black">
                    Presale & Public Trading
                  </h3>
                </div>
                <p className="dark:text-white text-[#141313]">
                  Whitelisted and bundle addresses get first access; then the
                  public trades on our internal AMM with a 0.3% fee.
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div>
              <div className="flex items-center mb-4">
                <span className="bg-[#0C8CE0] text-white font-bold font-raleway rounded-md px-2 py-1 text-sm mr-3">
                  03
                </span>
                <h3 className="text-xl font-semibold font-raleway dark:text-white text-black">
                  Auto-List & Secure
                </h3>
              </div>
              <p className="dark:text-white text-[#141313] mb-2">
                Once the goal is reached, SafuLauncher automatically:
              </p>
              <ul className="dark:text-white text-[#141313] list-disc pl-6 space-y-1">
                <li>Takes a 5% listing fee & pays 0.2 ETH to the team</li>
                <li>Adds remaining ETH + tokens to Uniswap</li>
                <li>Locks or burns LP tokens</li>
                <li>Renounces contract ownership</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
