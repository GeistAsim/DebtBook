import { createRoot } from 'react-dom/client';

// 1. Color theme variables
import './style/color-theme.css';

// 2. Global design tokens, resets, typography, and shared base styles
import './Main.css';

// 3. Component modular styles
import './style/nav.css';
import './style/home.css';
import './style/form.css';
import './style/modal.css';
import './style/login.css';
import './style/notification.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
