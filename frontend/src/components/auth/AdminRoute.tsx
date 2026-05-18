import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute() {
  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    // ignore
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
