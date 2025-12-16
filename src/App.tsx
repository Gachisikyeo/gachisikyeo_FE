// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import EmailSignup from "./pages/EmailSignup";
import GoogleSignup from "./pages/GoogleSignup";
import SignupSuccess from "./pages/SignupSuccess";

import "./App.css";

function App() {
  return (
    
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup/email" element={<EmailSignup />} />
        <Route path="/signup/google" element={<GoogleSignup />} />
        <Route path="/signup/success" element={<SignupSuccess />} />

      </Routes>
  
  );
}

export default App;
