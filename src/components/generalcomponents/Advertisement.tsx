import React from "react";

const Advertisement = () => {
  return (
    <section>
      <div className="grid grid-cols-2 gap-[9px]">
        <div className="flex items-center justify-center bg-[#4C045B] lg:py-[20px] text-white font-raleway rounded-[10px] text-[8px] sm:text-[10px] md:text-[12px] lg:text-xl font-semibold">
          Your Ads Here!
        </div>
        <div className="flex items-center justify-center bg-[#3F3741] py-[16px] lg:py-[20px] text-white font-raleway rounded-[10px] text-[8px] sm:text-[10px] md:text-[12px] lg:text-xl font-semibold">
          Your Ads Here!
        </div>
      </div>
      <div className="grid grid-cols-4 gap-[9px] mt-[10px]">
        <div className="flex items-center justify-center bg-[#FF0425] py-[16px] lg:py-[47px] text-white font-raleway rounded-[10px] text-[8px] sm:text-[10px] md:text-[12px] lg:text-xl font-semibold">
          Your Ads Here!
        </div>
        <div className="flex items-center justify-center bg-[#1AA8E4] py-[16px] lg:py-[47px] text-white font-raleway rounded-[10px] text-[8px] sm:text-[10px] md:text-[12px] lg:text-xl font-semibold">
          Your Ads Here!
        </div>
        <div className="flex items-center justify-center bg-[#3BC25F] py-[16px] lg:py-[47px] text-white font-raleway rounded-[10px] text-[8px] sm:text-[10px] md:text-[12px] lg:text-xl font-semibold">
          Your Ads Here!
        </div>
        <div className="flex items-center justify-center bg-[#C762DB] py-[16px] lg:py-[47px] text-white font-raleway rounded-[10px] text-[8px] sm:text-[10px] md:text-[12px] lg:text-xl font-semibold">
          Your Ads Here!
        </div>
      </div>
    </section>
  );
};

export default Advertisement;
