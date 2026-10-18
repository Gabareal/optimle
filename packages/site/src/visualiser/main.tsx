import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setSiteRoot } from '../shared/load';
import { App } from './App';
import '../shared/styles.css';

// The Visualiser is the site root.
setSiteRoot('./');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
