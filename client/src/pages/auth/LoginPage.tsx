import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [schoolCode, setSchoolCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
        schoolCode: schoolCode.trim() || undefined,
      });

      // Role-based redirect will occur or default to dashboard
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'SUPER_ADMIN') {
          navigate('/super-admin');
        } else if (payload.role === 'TEACHER') {
          navigate('/teacher/attendance');
        } else if (payload.role === 'PARENT') {
          navigate('/parent/portal');
        } else if (payload.role === 'PRINCIPAL') {
          navigate('/principal');
        } else if (payload.role === 'COORDINATOR') {
          navigate('/coordinator');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (type: string) => {
    switch (type) {
      case 'SUPER_ADMIN':
        setSchoolCode('');
        setEmail('superadmin@6thcivilians.com');
        setPassword('Password@123');
        break;
      case 'SCHOOL_ADMIN':
        setSchoolCode('SXMHSS');
        setEmail('admin@stxaviers.edu.in');
        setPassword('Password@123');
        break;
      case 'PRINCIPAL':
        setSchoolCode('SXMHSS');
        setEmail('principal@stxaviers.edu.in');
        setPassword('Password@123');
        break;
      case 'COORDINATOR':
        setSchoolCode('SXMHSS');
        setEmail('coordinator@stxaviers.edu.in');
        setPassword('Password@123');
        break;
      case 'TEACHER':
        setSchoolCode('SXMHSS');
        setEmail('kavitha.math@stxaviers.edu.in');
        setPassword('Password@123');
        break;
      case 'PARENT':
        setSchoolCode('SXMHSS');
        setEmail('subramanian.parent@gmail.com');
        setPassword('Password@123');
        break;
      case 'SCHOOL_2':
        setSchoolCode('GIPS');
        setEmail('admin@greenwood.edu.in');
        setPassword('Password@123');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy-900 text-white font-extrabold text-xl shadow-lg mb-4">
          6C
        </div>
        <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          School Operations Platform
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-semibold tracking-wider uppercase">
          6th Civilians Corporation • Permanent License Architecture
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                School Code <span className="text-slate-400 font-normal">(Optional for Super Admin)</span>
              </label>
              <div className="relative rounded-xl border border-slate-200 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SXMHSS or GIPS"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 rounded-xl focus:outline-none uppercase font-mono tracking-wider"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address or Phone
              </label>
              <div className="relative rounded-xl border border-slate-200 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu.in"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-xl border border-slate-200 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-navy-900 hover:bg-slate-800 transition-all shadow-md shadow-navy-900/10 focus:outline-none disabled:opacity-50"
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In to School Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick Demo Logins (Click to Autofill)
            </span>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleDemoFill('SUPER_ADMIN')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 truncate"
              >
                🏢 Super Admin (6C)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('SCHOOL_ADMIN')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 truncate"
              >
                🏫 School Admin (SX)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('TEACHER')}
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold text-emerald-800 truncate"
              >
                👩‍🏫 Teacher (Class 10)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('PARENT')}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[11px] font-semibold text-blue-800 truncate"
              >
                👨‍👩‍👧 Parent (Divya)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('PRINCIPAL')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 truncate"
              >
                🎓 Principal
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('SCHOOL_2')}
                className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[11px] font-semibold text-purple-800 truncate"
              >
                🏫 School 2 (Greenwood)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

