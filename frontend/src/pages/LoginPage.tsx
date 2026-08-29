import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { DayForgeLogo } from '../components/common/DayForgeLogo';
import { PublicInstallButton } from '../components/pwa/PublicInstallButton';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      showSuccess('Welcome back!', 'Session authenticated successfully.');
      navigate('/');
    } catch (err: any) {
      let msg = 'Incorrect email or password. Please check your credentials.';
      if (typeof err.response?.data?.detail === 'string') {
        msg = err.response.data.detail;
      } else if (Array.isArray(err.response?.data?.detail) && err.response.data.detail.length > 0) {
        msg = err.response.data.detail[0].msg || err.response.data.detail[0].message || 'Invalid login details.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
      showError('Authentication Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Header with DayForge Official Logo & PWA Install Button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex items-center justify-between mb-6 px-1">
        <Link to="/welcome" className="inline-block group">
          <DayForgeLogo size="md" />
        </Link>

        <PublicInstallButton variant="header" size="sm" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
          Sign in to check in on your habits and keep your streak alive.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white border border-slate-200/90 p-6 sm:p-8 rounded-3xl shadow-soft">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 transition-all min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 transition-all min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none min-h-[32px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6C5CE7] focus:ring-[#6C5CE7]"
                />
                <span className="text-xs font-semibold text-slate-600">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Please contact support to reset your password.')}
                className="text-xs font-bold text-[#6C5CE7] hover:underline min-h-[32px]"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-black text-sm rounded-2xl mt-2 min-h-[48px] shadow-md shadow-[#6C5CE7]/25"
              rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Bottom Link to Sign Up */}
        <p className="mt-6 text-center text-xs font-semibold text-slate-500">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="font-black text-[#6C5CE7] hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
