import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { DayForgeLogo } from '../components/common/DayForgeLogo';
import { AvatarSelector } from '../components/common/AvatarSelector';
import { PublicInstallButton } from '../components/pwa/PublicInstallButton';
import { Lock, Mail, User, ArrowRight, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  // Multi-step signup flow:
  // Step 1: Full Name
  // Step 2: Choose Your 3D Avatar
  // Step 3: Username & Email
  // Step 4: Password & Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [fullName, setFullName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecial;
  const doPasswordsMatch = password && password === confirmPassword;

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleSelectAvatarAndContinue = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    setErrorMsg('');
  };

  const handleNextFromStep2 = () => {
    if (!selectedAvatarId) {
      setErrorMsg('Please select an avatar to represent your character.');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleNextFromStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setErrorMsg('Please ensure your password meets all complexity requirements.');
      return;
    }
    if (!doPasswordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      await register({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        avatar_url: selectedAvatarId || undefined,
      });

      showSuccess('Account Created!', 'Welcome to DayForge. Let’s configure your habit goals.');
      navigate('/onboarding');
    } catch (err: any) {
      let msg = 'Failed to create account. Please try again.';
      if (typeof err.response?.data?.detail === 'string') {
        msg = err.response.data.detail;
      } else if (Array.isArray(err.response?.data?.detail) && err.response.data.detail.length > 0) {
        msg = err.response.data.detail[0].msg || err.response.data.detail[0].message || 'Invalid registration details.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
      showError('Registration Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Floating Action Bar with PWA Install Button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex items-center justify-between mb-5 px-1">
        <Link to="/welcome" className="inline-block group">
          <DayForgeLogo size="md" />
        </Link>

        <PublicInstallButton variant="header" size="sm" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-5">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Create your account
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
          Begin your journey of daily compounding discipline.
        </p>

        {/* Step Progress Pills */}
        <div className="flex items-center justify-center gap-1.5 mt-3.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-8 bg-[#6C5CE7] shadow-xs'
                  : step > s
                  ? 'w-3.5 bg-[#6C5CE7]/60'
                  : 'w-3 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Card className="bg-white border border-slate-200/90 p-5 sm:p-8 rounded-3xl shadow-soft">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Full Name */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                onSubmit={handleNextFromStep1}
                className="space-y-4 sm:space-y-5"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 px-2.5 py-1 rounded-full">
                    Step 1 of 4
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2">
                    What is your name?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your name will be used on your character sheet and daily focus greeting.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      autoFocus
                      autoComplete="name"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 transition-all min-h-[48px]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-black text-sm rounded-2xl min-h-[48px] shadow-md shadow-[#6C5CE7]/25"
                  rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                >
                  Continue to 3D Avatar
                </Button>
              </motion.form>
            )}

            {/* STEP 2: Choose 3D Avatar */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <AvatarSelector
                  selectedAvatarId={selectedAvatarId}
                  onSelect={handleSelectAvatarAndContinue}
                  title="Choose Your 3D Avatar"
                  subtitle="Select a realistic 3D human character render that fits your vibe"
                />

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setStep(1)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="min-h-[44px]"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleNextFromStep2}
                    disabled={!selectedAvatarId}
                    rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                    className="font-black px-6 min-h-[44px]"
                  >
                    Next: Account Details
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Username & Email */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                onSubmit={handleNextFromStep3}
                className="space-y-4"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 px-2.5 py-1 rounded-full">
                    Step 3 of 4
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2">
                    Account Credentials
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose a unique username and your login email address.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="e.g. alexforge"
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C5CE7] min-h-[44px]"
                    />
                  </div>
                </div>

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
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C5CE7] min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setStep(2)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="min-h-[44px]"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                    className="font-black px-6 min-h-[44px]"
                  >
                    Next: Set Password
                  </Button>
                </div>
              </motion.form>
            )}

            {/* STEP 4: Password & Confirm Password */}
            {step === 4 && (
              <motion.form
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                onSubmit={handleFinalSubmit}
                className="space-y-4"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 px-2.5 py-1 rounded-full">
                    Step 4 of 4
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2">
                    Secure Your Account
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Create a strong master password for DayForge.
                  </p>
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
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C5CE7] min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C5CE7] min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      ✓
                    </div>
                    <span className={hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                      At least 8 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      ✓
                    </div>
                    <span className={hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                      Includes at least 1 number
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${hasSpecial ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      ✓
                    </div>
                    <span className={hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                      Includes at least 1 special character
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${doPasswordsMatch ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      ✓
                    </div>
                    <span className={doPasswordsMatch ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                      Passwords match
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setStep(3)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="min-h-[44px]"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    disabled={!isPasswordValid || !doPasswordsMatch}
                    className="font-black px-6 min-h-[48px] shadow-md shadow-[#6C5CE7]/25"
                  >
                    Create Account
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>

        {/* Bottom Sign-In Link */}
        <p className="mt-6 text-center text-xs font-semibold text-slate-500">
          Already have a DayForge account?{' '}
          <Link
            to="/login"
            className="font-black text-[#6C5CE7] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
