# Calculator Suite (React)

A modern calculator application built with React and Firebase authentication. Features margin/revenue and pricing calculators with live currency conversion, dual theme support, and an AI-powered chatbot assistant.

## ✨ Features

- 🔐 **Firebase Authentication** - Email/Password & Google Sign-in with email verification
- 🤖 **AI Chatbot Assistant** - Performs calculations and answers margin-related questions
- 🎨 **Dual Theme System** - Toggle between Bold and Professional designs
- 💾 **Persistent Preferences** - Theme choice saved in localStorage
- 💱 **Live Currency Conversion** - Real-time CAD/USD exchange rates
- 📊 **Margin & Revenue Calculator** - Enter 2 values, auto-calculates the third
- 💰 **Pricing Formula Calculator** - Automatic shipping & custom margins
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 📝 **Calculation History** - Track and review previous calculations

## 🤖 AI Chatbot Assistant

An intelligent floating chatbot that can:

### Perform Calculations
- **Margin Calculation** - "Calculate margin with cost 50 and revenue 100"
- **Revenue Calculation** - "What price for cost 60 and margin 40%"
- **Cost Calculation** - "Calculate cost with revenue 150 and margin 40%"
- **Pricing with Shipping** - "Calculate price with cost 100, margin 30%, USD shipping"
- **Currency Conversion** - "Convert 100 CAD to USD" or "Convert 75 USD to CAD"

### Answer Questions
- What is margin? How to calculate it?
- Margin vs markup differences
- Pricing strategies and formulas
- Shipping calculations
- Exchange rate information
- How to use the calculators

**Access:** Click the purple chat bubble in the bottom-right corner on any page!

## 🎨 Theme Options

### Bold Theme (Default)
- Vibrant gradient borders (purple/pink, amber/orange)
- Large, bold typography (3XL-5XL fonts)
- Prominent exchange rate displays
- Enhanced hover effects and animations
- Eye-catching color schemes

### Professional Theme
- Clean, minimal design with subtle colors
- Refined typography and spacing
- Soft borders and shadows
- Corporate-friendly aesthetic
- Perfect for business presentations

**Toggle anytime** using the button in the top-right corner. Your choice is remembered!

## 🚀 Tech Stack

- **React 18.2.0** (via CDN - esm.sh)
- **React Router 6.22.3** (client-side routing)
- **Babel Standalone** (browser JSX transpilation)
- **Firebase Auth 9.6.1** (authentication)
- **Tailwind CSS** (via CDN - utility-first styling)
- **Exchange Rate API** (live currency data)
- **No build step required!**

## 🌐 Live Demo

**Main Branch:** https://joshemrn.github.io/calculator-react/  
**React-2 Branch (Latest):** Switch GitHub Pages to `react-2` branch for newest features

## 💻 Local Development

Simply serve the files with any static server:

```bash
# Python
python -m http.server 8000

# Node.js (http-server)
npx http-server

# VS Code Live Server extension
```

Then visit `http://localhost:8000/` (or `http://localhost:8000/calculator-react/` if needed)

## 📦 Deployment to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `react-2` branch (or `main` for stable version)
4. Your app will be live at `https://yourusername.github.io/calculator-react/`

### Branches
- **main** - Stable production version
- **react-2** - Latest with bold modern design + professional theme toggle + AI chatbot

## 📁 Project Structure

```
calculator-react/
├── index.html          # Entry point with Babel transpiler & SPA redirect
├── main.js            # Complete React app (1400+ lines)
│                      # - AI Chatbot with calculation engine
│                      # - Theme system with localStorage
│                      # - All calculator components
│                      # - Auth pages (Login/Signup/Verify)
│                      # - Dual theme rendering
├── firebase-config.js # Firebase credentials
├── 404.html          # GitHub Pages SPA routing support
└── README.md         # Documentation
```

## 🔧 Firebase Setup

The app uses Firebase for authentication. To use your own Firebase project:

1. Create a project at https://console.firebase.google.com
2. Enable **Authentication** methods:
   - Email/Password
   - Google Sign-in
3. Update `firebase-config.js` with your credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-app.firebaseapp.com",
     projectId: "your-project-id",
     // ...
   };
   ```

## 📊 Features Detail

### AI Chatbot Assistant
- **Instant Calculations** - No need to navigate to calculator pages
- **Natural Language** - Ask questions in plain English
- **Live Exchange Rates** - Real-time CAD/USD conversions
- **Smart Parsing** - Extracts numbers from your questions
- **Knowledge Base** - 15+ margin/pricing topics covered
- **Calculation History** - View all chat calculations in the conversation
- **Theme Adaptive** - Matches your selected theme (Bold/Professional)

### Margin & Revenue Calculator
- **Smart Calculation** - Enter any 2 of: Cost, Margin %, Revenue → auto-calculates third
- **Live USD Conversion** - Real-time CAD→USD exchange rates
- **History Tracking** - Recent calculations saved to localStorage
- **Dual Currency Display** - Shows both CAD and USD values
- **Theme Support** - Bold gradients or professional minimal design

### Pricing Calculator
- **Multi-Currency** - Toggle between CAD and USD pricing
- **Automatic Shipping** - 3% for CAD, 4% for USD (industry standard)
- **Multiple Margin Tiers** - Price A, Price B/C/Wholesale
- **Live Exchange Rates** - USD→CAD conversion with visual indicator
- **Calculation History** - Timestamped records with currency badges
- **Cost Breakdown** - View shipping and total cost details
- **Theme Variants** - Vibrant gradients or clean professional look

### Theme System
- **Persistent Choice** - Saved in localStorage, remembered on return
- **Instant Toggle** - Switch themes without page reload
- **Consistent Experience** - All pages (Home, Margin, Pricing, Chatbot) adapt
- **No Performance Hit** - Conditional rendering, no CSS switching

## 🎯 Usage Tips

1. **First Visit** - Sign up with email or Google account
2. **Email Verification** - Check your inbox and verify email
3. **Choose Theme** - Click top-right button to switch Bold ↔ Professional
4. **Try the Chatbot** - Click the purple chat bubble and ask "Calculate margin with cost 50 and revenue 100"
5. **Calculators** - Access from home page cards or use chatbot for quick calculations
6. **History** - Click "Show History" to review past calculations
7. **Exchange Rates** - Updates automatically from live API
8. **Currency Conversion** - Ask chatbot "Convert 100 CAD to USD"

## 🔒 Security

- Firebase handles all authentication securely
- Email verification required before calculator access
- Protected routes ensure only authenticated users can access calculators
- No sensitive data stored in localStorage (only preferences & history)

## 📝 License

MIT
