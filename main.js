import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate
} from 'https://esm.sh/react-router-dom@6.22.3?deps=react@18.2.0';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { auth, googleProvider } from './firebase-config.js';

// ==================== AUTH UTILITIES ====================
function useAuthState() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
}

function Protected({ children }) {
  const { user, loading } = useAuthState();
  const location = useLocation();

  if (loading) return <PageShell><div className="text-center">Loading...</div></PageShell>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  return children;
}

function AuthLayout({ children }) {
  const { user, loading } = useAuthState();
  if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center"><div>Loading...</div></div>;
  if (user && user.emailVerified) return <Navigate to="/" replace />;
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center py-12">{children}</div>;
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-sky-50 text-slate-800 py-12 px-6">
      {children}
    </div>
  );
}

// ==================== MARGIN CALCULATOR ====================
function MarginCalculator() {
  const [cost, setCost] = useState('');
  const [margin, setMargin] = useState('');
  const [revenue, setRevenue] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0.72);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('marginCalcValues')) || {};
    setCost(saved.cost || '');
    setMargin(saved.margin || '');
    setRevenue(saved.revenue || '');
    
    const hist = JSON.parse(localStorage.getItem('marginCalcHistory')) || [];
    setHistory(hist);

    fetch('https://api.exchangerate-api.com/v4/latest/CAD')
      .then(r => r.json())
      .then(d => setExchangeRate(d.rates.USD))
      .catch(() => {});
  }, []);

  const saveValues = (c, m, r) => {
    localStorage.setItem('marginCalcValues', JSON.stringify({ cost: c, margin: m, revenue: r }));
  };

  const handleCostChange = (val) => {
    setCost(val);
    if (margin) {
      const c = parseFloat(val) || 0;
      const mg = parseFloat(margin) || 0;
      if (c > 0 && mg >= 0 && mg < 100) {
        const rev = c / (1 - mg / 100);
        setRevenue(rev.toFixed(2));
        saveValues(val, margin, rev.toFixed(2));
      }
    } else if (revenue) {
      const c = parseFloat(val) || 0;
      const r = parseFloat(revenue) || 0;
      if (c > 0 && r > c) {
        const mg = 100 * (1 - c / r);
        setMargin(mg.toFixed(2));
        saveValues(val, mg.toFixed(2), revenue);
      }
    } else {
      saveValues(val, margin, revenue);
    }
  };

  const handleMarginChange = (val) => {
    setMargin(val);
    if (cost) {
      const c = parseFloat(cost) || 0;
      const mg = parseFloat(val) || 0;
      if (c > 0 && mg >= 0 && mg < 100) {
        const rev = c / (1 - mg / 100);
        setRevenue(rev.toFixed(2));
        saveValues(cost, val, rev.toFixed(2));
      }
    } else if (revenue) {
      const r = parseFloat(revenue) || 0;
      const mg = parseFloat(val) || 0;
      if (r > 0 && mg >= 0 && mg < 100) {
        const c = r * (1 - mg / 100);
        setCost(c.toFixed(2));
        saveValues(c.toFixed(2), val, revenue);
      }
    } else {
      saveValues(cost, val, revenue);
    }
  };

  const handleRevenueChange = (val) => {
    setRevenue(val);
    if (cost) {
      const c = parseFloat(cost) || 0;
      const r = parseFloat(val) || 0;
      if (c > 0 && r > c) {
        const mg = 100 * (1 - c / r);
        setMargin(mg.toFixed(2));
        saveValues(cost, mg.toFixed(2), val);
      }
    } else if (margin) {
      const r = parseFloat(val) || 0;
      const mg = parseFloat(margin) || 0;
      if (r > 0 && mg >= 0 && mg < 100) {
        const c = r * (1 - mg / 100);
        setCost(c.toFixed(2));
        saveValues(c.toFixed(2), margin, val);
      }
    } else {
      saveValues(cost, margin, val);
    }
  };

  const reset = () => {
    setCost('');
    setMargin('');
    setRevenue('');
    localStorage.removeItem('marginCalcValues');
  };

  const usdRevenue = useMemo(() => {
    const r = parseFloat(revenue) || 0;
    return (r * exchangeRate).toFixed(2);
  }, [revenue, exchangeRate]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <header className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-indigo-600 hover:underline flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Home
          </Link>
          <h1 className="text-2xl font-bold mt-2">Margin & Revenue Calculator</h1>
          <p className="text-sm text-slate-600 mt-1">Enter two values and the third will be calculated. Live USD conversion included.</p>
        </div>
      </header>

      <main className="mt-6 grid gap-6 md:grid-cols-2">
        <section>
          <label className="block text-sm font-medium text-slate-700">Cost (CAD)</label>
          <input type="number" value={cost} onChange={e => handleCostChange(e.target.value)} step="0.01" min="0" placeholder="0.00" className="mt-2 block w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-lg"/>

          <label className="block mt-4 text-sm font-medium text-slate-700">Margin (%)</label>
          <input type="number" value={margin} onChange={e => handleMarginChange(e.target.value)} step="0.01" min="0" max="99.99" placeholder="0.00" className="mt-2 block w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-lg"/>

          <label className="block mt-4 text-sm font-medium text-slate-700">Revenue (CAD)</label>
          <input type="number" value={revenue} onChange={e => handleRevenueChange(e.target.value)} step="0.01" min="0" placeholder="0.00" className="mt-2 block w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-lg"/>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={reset} className="col-span-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">Reset</button>
            <button onClick={() => setShowHistory(!showHistory)} className="col-span-2 bg-gray-200 text-slate-700 py-3 rounded-lg hover:bg-gray-300 transition">{showHistory ? 'Hide' : 'Show'} History</button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="p-4 rounded-lg bg-indigo-50">
            <h3 className="text-lg font-semibold text-indigo-700">Summary</h3>
            <p className="mt-2 text-slate-700">Cost: <span className="font-medium">{(parseFloat(cost) || 0).toFixed(2)} CAD</span></p>
            <p className="mt-1 text-slate-700">Margin: <span className="font-medium">{(parseFloat(margin) || 0).toFixed(2)}%</span></p>
            <p className="mt-1 text-slate-700">Revenue: <span className="font-medium">{(parseFloat(revenue) || 0).toFixed(2)} CAD</span></p>
            <p className="mt-1 text-slate-700">Revenue (USD): <span className="font-medium">{usdRevenue} USD</span></p>
          </div>

          <div className="p-4 rounded-lg bg-white border">
            <p className="text-sm text-slate-600">Revenue in USD: <span className="font-bold text-indigo-600">{usdRevenue}</span></p>
            <p className="text-xs text-slate-400 mt-1">Exchange rate updated live</p>
          </div>
        </aside>
      </main>

      <footer className="mt-8 text-xs text-slate-500">Tip: enter two values (e.g., cost + margin) to compute the third. Values are stored locally in your browser.</footer>
    </div>
  );
}

