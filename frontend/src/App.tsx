import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/public/Welcome';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        {/* We will add more routes later */}
      </Routes>
    </Router>
  );
}

export default App;
