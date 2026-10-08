import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import LandingPage from './pages/LandingPage';
import StudentPortal from './pages/StudentPortal';
import InternshipWorkspace from './pages/InternshipWorkspace';
import AdminDashboard from './pages/AdminDashboard';
import VerifyPage from './pages/VerifyPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-brand-500 selection:text-white">
      <Navbar />
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/student" element={<StudentPortal />} />
          <Route path="/workspace/:id" element={<InternshipWorkspace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verify/:certificateId" element={<VerifyPage />} />
        </Routes>
      </main>

      <Footer />
      <AuthModal />
    </div>
  );
}
