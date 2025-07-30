import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/launchintro/Navbar";
import AdminPageForm from "../components/generalcomponents/AdminPageForm";
import Footer from "../components/launchintro/Footer";

const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();

const Admin = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(false);

  useEffect(() => {
    if (!isConnected) {
      setIsAuthorized(false);
      return;
    }

    if (address?.toLowerCase() === ADMIN_ADDRESS) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(true);
    }
  }, [address, isConnected]);

  if (isAuthorized === false) {
    return (
      <>
        <div className="min-h-screen flex flex-col px-4 mountain">
          <Navbar />
          <div className="bg-white mx-auto mt-28 flex flex-col items-center justify-center dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-[#e11d48] dark:text-red-400">
              Access Denied
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              This page is restricted to the admin wallet only.
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
        </div>
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
      <div className="flex-grow">
        <AdminPageForm address={address} />
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default Admin;
