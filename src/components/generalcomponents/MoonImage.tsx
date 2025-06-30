import moon from "../../assets/moon.png";

const MoonImage = ({ moonRef }: { moonRef: React.Ref<HTMLImageElement> }) => {
  return (
    <img
      ref={moonRef}
      src={moon}
      alt="moon"
      className="rounded-full w-[300px] sm:size-[350px] lg:w-auto pr-[20px] hidden dark:block"
      loading="lazy"
      decoding="async"
    />
  );
};

export default MoonImage;
