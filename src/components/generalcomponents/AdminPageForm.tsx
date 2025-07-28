import { useState, useEffect } from "react";
// import axios from "axios";

// interface FeaturedToken {
//   address: string;
//   start: string; // ISO
//   end: string; // ISO
// }

const AdminPageForm = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  //   const [featuredTokens, setFeaturedTokens] = useState<FeaturedToken[]>([]);
  //   const [editingAddress, setEditingAddress] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedTokens();
  }, []);

  const fetchFeaturedTokens = async () => {
    //    This function fetches the list of featured tokens from the backend
  };

  const handleSubmit = async () => {
    // backend logic will be here
  };

  //   This function is used to edit a featured token
  //   const handleEdit = (token: FeaturedToken) => {
  //     setTokenAddress(token.address);
  //     setStart(token.start.slice(0, 16)); // format to 'YYYY-MM-DDTHH:mm'
  //     setEnd(token.end.slice(0, 16));
  //     setEditingAddress(token.address);
  //   };

  //  This function is used to delete a featured token
  //   const handleDelete = async (address: string) => {
  //     try {
  //       await axios.delete(`/api/featured-tokens/${address}`);
  //       fetchFeaturedTokens();
  //     } catch (err) {
  //       console.error("Error deleting token:", err);
  //     }
  //   };

  //   const resetForm = () => {
  //     setTokenAddress("");
  //     setStart("");
  //     setEnd("");
  //     setEditingAddress(null);
  //   };

  return (
    <div className="p-4 max-w-4xl mx-auto mt-28">
      <h1 className="text-2xl font-bold mb-4 dark:text-white text-black font-raleway">
        Admin - Manage Featured Tokens
      </h1>

      <div className="space-y-6">
        <div>
          <label className="text-lg font-semibold dark:text-white text-black block mb-2">
            Token Address
          </label>
          <input
            type="text"
            className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-lg font-semibold dark:text-white text-black block mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-lg font-semibold dark:text-white text-black block mb-2">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <button
          className="text-[1rem] font-bold px-[24px] py-[13px] flex items-center justify-center text-white cursor-pointer gap-3 hero-cta dark:bg-[#0C8CE0] rounded-full"
          onClick={handleSubmit}
        >
          Add Advertisement
        </button>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4 dark:text-white text-black">
          Featured Advertisements
        </h2>
        <ul className="space-y-3">
          {/* {featuredTokens.map((token) => (
            <li
              key={token.address}
              className="p-4 border rounded-md flex justify-between items-start flex-col md:flex-row md:items-center"
            >
              <div>
                <p className="font-medium">{token.address}</p>
                <p className="text-sm text-gray-500">
                  Start: {new Date(token.start).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  End: {new Date(token.end).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3 mt-3 md:mt-0">
                <button
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => handleEdit(token)}
                >
                  Edit
                </button>
                <button
                  className="text-red-600 hover:underline text-sm"
                  onClick={() => handleDelete(token.address)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))} */}
        </ul>
      </div>
    </div>
  );
};

export default AdminPageForm;
