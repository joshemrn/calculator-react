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

// ==================== THEME SYSTEM ====================
const ThemeContext = React.createContext();

function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('calculatorTheme') || 'bold';
  });

  const setTheme = (newTheme) => {
    localStorage.setItem('calculatorTheme', newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

// ==================== AI CHATBOT ====================
function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your margin calculation assistant.\n\nI can help you with:\n• Margin, markup, pricing calculations\n• Currency conversions (USD ↔ CAD)\n• Percentage & math (30% of 130)\n• Profit, discount, tax, ROI\n• Tips, interest, averages\n• And much more!\n\nJust ask naturally or type "help" for examples! 😊' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const [cadToUsd, setCadToUsd] = useState(0.72);
  const [usdToCad, setUsdToCad] = useState(1.39);
  const [manualRate, setManualRate] = useState(null);

  useEffect(() => {
    // Fetch live exchange rates with fallback
    fetch('https://api.exchangerate.host/latest?base=USD&symbols=CAD')
      .then(r => r.json())
      .then(d => {
        if (d.rates && d.rates.CAD) {
          setUsdToCad(d.rates.CAD);
          setCadToUsd((1 / d.rates.CAD));
        }
      })
      .catch(() => {
        // Fallback rates if API fails
        setUsdToCad(1.39);
        setCadToUsd(0.72);
      });
  }, []);

  const extractNumbers = (text) => {
    const numbers = text.match(/\d+\.?\d*/g);
    return numbers ? numbers.map(n => parseFloat(n)) : [];
  };

  // Core calculation functions
  const marginFromCostAndPrice = (cost, price) => {
    return ((price - cost) / price * 100);
  };

  const priceFromCostAndMargin = (cost, margin) => {
    return cost / (1 - margin / 100);
  };

  const costFromPriceAndMargin = (price, margin) => {
    return price * (1 - margin / 100);
  };

  const markupFromMargin = (margin) => {
    return (margin / (100 - margin)) * 100;
  };

  const marginFromMarkup = (markup) => {
    return (markup / (100 + markup)) * 100;
  };

  const performCalculation = (question) => {
    const q = question.toLowerCase();
    const numbers = extractNumbers(question);

    // Simple greetings and chat
    if (q.match(/^(hi|hello|hey|good morning|good afternoon|good evening)$/)) {
      return `👋 Hey there! I'm your margin calculation assistant. How can I help you today?`;
    }
    
    if (q.includes('how are you') || q.includes('how r u')) {
      return `I'm doing great, thanks for asking! 😊 Ready to help with calculations. What would you like to calculate?`;
    }
    
    if (q.includes('thank') || q.includes('thx') || q.includes('thanks')) {
      return `You're welcome! 😊 Let me know if you need anything else!`;
    }
    
    if (q.match(/^(bye|goodbye|see you|cya)$/)) {
      return `Goodbye! 👋 Come back anytime you need help with calculations!`;
    }

    if (q.includes('who are you') || q.includes('what are you')) {
      return `I'm your AI margin calculation assistant! 🤖 I can help you with:\n• Margin calculations\n• Markup conversions\n• Pricing formulas\n• Currency conversions\n• Percentage calculations\n• And much more!\n\nJust ask me anything!`;
    }

    if (q.includes('help') || q === '?') {
      return `🆘 **Here's what I can do:**\n\n**Calculations:**\n• "30% of 130" - Percentage\n• "Calculate margin with cost 50 and price 100"\n• "What price for cost 60 and margin 40%?"\n• "Convert 50% markup to margin"\n• "Cost 10 + freight 2 + duties 1, margin 40%"\n\n**Currency:**\n• "Convert 100 USD to CAD"\n• "Set rate 1.40" - Override exchange rate\n\n**Math:**\n• "What is 25 + 75?"\n• "150 - 30"\n• "12 × 8" or "12 * 8"\n• "100 / 4"\n\nJust type your question naturally!`;
    }

    // Simple percentage calculation: "30% of 130" or "what is 30% of 130"
    if ((q.includes('%') && q.includes('of')) || (q.match(/\d+%?\s*of\s*\d+/))) {
      if (numbers.length >= 2) {
        const percent = numbers[0];
        const amount = numbers[1];
        const result = (percent / 100 * amount).toFixed(2);
        return `**${result}**`;
      }
    }

    // Percentage increase/decrease
    if ((q.includes('increase') || q.includes('decrease')) && q.includes('%')) {
      if (numbers.length >= 2) {
        const amount = numbers[0];
        const percent = numbers[1];
        const change = (amount * percent / 100).toFixed(2);
        const result = q.includes('increase') 
          ? (parseFloat(amount) + parseFloat(change)).toFixed(2)
          : (parseFloat(amount) - parseFloat(change)).toFixed(2);
        
        return `**${result}**`;
      }
    }

    // What percentage is X of Y
    if ((q.includes('what') || q.includes('what\'s')) && q.includes('percentage') && q.includes('of')) {
      if (numbers.length >= 2) {
        const part = numbers[0];
        const whole = numbers[1];
        const percent = (part / whole * 100).toFixed(2);
        return `**${percent}%**`;
      }
    }

    // Basic arithmetic - Addition
    if ((q.includes('+') || q.includes('plus') || q.includes('add')) && numbers.length >= 2) {
      const sum = numbers.reduce((a, b) => a + b, 0);
      return `**${sum.toFixed(2)}**`;
    }

    // Basic arithmetic - Subtraction
    if ((q.includes('-') || q.includes('minus') || q.includes('subtract')) && numbers.length >= 2) {
      const diff = numbers.reduce((a, b) => a - b);
      return `**${diff.toFixed(2)}**`;
    }

    // Basic arithmetic - Multiplication
    if ((q.includes('×') || q.includes('*') || q.includes('multiply') || q.includes('times')) && numbers.length >= 2) {
      const product = numbers.reduce((a, b) => a * b, 1);
      return `**${product.toFixed(2)}**`;
    }

    // Basic arithmetic - Division
    if ((q.includes('/') || q.includes('÷') || q.includes('divide') || q.includes('divided')) && numbers.length >= 2) {
      const quotient = numbers.reduce((a, b) => a / b);
      return `**${quotient.toFixed(2)}**`;
    }

    // Profit calculation
    if (q.includes('profit') && numbers.length >= 2) {
      const price = numbers[0];
      const cost = numbers[1];
      const profit = price - cost;
      return `**$${profit.toFixed(2)}**`;
    }

    // Discount calculation
    if (q.includes('discount') && numbers.length >= 2) {
      const price = numbers[0];
      const discount = numbers[1];
      const savings = (price * discount / 100).toFixed(2);
      const final = (price - savings).toFixed(2);
      return `**$${final}**`;
    }

    // Tax calculation
    if (q.includes('tax') && numbers.length >= 2) {
      const amount = numbers[0];
      const taxRate = numbers[1];
      const tax = (amount * taxRate / 100).toFixed(2);
      const total = (parseFloat(amount) + parseFloat(tax)).toFixed(2);
      return `**$${total}**`;
    }

    // Break-even calculation
    if (q.includes('break even') || q.includes('breakeven')) {
      if (numbers.length >= 2) {
        const fixedCosts = numbers[0];
        const pricePerUnit = numbers.length >= 3 ? numbers[1] : numbers[0];
        const costPerUnit = numbers.length >= 3 ? numbers[2] : numbers[1];
        const breakEven = Math.ceil(fixedCosts / (pricePerUnit - costPerUnit));
        return `**${breakEven} units**`;
      }
    }

    // ROI calculation (Return on Investment)
    if ((q.includes('roi') || q.includes('return on investment')) && numbers.length >= 2) {
      const gain = numbers[0];
      const cost = numbers[1];
      const roi = ((gain - cost) / cost * 100).toFixed(2);
      return `**${roi}%**`;
    }

    // Tip calculator
    if (q.includes('tip') && numbers.length >= 2) {
      const bill = numbers[0];
      const tipPercent = numbers[1];
      const tip = (bill * tipPercent / 100).toFixed(2);
      const total = (parseFloat(bill) + parseFloat(tip)).toFixed(2);
      return `**$${total}**`;
    }

    // Simple interest
    if (q.includes('interest') && numbers.length >= 3) {
      const principal = numbers[0];
      const rate = numbers[1];
      const time = numbers[2];
      const interest = (principal * rate * time / 100).toFixed(2);
      const total = (parseFloat(principal) + parseFloat(interest)).toFixed(2);
      return `**$${total}**`;
    }

    // Average calculation
    if ((q.includes('average') || q.includes('mean')) && numbers.length >= 2) {
      const avg = (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(2);
      return `**${avg}**`;
    }

    // Manual rate override
    if (q.includes('set rate') && numbers.length >= 1) {
      const rate = numbers[0];
      setManualRate(rate);
      setUsdToCad(rate);
      setCadToUsd(1 / rate);
      return `✅ **Exchange Rate Updated**\n\n1 USD = $${rate.toFixed(4)} CAD\n1 CAD = $${(1/rate).toFixed(4)} USD\n\nThis rate will be used for all conversions until you refresh the page.`;
    }

    // Currency conversion CAD to USD
    if ((q.includes('convert') && q.includes('cad')) || (q.includes('to usd') && numbers.length >= 1)) {
      const cad = numbers[0];
      const rate = manualRate ? (1 / manualRate) : cadToUsd;
      const usd = (cad * rate).toFixed(2);
      return `**$${usd} USD**`;
    }

    // Currency conversion USD to CAD
    if ((q.includes('convert') && q.includes('usd')) || (q.includes('to cad') && numbers.length >= 1)) {
      const usd = numbers[0];
      const rate = manualRate ? manualRate : usdToCad;
      const cad = (usd * rate).toFixed(2);
      return `**$${cad} CAD**`;
    }

    // Complex natural language: "cost X, margin Y%, what's price in CAD/USD"
    // IMPORTANT: Questions like "if cost is 13 USD what is 3% margin?" mean "what price gives 3% margin"
    if ((q.includes('cost') && q.includes('margin') && (q.includes('price') || q.includes('selling') || q.includes('what'))) ||
        (q.includes('if cost') && q.includes('margin'))) {
      if (numbers.length >= 2) {
        // When someone asks "if cost is 13 what is 3% margin"
        // They want: what price to sell at for 3% margin with cost of 13
        // First number is usually cost, second is margin %
        let cost = numbers[0];
        let margin = numbers[1];
        
        // Smart detection: if second number is very small (< 1) it might be a decimal margin
        // if first number is small (< 100) and second is larger, they might be in order
        // Pattern: "cost X" usually comes before "margin Y%"
        const costIndex = q.indexOf('cost');
        const marginIndex = q.indexOf('margin');
        
        // If margin appears first in the sentence, swap them
        if (marginIndex > 0 && marginIndex < costIndex) {
          [cost, margin] = [margin, cost];
        }
        
        // Calculate price from cost and margin
        const price = priceFromCostAndMargin(cost, margin);
        
        let finalPrice = price;
        let currency = 'CAD';
        let explanation = '';
        
        // Check if USD cost needs CAD conversion
        if (q.includes('usd') && q.includes('cad')) {
          const rate = manualRate ? manualRate : usdToCad;
          if (q.includes('cost') && q.includes('usd') && !q.includes('price')) {
            // USD cost, want CAD price
            const cadCost = cost * rate;
            finalPrice = priceFromCostAndMargin(cadCost, margin);
            explanation = `\n\n💱 **Currency Conversion:**\nCost: ${cost} USD × ${rate.toFixed(4)} = $${cadCost.toFixed(2)} CAD\nThen applied ${margin}% margin`;
            currency = 'CAD';
          } else if (q.includes('price') && q.includes('cad')) {
            // CAD cost, want CAD price
            finalPrice = price;
            currency = 'CAD';
          }
        } else if (q.includes('usd')) {
          currency = 'USD';
        }
        
        return `**$${finalPrice.toFixed(2)} ${currency}**`;
      }
    }

    // Margin calculation from cost and price
    if ((q.includes('margin') && q.includes('cost') && (q.includes('price') || q.includes('revenue') || q.includes('selling'))) ||
        (q.includes('what') && q.includes('margin'))) {
      if (numbers.length >= 2) {
        const cost = numbers[0];
        const price = numbers[1];
        const margin = marginFromCostAndPrice(cost, price);
        
        return `**${margin.toFixed(2)}%**`;
      }
    }

    // Cost calculation from price and margin
    if (q.includes('cost') && (q.includes('price') || q.includes('revenue')) && q.includes('margin')) {
      if (numbers.length >= 2) {
        const price = numbers[0];
        const margin = numbers[1];
        const cost = costFromPriceAndMargin(price, margin);
        
        return `**$${cost.toFixed(2)}**`;
      }
    }

    // Markup to Margin conversion
    if ((q.includes('markup') && q.includes('margin')) || q.includes('markup to margin')) {
      if (numbers.length >= 1) {
        const markup = numbers[0];
        const margin = marginFromMarkup(markup);
        
        return `**${margin.toFixed(2)}%**`;
      }
    }

    // Margin to Markup conversion
    if ((q.includes('margin') && q.includes('markup')) || q.includes('margin to markup')) {
      if (numbers.length >= 1) {
        const margin = numbers[0];
        const markup = markupFromMargin(margin);
        
        return `**${markup.toFixed(2)}%**`;
      }
    }

    // Multi-cost margin (cost + freight + duties + overhead)
    if ((q.includes('freight') || q.includes('duties') || q.includes('overhead') || q.includes('multiple cost')) && 
        (q.includes('margin') || q.includes('price'))) {
      if (numbers.length >= 2) {
        const costs = numbers;
        const totalCost = costs.reduce((sum, c) => sum + c, 0);
        let margin = 35; // default
        
        // Check if margin is specified
        if (q.includes('margin') && q.match(/(\d+)%/)) {
          margin = parseFloat(q.match(/(\d+)%/)[1]);
        } else if (numbers.length > costs.length - 1) {
          margin = numbers[numbers.length - 1];
        }
        
        const price = priceFromCostAndMargin(totalCost, margin);
        
        return `**$${price.toFixed(2)}**`;
      }
    }

    // Simple price from cost and margin
    if ((q.includes('price') || q.includes('selling')) && q.includes('cost') && q.includes('margin')) {
      if (numbers.length >= 2) {
        const cost = numbers[0];
        const margin = numbers[1];
        const price = priceFromCostAndMargin(cost, margin);
        
        return `**$${price.toFixed(2)}**`;
      }
    }

    return null;
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    setTimeout(() => {
      const answer = performCalculation(input);
      const response = answer || "I can help with many calculations! Try:\n\n**Percentages & Math:**\n• \"30% of 130\"\n• \"What is 25 + 75?\"\n• \"150 - 30\"\n• \"12 × 8\"\n\n**Margin & Pricing:**\n• \"Margin with cost 50 and price 100\"\n• \"Price for cost 60, margin 40%\"\n• \"Convert 50% markup to margin\"\n\n**Business:**\n• \"Profit from price 100, cost 60\"\n• \"20% discount on 150\"\n• \"15% tip on 50\"\n• \"ROI: gain 1200, cost 1000\"\n\n**Currency:**\n• \"100 USD to CAD\"\n\nType 'help' for more examples!";
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setLoading(false);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-110"
        aria-label="Open AI Chat"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="11" r="1" fill="currentColor"/>
          <circle cx="8" cy="11" r="1" fill="currentColor"/>
          <circle cx="16" cy="11" r="1" fill="currentColor"/>
        </svg>
      </button>
    );
  }

  const isPro = theme === 'professional';

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-96 ${isPro ? 'bg-white border border-slate-200 shadow-xl' : 'bg-white shadow-2xl'} rounded-2xl flex flex-col max-h-[600px]`}>
      <div className={`${isPro ? 'bg-slate-900' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} text-white p-4 rounded-t-2xl flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`${isPro ? 'bg-slate-700' : 'bg-white/20'} p-2 rounded-lg`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 className={`${isPro ? 'text-sm' : 'text-base'} font-bold`}>Margin Assistant</h3>
            <p className="text-xs opacity-90">Ask me anything about margins</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user' 
                ? isPro ? 'bg-slate-900 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : isPro ? 'bg-white border border-slate-200 text-slate-900' : 'bg-white text-slate-900 shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className={`${isPro ? 'bg-white border border-slate-200' : 'bg-white shadow-sm'} rounded-2xl px-4 py-2.5`}>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about margins, pricing..."
            className={`flex-1 ${isPro ? 'border border-slate-200' : 'border-2 border-slate-200'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isPro ? 'focus:ring-slate-300' : 'focus:ring-indigo-400'} focus:border-transparent`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`${isPro ? 'bg-slate-900 hover:bg-slate-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'} text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Try: "what is margin?", "how to calculate price", "margin vs markup"</p>
      </div>
    </div>
  );
}

function AuthLayout({ children }) {
  const { user, loading } = useAuthState();
  if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center"><div>Loading...</div></div>;
  if (user && user.emailVerified) return <Navigate to="/" replace />;
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center py-12">{children}</div>;
}

function PageShell({ children }) {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-sky-50 text-slate-800 py-12 px-6">
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setTheme(theme === 'bold' ? 'professional' : 'bold')}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border-2 border-slate-200 hover:border-indigo-400 transition-all font-semibold text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8" fill="#64748b"/>
            <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {theme === 'bold' ? 'Professional' : 'Bold'} Design
        </button>
      </div>
      <AIChatbot />
      {children}
    </div>
  );
}

// ==================== MARGIN CALCULATOR ====================
function MarginCalculator() {
  const { theme } = useTheme();
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

  if (theme === 'professional') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <header className="mb-8 pb-6 border-b border-slate-100">
            <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">Margin Calculator</h1>
            <p className="text-sm text-slate-500 mt-1.5">Enter two values to calculate the third</p>
          </header>

          <main className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Cost (CAD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input type="number" value={cost} onChange={e => handleCostChange(e.target.value)} step="0.01" min="0" placeholder="0.00" className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Margin (%)</label>
                <div className="relative">
                  <input type="number" value={margin} onChange={e => handleMarginChange(e.target.value)} step="0.01" min="0" max="99.99" placeholder="0.00" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition"/>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Revenue (CAD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input type="number" value={revenue} onChange={e => handleRevenueChange(e.target.value)} step="0.01" min="0" placeholder="0.00" className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition"/>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button onClick={reset} className="flex-1 bg-slate-900 text-white py-2.5 px-4 rounded-lg hover:bg-slate-800 transition font-medium text-sm">
                  Reset
                </button>
                <button onClick={() => setShowHistory(!showHistory)} className="flex-1 border border-slate-200 bg-white py-2.5 px-4 rounded-lg hover:bg-slate-50 transition font-medium text-sm">
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600">Cost</span>
                    <span className="text-lg font-semibold text-slate-900">${(parseFloat(cost) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-slate-200">
                    <span className="text-sm text-slate-600">Margin</span>
                    <span className="text-lg font-semibold text-slate-900">{(parseFloat(margin) || 0).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-slate-200">
                    <span className="text-sm text-slate-600">Revenue</span>
                    <span className="text-lg font-semibold text-slate-900">${(parseFloat(revenue) || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide">USD Value</h4>
                  <span className="text-xs text-blue-600">1 CAD = ${exchangeRate.toFixed(4)}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold text-blue-600">${usdRevenue}</span>
                  <span className="text-sm text-blue-500">USD</span>
                </div>
              </div>

              {showHistory && history.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-slate-200 max-h-64 overflow-y-auto">
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">History</h4>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg text-xs">
                        <div className="font-semibold text-slate-900">Cost: ${item.cost} • Margin: {item.margin}%</div>
                        <div className="text-slate-500 mt-0.5">Revenue: ${item.revenue}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-1">
        <div className="bg-white rounded-[22px] p-8">
          <header className="flex items-center justify-between mb-8">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Home
              </Link>
              <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Margin Calculator</h1>
              <p className="text-slate-600 mt-2 font-medium">Enter two values to calculate the third • Live USD conversion</p>
            </div>
          </header>

          <main className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Cost (CAD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
                  <input type="number" value={cost} onChange={e => handleCostChange(e.target.value)} step="0.01" min="0" placeholder="0.00" className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-3 border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 transition-all"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Margin (%)</label>
                <div className="relative">
                  <input type="number" value={margin} onChange={e => handleMarginChange(e.target.value)} step="0.01" min="0" max="99.99" placeholder="0.00" className="w-full px-4 py-4 text-2xl font-bold border-3 border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all"/>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Revenue (CAD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
                  <input type="number" value={revenue} onChange={e => handleRevenueChange(e.target.value)} step="0.01" min="0" placeholder="0.00" className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-3 border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 transition-all"/>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={reset} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg">
                  Reset All
                </button>
                <button onClick={() => setShowHistory(!showHistory)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 px-6 rounded-xl hover:bg-slate-200 transform hover:scale-105 transition-all">
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100">
                <h3 className="text-xl font-black text-indigo-900 mb-4 flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2"/></svg>
                  Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-indigo-200">
                    <span className="font-semibold text-slate-600">Cost</span>
                    <span className="text-2xl font-black text-slate-900">${(parseFloat(cost) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-purple-200">
                    <span className="font-semibold text-slate-600">Margin</span>
                    <span className="text-2xl font-black text-purple-600">{(parseFloat(margin) || 0).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-pink-200">
                    <span className="font-semibold text-slate-600">Revenue</span>
                    <span className="text-2xl font-black text-slate-900">${(parseFloat(revenue) || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-green-900 uppercase tracking-wide">USD Conversion</h4>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-green-700">1 CAD = ${exchangeRate.toFixed(4)} USD</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-green-600">${usdRevenue}</span>
                  <span className="text-lg font-semibold text-green-700">USD</span>
                </div>
                <p className="text-xs text-green-600 mt-2 font-medium">Live exchange rate • Updates automatically</p>
              </div>

              {showHistory && history.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200 max-h-64 overflow-y-auto">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Recent Calculations</h4>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                        <div className="font-bold text-slate-900">Cost: ${item.cost} • Margin: {item.margin}%</div>
                        <div className="text-slate-600 mt-1">Revenue: ${item.revenue}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </main>

          <footer className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center font-medium">💡 Tip: Enter any two values to automatically calculate the third</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ==================== PRICING CALCULATOR ====================
function PricingCalculator() {
  const { theme } = useTheme();
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

  if (theme === 'professional') {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <header className="mb-8 pb-6 border-b border-slate-100">
            <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">Pricing Calculator</h1>
            <p className="text-sm text-slate-500 mt-1.5">Calculate pricing with shipping & margins</p>
          </header>

          <div className="mb-6 flex gap-3">
            <button onClick={() => setCurrency('CAD')} className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${currency === 'CAD' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              CAD
            </button>
            <button onClick={() => setCurrency('USD')} className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${currency === 'USD' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              USD
            </button>
          </div>

          {currency === 'USD' && (
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Exchange Rate</div>
                  <div className="text-xs text-blue-600 mt-0.5">1 USD = {exchangeRate.toFixed(4)} CAD</div>
                </div>
                <div className="text-2xl font-semibold text-blue-600">${exchangeRate.toFixed(4)}</div>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Cost ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input type="number" value={cost} onChange={e => setCost(e.target.value)} onBlur={saveToHistory} step="0.01" min="0" placeholder="0.00" className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Margin A (%)</label>
                <div className="relative">
                  <input type="number" value={marginA} onChange={e => setMarginA(e.target.value)} step="0.01" min="0" placeholder="30" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition"/>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Margin B/C/Wholesale (%)</label>
                <div className="relative">
                  <input type="number" value={marginBCW} onChange={e => setMarginBCW(e.target.value)} step="0.01" min="0" placeholder="40" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition"/>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button onClick={reset} className="flex-1 bg-slate-900 text-white py-2.5 px-4 rounded-lg hover:bg-slate-800 transition font-medium text-sm">
                  Reset
                </button>
                <button onClick={() => setShowBreakdown(!showBreakdown)} className="flex-1 border border-slate-200 bg-white py-2.5 px-4 rounded-lg hover:bg-slate-50 transition font-medium text-sm">
                  {showBreakdown ? 'Hide' : 'Show'} Details
                </button>
              </div>
            </section>

            <aside className="space-y-5">
              {result && (
                <>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-4">Pricing Results</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-slate-600">Price A</span>
                        <span className="text-lg font-semibold text-slate-900">${result.priceA}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-t border-slate-200">
                        <span className="text-sm text-slate-600">Price B/C/W</span>
                        <span className="text-lg font-semibold text-slate-900">${result.priceBCW}</span>
                      </div>
                    </div>
                  </div>

                  {showBreakdown && (
                    <div className="bg-white rounded-xl p-5 border border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Base Cost:</span>
                          <span className="font-medium">${result.costCAD}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Shipping ({currency === 'CAD' ? '3%' : '4%'}):</span>
                          <span className="font-medium">${result.shipping}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-200">
                          <span className="text-slate-900 font-semibold">Total Cost:</span>
                          <span className="font-semibold">${result.totalCost}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {calculations.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-slate-200 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">History</h4>
                    <button onClick={clearHistory} className="text-xs font-semibold text-red-600 hover:text-red-700">Clear</button>
                  </div>
                  <div className="space-y-2">
                    {calculations.map((calc, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${calc.currency === 'CAD' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{calc.currency}</span>
                          <span className="text-slate-500">{calc.timestamp}</span>
                        </div>
                        <div className="font-semibold text-slate-900">Cost: ${calc.cost.toFixed(2)}</div>
                        <div className="text-slate-600 mt-0.5">A: ${calc.priceA.toFixed(2)} • B/C: ${calc.priceB.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl shadow-2xl p-1">
        <div className="bg-white rounded-[22px] p-8">
          <header className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-sm mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to Home
            </Link>
            <h1 className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Pricing Calculator</h1>
            <p className="text-slate-600 mt-2 font-medium">Calculate pricing with automatic shipping & custom margins</p>
          </header>

          <div className="mb-8 flex gap-4">
            <button onClick={() => setCurrency('CAD')} className={`flex-1 px-6 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 ${currency === 'CAD' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              🇨🇦 CAD
            </button>
            <button onClick={() => setCurrency('USD')} className={`flex-1 px-6 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 ${currency === 'USD' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              🇺🇸 USD
            </button>
          </div>

          {currency === 'USD' && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"/></svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-900 uppercase tracking-wide">Exchange Rate</div>
                    <div className="text-xs text-green-700 font-medium">Updated live from market data</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-green-600">${exchangeRate.toFixed(4)}</div>
                  <div className="text-xs font-semibold text-green-700">1 USD = {exchangeRate.toFixed(4)} CAD</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Cost ({currency})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">{currency === 'CAD' ? '$' : '$'}</span>
                  <input type="number" value={cost} onChange={e => setCost(e.target.value)} onBlur={saveToHistory} step="0.01" min="0" placeholder="0.00" className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-3 border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-amber-200 focus:border-amber-400 transition-all"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Margin A (%)</label>
                <div className="relative">
                  <input type="number" value={marginA} onChange={e => setMarginA(e.target.value)} step="0.1" min="0" max="99" className="w-full px-4 py-4 text-2xl font-bold border-3 border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"/>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Margin B/C/Website (%)</label>
                <div className="relative">
                  <input type="number" value={marginBCW} onChange={e => setMarginBCW(e.target.value)} step="0.1" min="0" max="99" className="w-full px-4 py-4 text-2xl font-bold border-3 border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-red-200 focus:border-red-400 transition-all"/>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">%</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={reset} className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-4 px-6 rounded-xl hover:from-amber-700 hover:to-orange-700 transform hover:scale-105 transition-all shadow-lg">
                  Reset All
                </button>
                <button onClick={() => setShowBreakdown(!showBreakdown)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 px-6 rounded-xl hover:bg-slate-200 transform hover:scale-105 transition-all">
                  {showBreakdown ? 'Hide' : 'Show'} Breakdown
                </button>
              </div>
            </section>

            <aside className="space-y-6">
              {result && (
                <>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                    <div className="text-sm font-bold text-amber-900 uppercase tracking-wide mb-2">Price A</div>
                    <div className="text-5xl font-black text-amber-600">{currency} ${result.priceA}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                    <div className="text-sm font-bold text-orange-900 uppercase tracking-wide mb-2">Price B/C/Website</div>
                    <div className="text-5xl font-black text-orange-600">{currency} ${result.priceBCW}</div>
                  </div>
                  {showBreakdown && (
                    <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                      <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2"/></svg>
                        Cost Breakdown
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-600">Product Cost</span>
                          <span className="text-xl font-black text-slate-900">{currency} ${result.costCAD}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-600">Shipping ({currency === 'CAD' ? '3%' : '4%'})</span>
                          <span className="text-xl font-black text-slate-900">{currency} ${result.shipping}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-amber-50 rounded-lg px-3 border-2 border-amber-200">
                          <span className="font-black text-amber-900">Total Cost</span>
                          <span className="text-2xl font-black text-amber-600">{currency} ${result.totalCost}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {calculations.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200 max-h-80 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Calculation History</h4>
                    <button onClick={clearHistory} className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1 rounded-full">Clear All</button>
                  </div>
                  <div className="space-y-2">
                    {calculations.map((calc, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border-2 border-slate-200 hover:border-amber-300 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${calc.currency === 'CAD' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{calc.currency}</span>
                          <span className="text-xs text-slate-500 font-medium">{calc.timestamp}</span>
                        </div>
                        <div className="font-black text-slate-900">Cost: ${calc.cost.toFixed(2)}</div>
                        <div className="text-sm text-slate-600 mt-1 font-semibold">Price A: ${calc.priceA.toFixed(2)} • B/C: ${calc.priceB.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          <footer className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center font-medium">💡 Shipping is automatically calculated at {currency === 'CAD' ? '3%' : '4%'} based on your selected currency</p>
          </footer>
        </div>
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
  const { theme } = useTheme();

  if (theme === 'professional') {
    return (
      <PageShell>
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 pb-8 border-b border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">Calculator Suite</h1>
                <p className="text-sm text-slate-500 mt-1.5">Professional pricing and margin calculators</p>
              </div>
              <LogoutButton />
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-700">Signed in as <span className="font-semibold text-slate-900">{user?.email}</span></p>
            </div>
          </header>

          <main>
            <section className="grid gap-6 sm:grid-cols-2">
              <Link to="/margin" className="group block bg-white rounded-xl p-6 hover:shadow-lg border border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M8 12h8M8 16h4" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition text-slate-400 text-xl">→</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Margin & Revenue</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">Calculate margin, revenue and cost with live CAD→USD conversion</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full text-xs font-semibold text-blue-700">
                  CAD → USD
                </div>
              </Link>

              <Link to="/pricing" className="group block bg-white rounded-xl p-6 hover:shadow-lg border border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8" fill="#475569"/>
                    </svg>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition text-slate-400 text-xl">→</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Pricing Formula</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">CAD & USD pricing with shipping (3%/4%) and custom margins</p>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full text-xs font-semibold text-green-700">
                    USD → CAD
                  </div>
                  <div className="inline-flex px-2 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                    SHIPPING
                  </div>
                </div>
              </Link>
            </section>
          </main>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="max-w-5xl mx-auto mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M7 8h10M7 12h6M7 16h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">Calculator Hub</h1>
              <p className="text-lg text-slate-600 font-medium mt-1">Professional pricing & margin tools</p>
            </div>
          </div>
          <LogoutButton />
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200">
          <p className="text-xl text-slate-700 font-semibold">Welcome back, <span className="text-indigo-600">{user?.email}</span></p>
          <p className="text-slate-600 mt-2">Choose a calculator below to get started with live exchange rates</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <section className="grid gap-8 sm:grid-cols-2">
          <Link to="/margin" className="group relative block bg-white rounded-3xl p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-[3px]">
              <div className="h-full w-full bg-white rounded-3xl"></div>
            </div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M8 12h8M8 16h4" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 text-3xl font-bold">→</div>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3">Margin & Revenue</h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">Calculate margin, revenue and cost with live CAD→USD conversion rates</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
                <span className="text-sm font-bold text-purple-700">CAD</span>
                <span className="text-purple-400">→</span>
                <span className="text-sm font-bold text-purple-700">USD</span>
              </div>
            </div>
          </Link>

          <Link to="/pricing" className="group relative block bg-white rounded-3xl p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-[3px]">
              <div className="h-full w-full bg-white rounded-3xl"></div>
            </div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5" fill="#F97316"/>
                  </svg>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-600 text-3xl font-bold">→</div>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3">Pricing Formula</h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">CAD & USD pricing with shipping rates (3%/4%), custom margins, and live exchange rates</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
                  <span className="text-sm font-bold text-orange-700">USD</span>
                  <span className="text-orange-400">→</span>
                  <span className="text-sm font-bold text-orange-700">CAD</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-full">
                  <span className="text-xs font-bold text-blue-700">SHIPPING</span>
                </div>
              </div>
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
root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
