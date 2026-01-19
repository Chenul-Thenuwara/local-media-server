import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/public/Welcome';

import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import ForgotPassword from './pages/public/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Home from './pages/app/Home';
import MovieDetail from './pages/app/MovieDetail';

// Core
import Discover from './pages/app/Discover';
import Search from './pages/app/Search';
import Watchlist from './pages/app/Watchlist';
import History from './pages/app/History';
import Notifications from './pages/app/Notifications';

// Profile
import AccountSettings from './pages/app/profile/AccountSettings';
import PlaybackSettings from './pages/app/profile/PlaybackSettings';
import DeviceSettings from './pages/app/profile/DeviceSettings';

// Libraries
import Movies from './pages/app/libraries/Movies';
import TVShows from './pages/app/libraries/TVShows';
import Music from './pages/app/libraries/Music';
import Photos from './pages/app/libraries/Photos';
import PersonalVideos from './pages/app/libraries/PersonalVideos';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminLibraries from './pages/admin/Libraries';
import MediaTools from './pages/admin/MediaTools';
import AdminUsers from './pages/admin/Users';
import ServerSettings from './pages/admin/ServerSettings';
import ServerLogs from './pages/admin/Logs';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected App Routes */}
        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/media/:id" element={<MovieDetail />} />
            <Route path="/media/tmdb/:type/:id" element={<MovieDetail />} />

            {/* Core */}
            <Route path="/discover" element={<Discover />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/history" element={<History />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Profile */}
            <Route path="/profile/account" element={<AccountSettings />} />
            <Route path="/profile/playback" element={<PlaybackSettings />} />
            <Route path="/profile/devices" element={<DeviceSettings />} />

            {/* Libraries */}
            <Route path="/libraries/movies" element={<Movies />} />
            <Route path="/libraries/tv" element={<TVShows />} />
            <Route path="/libraries/music" element={<Music />} />
            <Route path="/libraries/photos" element={<Photos />} />
            <Route path="/libraries/personal" element={<PersonalVideos />} />

            {/* Admin */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/libraries" element={<AdminLibraries />} />
            <Route path="/admin/tools" element={<MediaTools />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<ServerSettings />} />
            <Route path="/admin/logs" element={<ServerLogs />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
