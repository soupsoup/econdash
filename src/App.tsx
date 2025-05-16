import { HashRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </HashRouter>
  );
}

export default App;