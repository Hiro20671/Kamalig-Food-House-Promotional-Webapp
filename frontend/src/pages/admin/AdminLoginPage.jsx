import React, { useState, useRef, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Delete,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { publicApi } from '../../services/api';
import KamaligLogo from '../../components/common/KamaligLogo';

const DEFAULT_ACCESS_CODE = '1830';

export default function AdminLoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  // Step 1: 4-Digit Security Passcode ("1830") Gate State
  const [pinVerified, setPinVerified] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Step 2: Owner Credentials Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!pinVerified && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [pinVerified]);

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const verifyPinCode = async (candidateDigits) => {
    const code = candidateDigits.join('');
    if (code.length < 4) return;
    try {
      const res = await publicApi.verifyAccessCode(code);
      if (res && res.verified) {
        setPinError('');
        setPinVerified(true);
        return;
      }
    } catch (err) {
      if (err.status !== 403 && code === DEFAULT_ACCESS_CODE) {
        setPinError('');
        setPinVerified(true);
        return;
      }
    }
    setPinError('Incorrect 4-digit security code. Please enter the authorized owner code.');
    setDigits(['', '', '', '']);
    setTimeout(() => {
      inputRefs[0].current?.focus();
    }, 50);
  };

  const handleDigitChange = (index, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = clean;
    setDigits(nextDigits);
    setPinError('');

    if (clean && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    if (nextDigits.every((d) => d !== '')) {
      verifyPinCode(nextDigits);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const nextDigits = [...digits];
      nextDigits[index - 1] = '';
      setDigits(nextDigits);
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleKeypadPress = (numStr) => {
    const emptyIdx = digits.findIndex((d) => d === '');
    if (emptyIdx === -1) return;
    const nextDigits = [...digits];
    nextDigits[emptyIdx] = numStr;
    setDigits(nextDigits);
    setPinError('');

    if (emptyIdx < 3) {
      inputRefs[emptyIdx + 1].current?.focus();
    } else {
      verifyPinCode(nextDigits);
    }
  };

  const handleKeypadBackspace = () => {
    let lastFilled = -1;
    for (let i = 3; i >= 0; i--) {
      if (digits[i] !== '') {
        lastFilled = i;
        break;
      }
    }
    if (lastFilled !== -1) {
      const nextDigits = [...digits];
      nextDigits[lastFilled] = '';
      setDigits(nextDigits);
      setPinError('');
      inputRefs[lastFilled].current?.focus();
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101C28] text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#171B20] border border-[#F6C928]/35 p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex justify-center">
            <KamaligLogo size="lg" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6C928]/15 text-[#F6C928] text-xs font-extrabold uppercase tracking-wider">
            {pinVerified ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Code Verified • Owner CMS</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Protected Owner Access</span>
              </>
            )}
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            {pinVerified ? 'Sign In to Manage Website' : 'Enter 4-Digit Owner Code'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {pinVerified
              ? 'Enter your owner username and password to access the Kamalig CMS.'
              : 'Please enter the 4-digit security passcode to unlock the Owner Login screen.'}
          </p>
        </div>

        {/* STEP 1: 4-DIGIT PASSCODE ("1830") GATE */}
        {!pinVerified ? (
          <div className="space-y-6">
            {pinError && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            {/* 4-Digit Input Boxes */}
            <div className="flex justify-center gap-3 sm:gap-4">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  aria-label={`Passcode Digit ${idx + 1}`}
                  className="w-14 h-16 sm:w-16 sm:h-18 text-center font-display font-black text-2xl sm:text-3xl rounded-2xl bg-[#101C28] border-2 border-white/15 focus:border-[#F6C928] text-[#F6C928] focus:outline-none shadow-inner transition-colors"
                />
              ))}
            </div>

            {/* Interactive Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="py-3 rounded-xl bg-[#101C28] hover:bg-[#F6C928] text-white hover:text-[#101C28] font-display font-bold text-lg border border-white/10 transition-colors cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDigits(['', '', '', '']);
                  setPinError('');
                  inputRefs[0].current?.focus();
                }}
                className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3 rounded-xl bg-[#101C28] hover:bg-[#F6C928] text-white hover:text-[#101C28] font-display font-bold text-lg border border-white/10 transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                aria-label="Backspace"
                className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: OWNER USERNAME & PASSWORD LOGIN FORM */
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                4-Digit Security Code Verified
              </span>
              <button
                type="button"
                onClick={() => {
                  setPinVerified(false);
                  setDigits(['', '', '', '']);
                }}
                className="text-[11px] underline text-gray-300 hover:text-white cursor-pointer"
              >
                Lock
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter owner username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#101C28] border border-white/15 focus:border-[#F6C928] text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#101C28] border border-white/15 focus:border-[#F6C928] text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-display font-extrabold text-sm bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Signing In...' : 'Sign In to Owner Dashboard'}
              </button>
            </form>
          </div>
        )}

        <div className="pt-4 border-t border-white/10 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#F6C928] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
