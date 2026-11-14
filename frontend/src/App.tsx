import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { Layout } from './components/layout/Layout.js';
import { Overview } from './pages/Overview.js';
import { Discover } from './pages/Discover.js';
import { ListeningHistory } from './pages/ListeningHistory.js';
import { Artists } from './pages/Artists.js';
import { Tracks } from './pages/Tracks.js';
import { Recaps } from './pages/Recaps.js';
import { SharedRecapView } from './pages/SharedRecapView.js';
import { Friends } from './pages/Friends.js';
import { Profile } from './pages/Profile.js';
import { Settings } from './pages/Settings.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { Disc3 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
        <Disc3 className="w-10 h-10 text-brand-emerald animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Tuning frequencies...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recap/share/:shareToken" element={<SharedRecapView />} />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="discover" element={<Discover />} />
        <Route path="history" element={<ListeningHistory />} />
        <Route path="artists" element={<Artists />} />
        <Route path="tracks" element={<Tracks />} />
        <Route path="recaps" element={<Recaps />} />
        <Route path="friends" element={<Friends />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

