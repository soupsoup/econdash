import { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import { fetchAllIndicatorsData } from './services/api';
import { IndicatorData } from './types';

// Add minimal debug logging
console.log('App.tsx: Environment:', {
  isProd: import.meta.env.PROD,
  nodeEnv: import.meta.env.NODE_ENV
});
console.log('App.tsx: App component is about to render');

function App() {
  return (
    <HashRouter>
      <div>Test: App is rendering with HashRouter</div>
    </HashRouter>
  );
}

export default App;