// ==================== PRICING CALCULATOR ====================
function PricingCalculator() {
  const [currency, setCurrency] = useState('CAD');
  const [cost, setCost] = useState('');
  const [marginA, setMarginA] = useState('30');
  const [marginBCW, setMarginBCW] = useState('40');
  const [exchangeRate, setExchangeRate] = useState(1.39);
  const [calculations, setCalculations] = useState([]);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('pricingHistory')) || [];
    setCalculations(saved);

    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => setExchangeRate(d.rates.CAD))
      .catch(() => {});
  }, []);

  const calculate = () => {
    const c = parseFloat(cost);
    if (!c || c <= 0) return null;

    const mA = parseFloat(marginA) / 100 || 0;
    const mBCW = parseFloat(marginBCW) / 100 || 0;

    const shippingRate = currency === 'CAD' ? 0.03 : 0.04;
    const shipping = c * shippingRate;
    const totalCost = c + shipping;

    const priceA = totalCost / (1 - mA);
    const priceBCW = totalCost / (1 - mBCW);

    return {
      priceA: priceA.toFixed(2),
      priceBCW: priceBCW.toFixed(2),
      shipping: shipping.toFixed(2),
      totalCost: totalCost.toFixed(2),
      costCAD: c.toFixed(2)
    };
  };

  const result = useMemo(() => calculate(), [cost, marginA, marginBCW, currency]);

  const saveToHistory = () => {
    if (!result) return;
    const newCalc = {
      currency,
      cost: parseFloat(cost),
      priceA: parseFloat(result.priceA),
      priceB: parseFloat(result.priceBCW),
      priceC: parseFloat(result.priceBCW),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newCalc, ...calculations].slice(0, 20);
    setCalculations(updated);
    localStorage.setItem('pricingHistory', JSON.stringify(updated));
  };

  const reset = () => {
    setCost('');
    setMarginA('30');
    setMarginBCW('40');
    setShowBreakdown(false);
  };

  const clearHistory = () => {
    if (confirm('Clear all history?')) {
      setCalculations([]);
      localStorage.removeItem('pricingHistory');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <Link to="/" className="text-sm text-amber-600 hover:underline flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Home
          </Link>
          <h1 className="text-2xl font-bold mt-2">Pricing Formula Calculator</h1>
          <p className="text-sm text-slate-600 mt-1">Calculate pricing with shipping & margins</p>
        </div>
      </header>

      <div className="mb-6 flex gap-3">
        <button onClick={() => setCurrency('CAD')} className={`px-4 py-2 rounded-full font-semibold ${currency === 'CAD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>CAD</button>
        <button onClick={() => setCurrency('USD')} className={`px-4 py-2 rounded-full font-semibold ${currency === 'USD' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>USD</button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <label className="block text-sm font-medium text-slate-700">Cost ({currency})</label>
          <input type="number" value={cost} onChange={e => setCost(e.target.value)} onBlur={saveToHistory} step="0.01" min="0" placeholder="0.00" className="mt-2 block w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg"/>

          <label className="block mt-4 text-sm font-medium text-slate-700">Margin A (%)</label>
          <input type="number" value={marginA} onChange={e => setMarginA(e.target.value)} step="0.1" min="0" max="99" className="mt-2 block w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg"/>

          <label className="block mt-4 text-sm font-medium text-slate-700">Margin B/C/Website (%)</label>
          <input type="number" value={marginBCW} onChange={e => setMarginBCW(e.target.value)} step="0.1" min="0" max="99" className="mt-2 block w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 text-lg"/>

          <div className="mt-6 flex gap-3">
            <button onClick={reset} className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition">Reset</button>
            <button onClick={() => setShowBreakdown(!showBreakdown)} className="flex-1 bg-gray-200 text-slate-700 py-3 rounded-lg hover:bg-gray-300 transition">{showBreakdown ? 'Hide' : 'Show'} Breakdown</button>
          </div>
        </section>

        <aside className="space-y-4">
          {result && (
            <>
              <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border">
                <div className="text-sm text-slate-600">Price A</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{currency} ${result.priceA}</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border">
                <div className="text-sm text-slate-600">Price B/C/Website</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{currency} ${result.priceBCW}</div>
              </div>
              {showBreakdown && (
                <div className="p-4 rounded-lg bg-white border">
                  <h3 className="font-semibold mb-2">Breakdown</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Cost:</span><span>{currency} ${result.costCAD}</span></div>
                    <div className="flex justify-between"><span>Shipping ({currency === 'CAD' ? '3%' : '4%'}):</span><span>{currency} ${result.shipping}</span></div>
                    <div className="flex justify-between font-semibold border-t pt-1"><span>Total Cost:</span><span>{currency} ${result.totalCost}</span></div>
                  </div>
                </div>
              )}
            </>
          )}

          {calculations.length > 0 && (
            <div className="p-4 rounded-lg bg-gray-50 border max-h-64 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">History</h4>
                <button onClick={clearHistory} className="text-xs text-red-600 hover:underline">Clear</button>
              </div>
              <div className="space-y-2">
                {calculations.map((calc, idx) => (
                  <div key={idx} className="text-xs p-2 bg-white rounded border">
                    <div className="font-semibold">{calc.currency} • ${calc.cost.toFixed(2)}</div>
                    <div className="text-slate-600">A: ${calc.priceA.toFixed(2)} • B: ${calc.priceB.toFixed(2)}</div>
                    <div className="text-slate-500">{calc.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ==================== AUTH PAGES ====================
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      let msg = 'Could not sign in. Please check your email and password.';
      if (err.code === 'auth/user-not-found') msg = 'No account found with that email.';
      else if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      setError(msg);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-slate-100 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-slate-500">Access your calculators securely.</p>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-sky-600 hover:text-sky-700 font-medium">Forgot password?</Link>
          </div>

          <button type="submit" className="w-full bg-sky-600 text-white py-2.5 rounded-lg hover:bg-sky-700 font-semibold">Sign in</button>
        </form>

        <div className="mt-6 flex items-center">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="mx-3 text-xs uppercase tracking-wide text-slate-400 font-semibold">or</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        <button onClick={handleGoogleSignIn} className="mt-4 w-full border border-slate-200 bg-white px-4 py-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2">
          <span className="font-semibold text-slate-800">Continue with Google</span>
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/signup" className="font-semibold text-sky-600 hover:text-sky-700">Create one</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await sendEmailVerification(cred.user);
    } catch (err) {
      let msg = 'Could not create account.';
      if (err.code === 'auth/email-already-in-use') msg = 'Email already in use.';
      else if (err.code === 'auth/weak-password') msg = 'Password too weak.';
      setError(msg);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-slate-100 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <button type="submit" className="w-full bg-sky-600 text-white py-2.5 rounded-lg hover:bg-sky-700 font-semibold">Sign up</button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError('Could not send reset email.');
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-slate-100 p-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-4">Reset Password</h1>
        {sent ? (
          <div className="text-green-700 bg-green-50 border border-green-200 rounded p-3 mb-4">Check your email for reset link.</div>
        ) : (
          <>
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"/>
              </div>
              <button type="submit" className="w-full bg-sky-600 text-white py-2.5 rounded-lg hover:bg-sky-700 font-semibold">Send Reset Email</button>
            </form>
          </>
        )}
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-sky-600 hover:text-sky-700">Back to Sign In</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function VerifyEmailPage() {
  const { user } = useAuthState();
  const [checking, setChecking] = useState(false);

  const checkVerification = async () => {
    setChecking(true);
    await reload(user);
    setChecking(false);
    if (user.emailVerified) window.location.href = '/';
  };

  const resendEmail = async () => {
    try {
      await sendEmailVerification(user);
      alert('Verification email sent!');
    } catch (err) {
      alert('Could not send email.');
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-slate-100 p-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-4">Verify Your Email</h1>
        <p className="text-slate-600 mb-4">We sent a verification email to <strong>{user?.email}</strong>. Click the link in the email to continue.</p>
        <div className="space-y-3">
          <button onClick={checkVerification} disabled={checking} className="w-full bg-sky-600 text-white py-2.5 rounded-lg hover:bg-sky-700 font-semibold">
            {checking ? 'Checking...' : 'I\'ve Verified'}
          </button>
          <button onClick={resendEmail} className="w-full border border-slate-300 bg-white py-2.5 rounded-lg hover:bg-slate-50">Resend Email</button>
          <button onClick={() => signOut(auth)} className="w-full text-slate-600 hover:text-slate-800">Sign Out</button>
        </div>
      </div>
    </AuthLayout>
  );
}

function HomePage() {
  const { user } = useAuthState();

  return (
    <PageShell>
      <header className="max-w-5xl mx-auto mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="#EEF2FF"/>
              <path d="M7 8h10M7 12h6" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-3xl font-extrabold">Calculator Collection</h1>
          </div>
          <LogoutButton />
        </div>
        <p className="mt-4 text-slate-600 max-w-2xl">A clean collection of calculators. Click a card to open it.</p>
      </header>

      <main className="max-w-5xl mx-auto">
        <section className="grid gap-6 sm:grid-cols-2">
          <Link to="/margin" className="group block bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transform hover:-translate-y-1 transition">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#EEF2FF"/>
                    <path d="M8 12h8M8 16h4" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Margin & Revenue
                </h2>
                <p className="mt-2 text-slate-600">Calculate margin, revenue and cost with live USD conversion.</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition text-indigo-500">→</div>
            </div>
          </Link>

          <Link to="/pricing" className="group block bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transform hover:-translate-y-1 transition">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5" fill="#4F46E5"/>
                  </svg>
                  Pricing Formula
                </h2>
                <p className="mt-2 text-slate-600">CAD & USD pricing: shipping 3%/4%, custom margins, live exchange rate.</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition text-indigo-500">→</div>
            </div>
          </Link>
        </section>
      </main>
    </PageShell>
  );
}

function LogoutButton() {
  const signout = () => signOut(auth);
  return (
    <button onClick={signout} className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 shadow hover:bg-slate-50">
      Sign out
    </button>
  );
}

// ==================== MAIN APP ====================
function App() {
  return (
    <BrowserRouter basename="/calculator-react">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/" element={<Protected><HomePage /></Protected>} />
        <Route path="/margin" element={<Protected><PageShell><div className="max-w-5xl mx-auto"><MarginCalculator /></div></PageShell></Protected>} />
        <Route path="/pricing" element={<Protected><PageShell><div className="max-w-5xl mx-auto"><PricingCalculator /></div></PageShell></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
