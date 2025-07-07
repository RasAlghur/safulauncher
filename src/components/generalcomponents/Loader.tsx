import { RingLoader } from "react-spinners";

const Loader = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#EDF8FF] dark:bg-[#040a1a]">
      <RingLoader size={150} color="#1486d4" />

      <p className="mt-6 text-sm sm:text-base md:text-lg text-Primary font-medium sm:font-bold font-raleway animate-pulse">
        Launching...
      </p>
    </div>
  );
};

export default Loader;
