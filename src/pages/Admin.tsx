import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/launchintro/Navbar";
import AdminPageForm from "../components/generalcomponents/AdminPageForm";
import AdminContractConfig from "../components/generalcomponents/AdminContractConfig";
import Footer from "../components/launchintro/Footer";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useApiClient } from "../lib/api";

const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();

const Admin = () => {
  const base = useApiClient();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "contract">("form");

  useEffect(() => {
    if (!isConnected) {
      setIsAuthorized(false);
      return;
    }

    if (address?.toLowerCase() === ADMIN_ADDRESS) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [address, isConnected]);

  if (isAuthorized === false) {
    return (
      <>
        {/* <div className="min-h-screen flex flex-col px-4 mountain">
          <Navbar />
          <div className="bg-white mx-auto mt-28 flex flex-col items-center justify-center dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-[#e11d48] dark:text-red-400">
              Access Denied
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              404 - You are not authorized to access this page.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold transition duration-200"
            >
              Go to Homepage
            </button>
          </div>
          <div className="mt-auto">
            <Footer />
          </div>
        </div> */}

        <main className="min-h-screen w-full flex flex-col justify-center items-center bg-[#1A2238]">
          <Navbar />
          <div className="mt-40 flex flex-col items-center justify-center text-center">
            <h1 className="text-9xl font-extrabold text-white tracking-widest">
              404
            </h1>
            <div className="bg-Primary px-2 text-sm rounded rotate-12 absolute">
              Page Not Found
            </div>
            <button className="mt-5">
              <a className="relative inline-block text-sm font-medium text-Primary group active:text-orange-500 focus:outline-none focus:ring">
                <span className="absolute inset-0 transition-transform translate-x-0.5 translate-y-0.5 bg-Primary group-hover:translate-y-0 group-hover:translate-x-0"></span>
                <span
                  onClick={() => navigate("/")}
                  className="relative block px-8 py-3 bg-[#1A2238] border border-current"
                >
                  Go Home
                </span>
              </a>
            </button>
          </div>
          <div className="mt-auto w-full">
            <Footer />
          </div>
        </main>
      </>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg dark:text-white">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col mountain">
      <Navbar />
      <div className="flex-grow pt-20">
        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 mt-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("form")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === "form"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
            >
              Admin Form
            </button>
            <button
              onClick={() => setActiveTab("contract")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === "contract"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
            >
              Contract Config
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "form" ? (
          <AdminPageForm address={address}/>
        ) : (
          <AdminContractConfig />
        )}
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default Admin;
