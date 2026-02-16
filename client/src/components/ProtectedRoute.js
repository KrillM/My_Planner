import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ isLogin, authChecked }) => {
  if (!authChecked) return null; // 또는 로딩 화면
  return isLogin ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;