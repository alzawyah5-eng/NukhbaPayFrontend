import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Kiosk from './Kiosk';
import '../styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><Kiosk /></StrictMode>);
