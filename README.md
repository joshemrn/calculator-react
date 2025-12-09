# Calculator Suite (React)

A modern calculator application built with React and Firebase authentication. Features margin/revenue and pricing calculators with live currency conversion.

## Features

- 🔐 Firebase Authentication (Email/Password & Google Sign-in)
- 📱 Fully responsive design with Tailwind CSS
- 💱 Live currency conversion (CAD/USD)
- 📊 Margin & Revenue Calculator
- 💰 Pricing Formula Calculator with shipping calculations
- 💾 Local storage for calculation history
- 🎨 Clean, modern UI

## Tech Stack

- **React 18** (via CDN - esm.sh)
- **React Router 6** (for client-side routing)
- **Firebase Authentication**
- **Tailwind CSS** (via CDN)
- **No build step required!**

## Local Development

Simply serve the files with any static server:

```bash
# Python
python -m http.server 8000

# Node.js (http-server)
npx http-server

# VS Code Live Server extension
```

Then visit `http://localhost:8000/calculator-react/`

## Deployment to GitHub Pages

1. Push this repo to GitHub
2. Go to Settings → Pages
3. Set source to `main` branch
4. Your app will be live at `https://yourusername.github.io/calculator-react/`

## Project Structure

```
calculator-react/
├── index.html          # Entry point with SPA redirect script
├── main.js            # Complete React app with all components
├── firebase-config.js # Firebase configuration
├── 404.html          # GitHub Pages SPA routing support
└── README.md         # This file
```

## Firebase Setup

The app uses Firebase for authentication. The current config connects to an existing Firebase project. To use your own:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password and Google)
3. Update `firebase-config.js` with your credentials

## Features Detail

### Margin & Revenue Calculator
- Enter any 2 of: Cost, Margin %, Revenue
- Automatically calculates the third value
- Live USD conversion
- Saves values to localStorage

### Pricing Calculator
- Support for CAD and USD
- Automatic shipping calculation (3% CAD, 4% USD)
- Multiple margin tiers (A, B/C/Website)
- Calculation history with timestamps
- Cost breakdown view

## License

MIT
