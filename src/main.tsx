import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Block multi-touch pinch-to-zoom gestures
document.addEventListener(
  'touchstart',
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  },
  { passive: false }
);

// Block Safari gesture events (pinch and rotation)
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

// Block fast double-tap to zoom
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);

// Block mousewheel zoom (Ctrl + scroll)
document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  },
  { passive: false }
);

// Block keyboard shortcuts for zoom (Ctrl/Cmd + '+', '-', '0')
document.addEventListener('keydown', (e) => {
  if (
    (e.ctrlKey || e.metaKey) &&
    (e.key === '=' || e.key === '-' || e.key === '0' || e.key === '+')
  ) {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
