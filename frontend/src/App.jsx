import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import MarketingDashboard from './pages/MarketingDashboard';
import StoreMap from "./pages/StoreMap.jsx";


export default function App() {
  return (
      <Router>
        <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/dashboard" element={<MarketingDashboard />} />
                    <Route path="/map" element={<StoreMap />} />
        </Routes>
      </Router>
      )
}