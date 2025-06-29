// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import Home from "./pages/Home";
import Launch from "./pages/Launch";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Tokens from "./pages/Tokens";
import Trade from "./pages/Trade";
import LaunchIntro from "./pages/Launchintro";

function App() {
  return (
    <Router>
      {/* Header with navigation */}
      {/* <header style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Navigation />
          <ConnectButton />
        </div>
      </header> */}
      <main className="relative  bg-[#EDF8FF] dark:bg-[#040a1a]">
        {/* Main content with routes */}
        <div className="relative z-10">
          {/* <div className="absolute inset-0 bg-gradient-to-l from-[#3BC3DB] to-[#0C8CE0] opacity-[0.08] pointer-events-none dark:hidden -z-10" /> */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/launch" element={<Launch />} />
            <Route path="/launchintro" element={<LaunchIntro />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/trade" element={<Trade />} />
            + <Route path="/trade/:tokenAddress" element={<Trade />} />
          </Routes>
        </div>
      </main>
    </Router>
  );
}

export default App;

// import { lazy, Suspense } from "react";

// const Home = lazy(() => import("./pages/Home"));
// const Launch = lazy(() => import("./pages/Launch"));
// const Leaderboard = lazy(() => import("./pages/Leaderboard"));
// const Profile = lazy(() => import("./pages/Profile"));
// const Tokens = lazy(() => import("./pages/Tokens"));
// const Trade = lazy(() => import("./pages/Trade"));
// const LaunchIntro = lazy(() => import("./pages/Launchintro"));

// function App() {
//   return (
//     <Router>
//       <main className="relative bg-[#EDF8FF] dark:bg-[#040a1a]">
//         <Suspense fallback={<div className="text-white text-center py-10">Loading...</div>}>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/launch" element={<Launch />} />
//             <Route path="/launchintro" element={<LaunchIntro />} />
//             <Route path="/leaderboard" element={<Leaderboard />} />
//             <Route path="/profile" element={<Profile />} />
//             <Route path="/tokens" element={<Tokens />} />
//             <Route path="/trade" element={<Trade />} />
//             <Route path="/trade/:tokenAddress" element={<Trade />} />
//           </Routes>
//         </Suspense>
//       </main>
//     </Router>
//   );
// }
