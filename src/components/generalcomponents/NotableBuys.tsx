// Sample data for notable buys
const notableBuys = [
  {
    username: "@aivan.eth",
    avatarColor: "bg-red-500",
    tokenName: "CLANKVTX",
    tokenColor: "bg-purple-700",
    amount: "$1.2k",
  },
  {
    username: "@annoushka.eth",
    avatarColor: "bg-blue-400",
    tokenName: "CLANKER",
    tokenColor: "bg-indigo-600",
    amount: "$429",
  },
  {
    username: "@jessepollak",
    avatarColor: "bg-yellow-600",
    tokenName: "TINY",
    tokenColor: "bg-gray-700",
    amount: "$12.4K",
  },
  {
    username: "@xprto.eth",
    avatarColor: "bg-violet-600",
    tokenName: "MOAR",
    tokenColor: "bg-emerald-700",
    amount: "$12.4K",
  },
];

const NotableBuys = () => {
  return (
    <section className="dark:bg-[#0A0D24]/40  text-white p-6 rounded-xl w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4lg:text-[24px] font-semibold">
          <span className="dark:text-white text-black lg:text-[24px]">
            Notable Buys
          </span>
          <span className="text-white/30">Big Wins</span>
        </div>
        <button className="text-sm text-gray-400 hover:underline">
          All trades
        </button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {notableBuys.map((buy, index) => (
          <div
            key={index}
            className="dark:bg-[#151A32]/50 bg-[#01061c0d] p-4 rounded-lg flex items-center gap-4"
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-sm ${buy.avatarColor}`}
            >
              {buy.username[1].toUpperCase()}
            </div>

            {/* Text */}
            <div className="text-sm">
              <div className="dark:text-white text-[#141313] font-medium">
                {buy.username}
              </div>
              <div className="flex items-center gap-2 mt-1 text-gray-300">
                <span className="dark:text-white text-[#141313]/50">
                  bought
                </span>
                <span
                  className={`px-2 py-1 rounded-full dark:text-white text-[#141313]text-xs font-semibold ${buy.tokenColor}`}
                >
                  {buy.tokenName}
                </span>
                <span className="dark:text-white text-[#141313]/50">
                  with{" "}
                  <span className="dark:text-white text-[#141313] font-medium">
                    {buy.amount}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NotableBuys;
