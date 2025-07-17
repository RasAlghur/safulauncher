// import rocket from "../../assets/rocket.svg";
import { GoRocket } from "react-icons/go";

const RocketLoader = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#EDF8FF] dark:bg-[#040a1a]">
      <div className="relative animate-launch">
        <GoRocket className="text-Primary text-[5rem]" />
        {/* <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 w-4 h-12 bg-orange-500 rounded-full animate-flame" /> */}
      </div>

      <p className="mt-6 text-sm sm:text-base md:text-lg text-Primary font-medium sm:font-bold font-raleway animate-pulse">
        Launching...
      </p>
    </div>
  );
};

export default RocketLoader;
