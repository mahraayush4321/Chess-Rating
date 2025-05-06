import React from "react";
import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/landing";
import PlayPage from "./pages/play";
import LoginPage from "./pages/auth/login";
import SignupPage from "./pages/auth/signup";
import AddMatch from "./pages/addMatches/addMatch";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/addMatches/addMatch" element={<AddMatch />} />
    </Routes>
  );
}

export default App;