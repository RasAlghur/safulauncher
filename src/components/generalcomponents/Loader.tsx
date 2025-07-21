// import rocket from "../../assets/rocket.svg";
// import { GoRocket } from "react-icons/go";
import rocket from "../../assets/Rocket Lunch.webm";

const RocketLoader = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#EDF8FF] dark:bg-[#040a1a]">
      <video
        src={rocket}
        autoPlay
        loop
        muted
        playsInline
        className="w-[300px] sm:size-[350px] lg:w-auto pr-[20px]"
      />

      <p className="mt-6 text-sm sm:text-base md:text-lg text-Primary font-medium sm:font-bold font-raleway animate-pulse">
        Launching...
      </p>
    </div>
  );
};

export default RocketLoader;

// import { useEffect, useRef } from "react";
// import gsap from "gsap";
// // import rocket from "../../assets/Rocket Lunch.webm";
// import rocketLaunch from "../../assets/rocket-start-up.png";

// const RocketLoader = () => {
//   const rocketRef = useRef<HTMLImageElement | null>(null);

//   useEffect(() => {
//     if (!rocketRef.current) return;

//     gsap.fromTo(
//       rocketRef.current,
//       {
//         x: -100,
//         y: 100,
//         opacity: 0.8,
//       },
//       {
//         x: 100,
//         y: -100,
//         opacity: 1,
//         duration: 2.5,
//         repeat: -1,
//         yoyo: true,
//         ease: "power1.inOut",
//       }
//     );
//   }, []);

//   return (
//     <div className="h-screen w-full flex flex-col items-center justify-center bg-[#EDF8FF] dark:bg-[#040a1a] overflow-hidden">
//       <img
//         ref={rocketRef}
//         src={rocketLaunch}
//         alt="rocket"
//         className="w-[300px] sm:w-[400px] lg:w-[500px]"
//       />

//       <p className="mt-6 text-sm sm:text-base md:text-lg text-Primary font-medium sm:font-bold font-raleway animate-pulse">
//         Launching...
//       </p>
//     </div>
//   );
// };

// export default RocketLoader;
