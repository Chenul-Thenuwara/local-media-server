import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/public/Welcome';

import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import ForgotPassword from './pages/public/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Home from './pages/app/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            {/* Redirect root to home if authenticated, but for now we keep Welcome at / */}
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
