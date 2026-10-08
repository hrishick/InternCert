import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Award, ShieldCheck, FileSpreadsheet, GraduationCap, LogOut, User, Menu, X, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, openAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isStaff = user && ['superadmin', 'admin', 'teacher'].includes(user.role);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-glow-brand group-hover:scale-105 transition-transform duration-300">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-brand-400 transition-colors">
                  Intern<span className="text-brand-500">Cert</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-brand-500/10 border border-brand-500/30 text-brand-400 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Automated Credential Engine
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/') 
                  ? 'text-white bg-slate-800/80 shadow-inner' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Home
            </Link>

            <Link
              to="/student"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/student') || location.pathname.startsWith('/workspace')
                  ? 'text-white bg-slate-800/80 shadow-inner' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-brand-400" />
              Student Portal
            </Link>

            <Link
              to="/admin"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/admin') 
                  ? 'text-white bg-slate-800/80 shadow-inner' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              {user?.role === 'superadmin' ? 'SuperAdmin Portal' : (user?.role === 'teacher' ? 'Faculty Portal' : 'Admin Portal')}
            </Link>

            <Link
              to="/verify"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/verify') || location.pathname.startsWith('/verify/')
                  ? 'text-white bg-slate-800/80 shadow-inner' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-gold-500" />
              Public Verifier
            </Link>
          </nav>

          {/* User Status / Login Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    user.role === 'superadmin' ? 'bg-amber-400 animate-pulse' :
                    user.role === 'teacher' ? 'bg-indigo-400' :
                    user.role === 'admin' ? 'bg-emerald-400' : 'bg-brand-400'
                  }`} />
                  <span className="font-semibold text-slate-200">{user.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                    user.role === 'superadmin' ? 'bg-amber-500/20 text-gold-300 border border-amber-500/30' :
                    user.role === 'teacher' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    user.role === 'admin' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('login')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand transition-all flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </button>

                <button
                  onClick={() => openAuth('register')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Home
          </Link>
          <Link
            to="/student"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Student Portal
          </Link>
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Admin Portal
          </Link>
          <Link
            to="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Verify Certificate
          </Link>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('login');
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-brand-600 text-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('register');
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200"
                >
                  Register
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full py-2 rounded-lg text-sm text-rose-400 bg-rose-500/10"
              >
                Sign Out ({user.name} - {user.role})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
