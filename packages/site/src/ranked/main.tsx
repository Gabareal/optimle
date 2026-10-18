import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setSiteRoot } from '../shared/load';
import { Ranked } from './Ranked';
import '../shared/styles.css';
import './ranked.css';

// The trainer lives at /ranked/, one level below the site root.
setSiteRoot('../');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Ranked />
  </StrictMode>,
);
