import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ isLogin }) => {
  if (!isLogin) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default ProtectedRoute;