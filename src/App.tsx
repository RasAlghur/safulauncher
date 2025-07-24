// src/App.tsx
import { lazy, Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import RocketLoader from "./components/generalcomponents/Loader";
import ChatWrapper from "./context/ChatWrapper";
import ErrorsPage from "./pages/errors";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Launch = lazy(() => import("./pages/Launch"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Tokens = lazy(() => import("./pages/Tokens"));
const Trade = lazy(() => import("./pages/Trade"));
const LaunchIntro = lazy(() => import("./pages/Launchintro"));

function App() {
  return (
    <Router>
      <main className="relative bg-[#EDF8FF] dark:bg-[#040a1a]">
        <Suspense fallback={<RocketLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/launch" element={<Launch />} />
            <Route path="/launchintro" element={<LaunchIntro />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/trade/:tokenAddress" element={<Trade />} />
            <Route path="/chat/:tokenAddress" element={<ChatWrapper />} />
            <Route path="/track-error" element={<ErrorsPage />} />
          </Routes>
        </Suspense>
      </main>
    </Router>
  );
}

export default App;
