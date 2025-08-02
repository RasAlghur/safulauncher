import logo from "../../assets/logo.png";
import DustParticles from "../generalcomponents/DustParticles";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="pt-6 pb-10 footer-snow">
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className="lg:size-[30rem] lg:w-[50rem] lg:h-[15rem] rounded-full bg-[#3BC3DB]/10 absolute top-6 -right-40 blur-3xl hidden dark:block"></div>
      <div className="border-b border-b-black/15 dark:border-b-white/20 max-w-[1200px] mx-auto flex flex-col md:flex-row gap-2 justify-between items-center pb-4">
        <a href="/">
          <img src={logo} alt="logo" className="" />
        </a>

        <ul className="flex flex-col md:flex-row items-center gap-6 font-raleway font-medium">
          {[
            { to: "/launchintro", title: "Home" },
            { to: "/tokens", title: "Token" },
            { to: "/launch", title: "Launch" },
            { to: "/leaderboard", title: "Leaderboard" },
            { to: "/profile", title: "Profile" },
          ].map(({ to, title }) => (
            <a
              key={title}
              href={to}
              className=" dark:text-white text-black font-raleway text-lg"
              onClick={() => {
                navigate(to);
              }}
            >
              {title}
            </a>
          ))}
        </ul>

        <div className="flex gap-2 items-center justify-center">
          {/* Twitter */}
          <a
            href="https://x.com/SafuLauncher"
            className="p-2 rounded-full border border-black/50 dark:border-white/50 dark:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              stroke-width="0"
              viewBox="0 0 512 512"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
            </svg>
          </a>
          {/* Telegram */}
          <a
            href="https://t.me/Safu_Launcher"
            className="p-2 rounded-full border border-black/50 dark:border-white/50 dark:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              stroke-width="0"
              viewBox="0 0 496 512"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"></path>
            </svg>
          </a>

          {/* Gitbook */}
          <a
            href="https://safulauncher-1.gitbook.io/safulauncher-docs"
            className="p-2 rounded-full border border-black/50 dark:border-white/50 dark:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              stroke-width="0"
              role="img"
              viewBox="0 0 24 24"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.513 1.097c-.645 0-1.233.34-2.407 1.017L3.675 5.82A7.233 7.233 0 0 0 0 12.063v.236a7.233 7.233 0 0 0 3.667 6.238L7.69 20.86c2.354 1.36 3.531 2.042 4.824 2.042 1.292.001 2.47-.678 4.825-2.038l4.251-2.453c1.177-.68 1.764-1.02 2.087-1.579.323-.56.324-1.24.323-2.6v-2.63a1.04 1.04 0 0 0-1.558-.903l-8.728 5.024c-.587.337-.88.507-1.201.507-.323 0-.616-.168-1.204-.506l-5.904-3.393c-.297-.171-.446-.256-.565-.271a.603.603 0 0 0-.634.368c-.045.111-.045.282-.043.625.002.252 0 .378.025.494.053.259.189.493.387.667.089.077.198.14.416.266l6.315 3.65c.589.34.884.51 1.207.51.324 0 .617-.17 1.206-.509l7.74-4.469c.202-.116.302-.172.377-.13.075.044.075.16.075.392v1.193c0 .34.001.51-.08.649-.08.14-.227.224-.522.394l-6.382 3.685c-1.178.68-1.767 1.02-2.413 1.02-.646 0-1.236-.34-2.412-1.022l-5.97-3.452-.043-.025a4.106 4.106 0 0 1-2.031-3.52V11.7c0-.801.427-1.541 1.12-1.944a1.979 1.979 0 0 1 1.982-.001l4.946 2.858c1.174.679 1.762 1.019 2.407 1.02.645 0 1.233-.34 2.41-1.017l7.482-4.306a1.091 1.091 0 0 0 0-1.891L14.92 2.11c-1.175-.675-1.762-1.013-2.406-1.013Z"></path>
            </svg>
          </a>
          {/* Etherscan */}
          <a
            href="#"
            className="p-2 rounded-full border border-black/50 dark:border-white/50 dark:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              stroke-width="0"
              viewBox="0 0 320 512"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"></path>
            </svg>
          </a>
        </div>
      </div>

      <p className="mt-2 dark:text-white text-black text-center">
        © {new Date().getFullYear()} All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
